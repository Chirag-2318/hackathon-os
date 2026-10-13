package com.hackathonos.backend.members;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.dto.*;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class MemberService {

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "LEADER", "BUILDER", "DESIGNER", "PRESENTER", "DOMAIN_EXPERT", "QA"
    );
    private static final Set<String> ALLOWED_SKILLS = Set.of(
            "Frontend", "Backend", "ML/AI", "Design", "Presenter", "Domain", "QA/Demo"
    );

    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final RoomInvitationRepository invitationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final MemberMapper memberMapper;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final com.hackathonos.backend.tasks.TaskRepository taskRepository;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;

    public MemberService(RoomMemberRepository memberRepository,
                         RoomMemberSkillRepository skillRepository,
                         RoomInvitationRepository invitationRepository,
                         RoomRepository roomRepository,
                         UserRepository userRepository,
                         RoomAccess roomAccess,
                         MemberMapper memberMapper,
                         ActivityLogger activityLogger,
                         NotificationService notificationService,
                         com.hackathonos.backend.tasks.TaskRepository taskRepository,
                         com.hackathonos.backend.events.RoomEventService roomEventService) {
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.invitationRepository = invitationRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.memberMapper = memberMapper;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.taskRepository = taskRepository;
        this.roomEventService = roomEventService;
    }

    /**
     * Lists active members and pending invitations for a room.
     * Orders leader first, followed by members by join date, then pending invites.
     */
    public MemberListResponse listMembers(User user, UUID roomId) {
        roomAccess.requireMember(roomId, user);

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        members.sort((a, b) -> {
            boolean aLeader = "LEADER".equalsIgnoreCase(a.getRole());
            boolean bLeader = "LEADER".equalsIgnoreCase(b.getRole());
            if (aLeader != bLeader) return aLeader ? -1 : 1;
            return a.getJoinedAt().compareTo(b.getJoinedAt());
        });

        Map<UUID, User> users = loadUsersForMembers(members);
        Map<UUID, List<String>> skills = loadSkillsForMembers(members);

        List<MemberItemDto> items = new ArrayList<>();
        for (RoomMember m : members) {
            User u = users.get(m.getUserId());
            List<String> memberSkills = skills.getOrDefault(m.getId(), Collections.emptyList());
            items.add(memberMapper.toMemberDto(m, u, memberSkills, user.getId()));
        }

        List<RoomInvitation> invitations = invitationRepository.findByRoomIdAndStatus(roomId, "PENDING");
        for (RoomInvitation inv : invitations) {
            items.add(memberMapper.toInvitationDto(inv));
        }

        return new MemberListResponse(items);
    }

    /**
     * Updates a member's role. If promoting to LEADER, executes leadership transfer.
     * Reassigns old leader to BUILDER and updates room owner in one atomic transaction.
     */
    @Transactional
    public MemberItemDto updateRole(User caller, UUID roomId, UUID targetUserId, UpdateRoleRequest request) {
        roomAccess.requireLeader(roomId, caller);
        String role = validateAndNormalizeRole(request.role());
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        RoomMember target = memberRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new NotFoundException("MEMBER_NOT_FOUND", "Member not found"));

        if ("LEADER".equals(role)) {
            transferLeadership(caller, target, room);
        } else {
            target.setRole(role);
            memberRepository.save(target);
        }

        User targetUser = userRepository.findById(targetUserId).orElse(null);
        notifyRoleChange(caller, targetUser, room, role);
        List<String> skills = getSkillsForMember(target.getId());
        return memberMapper.toMemberDto(target, targetUser, skills, caller.getId());
    }

    /**
     * Updates assigned skills for a room member.
     * Allowed for the member themselves or for the room leader.
     */
    @Transactional
    public MemberItemDto updateSkills(User caller, UUID roomId, UUID targetUserId, UpdateSkillsRequest request) {
        verifySkillEditPermission(caller, roomId, targetUserId);
        RoomMember member = memberRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new NotFoundException("MEMBER_NOT_FOUND", "Member not found"));

        List<String> validatedSkills = validateSkills(request.skills());
        skillRepository.deleteByMemberId(member.getId());
        for (String skill : validatedSkills) {
            skillRepository.save(new RoomMemberSkill(member.getId(), skill));
        }

        User targetUser = userRepository.findById(targetUserId).orElse(null);
        return memberMapper.toMemberDto(member, targetUser, validatedSkills, caller.getId());
    }

    /**
     * Removes a teammate from the room. Requires leader privileges.
     * Disallows self-removal by leader to prevent orphaned teams.
     */
    @Transactional
    public void removeMember(User caller, UUID roomId, UUID targetUserId) {
        roomAccess.requireLeader(roomId, caller);
        if (caller.getId().equals(targetUserId)) {
            throw new BadRequestException("CANNOT_REMOVE_SELF", "Leader cannot remove themselves; transfer leadership or leave");
        }

        RoomMember member = memberRepository.findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new NotFoundException("MEMBER_NOT_FOUND", "Member not found"));
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        // Unassign member's tasks in this room (ideas stay untouched)
        List<com.hackathonos.backend.tasks.Task> assignedTasks = taskRepository.findByRoomIdAndAssigneeId(roomId, targetUserId);
        for (com.hackathonos.backend.tasks.Task t : assignedTasks) {
            t.setAssigneeId(null);
        }
        taskRepository.saveAll(assignedTasks);

        skillRepository.deleteByMemberId(member.getId());
        memberRepository.delete(member);

        User targetUser = userRepository.findById(targetUserId).orElse(null);
        String name = targetUser != null ? targetUser.getName() : "Member";
        activityLogger.log(room, caller, "member_removed", "Removed " + name + " from the room");
        roomEventService.recordEvent(roomId, "member.removed", "room_member", member.getId().toString(), caller.getId());
        if (targetUser != null) {
            notificationService.notifyUser(targetUser, room, NotificationType.MEMBER_LEFT, "Removed from room", "You were removed from " + room.getName());
        }
    }

    /**
     * Removes the calling member from the room.
     * Blocks if caller is leader and room has other members, requiring transfer first.
     * If caller is the sole member, archives the room.
     */
    @Transactional
    public void leaveRoom(User caller, UUID roomId) {
        RoomMember member = roomAccess.requireMember(roomId, caller);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        long count = memberRepository.countByRoomId(roomId);
        if ("LEADER".equalsIgnoreCase(member.getRole())) {
            if (count > 1) {
                throw new ConflictException("TRANSFER_LEADERSHIP_FIRST", "You must transfer leadership to another teammate before leaving the room.");
            }
            // Sole member leaves: archive room
            room.setArchivedAt(Instant.now());
            room.setDeletedAt(Instant.now());
            room.setUpdatedAt(Instant.now());
            roomRepository.save(room);
        }

        // Unassign caller's tasks
        List<com.hackathonos.backend.tasks.Task> assignedTasks = taskRepository.findByRoomIdAndAssigneeId(roomId, caller.getId());
        for (com.hackathonos.backend.tasks.Task t : assignedTasks) {
            t.setAssigneeId(null);
        }
        taskRepository.saveAll(assignedTasks);

        skillRepository.deleteByMemberId(member.getId());
        memberRepository.delete(member);
        activityLogger.log(room, caller, "member_left", caller.getName() + " left the room");
        roomEventService.recordEvent(roomId, "member.left", "room_member", member.getId().toString(), caller.getId());
    }

    /**
     * Creates a pending invitation placeholder row in the Team panel.
     */
    @Transactional
    public MemberItemDto createInvitation(User caller, UUID roomId, CreateInvitationRequest request) {
        roomAccess.requireMember(roomId, caller);
        String role = (request.role() != null && !request.role().isBlank())
                ? validateAndNormalizeRole(request.role())
                : "BUILDER";

        RoomInvitation invitation = new RoomInvitation(roomId, request.inviteeText().trim(), role, caller.getId());
        invitationRepository.save(invitation);
        return memberMapper.toInvitationDto(invitation);
    }

    /**
     * Revokes a pending room invitation.
     */
    @Transactional
    public void revokeInvitation(User caller, UUID roomId, UUID invitationId) {
        roomAccess.requireMember(roomId, caller);
        RoomInvitation invitation = invitationRepository.findByIdAndRoomId(invitationId, roomId)
                .orElseThrow(() -> new NotFoundException("INVITATION_NOT_FOUND", "Invitation not found"));
        invitationRepository.delete(invitation);
    }

    private void transferLeadership(User caller, RoomMember target, Room room) {
        RoomMember oldLeader = memberRepository.findByRoomIdAndUserId(room.getId(), caller.getId())
                .orElseThrow(() -> new IllegalStateException("Caller leadership not found"));

        oldLeader.setRole("BUILDER");
        memberRepository.save(oldLeader);

        target.setRole("LEADER");
        memberRepository.save(target);

        room.setOwnerId(target.getUserId());
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
    }

    private void notifyRoleChange(User caller, User targetUser, Room room, String role) {
        String targetName = targetUser != null ? targetUser.getName() : "teammate";
        activityLogger.log(room, caller, "role_changed", "Changed role of " + targetName + " to " + role);
        if (targetUser != null && !caller.getId().equals(targetUser.getId())) {
            notificationService.notifyUser(targetUser, room, NotificationType.ROLE_CHANGED, "Role updated", "Your role was changed to " + role);
        }
    }

    private void verifySkillEditPermission(User caller, UUID roomId, UUID targetUserId) {
        if (!caller.getId().equals(targetUserId)) {
            roomAccess.requireLeader(roomId, caller);
        } else {
            roomAccess.requireMember(roomId, caller);
        }
    }

    private String validateAndNormalizeRole(String role) {
        if (role == null) throw new BadRequestException("INVALID_ROLE", "Role is required");
        String upper = role.trim().toUpperCase();
        if (!ALLOWED_ROLES.contains(upper)) {
            throw new BadRequestException("INVALID_ROLE", "Invalid role: " + role + ". Allowed: " + ALLOWED_ROLES);
        }
        return upper;
    }

    private List<String> validateSkills(List<String> skills) {
        if (skills == null) return Collections.emptyList();
        List<String> validated = new ArrayList<>();
        for (String s : skills) {
            String trimmed = s.trim();
            if (!ALLOWED_SKILLS.contains(trimmed)) {
                throw new BadRequestException("INVALID_SKILL", "Invalid skill: " + trimmed + ". Allowed: " + ALLOWED_SKILLS);
            }
            if (!validated.contains(trimmed)) validated.add(trimmed);
        }
        return validated;
    }

    private Map<UUID, User> loadUsersForMembers(List<RoomMember> members) {
        Set<UUID> userIds = new HashSet<>();
        for (RoomMember m : members) {
            if (m.getUserId() != null) userIds.add(m.getUserId());
        }
        Map<UUID, User> map = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : userRepository.findAllById(userIds)) map.put(u.getId(), u);
        }
        return map;
    }

    private Map<UUID, List<String>> loadSkillsForMembers(List<RoomMember> members) {
        List<UUID> memberIds = new ArrayList<>();
        for (RoomMember m : members) memberIds.add(m.getId());
        List<RoomMemberSkill> skills = skillRepository.findByMemberIdIn(memberIds);
        Map<UUID, List<String>> map = new HashMap<>();
        for (RoomMemberSkill s : skills) {
            map.computeIfAbsent(s.getMemberId(), k -> new ArrayList<>()).add(s.getSkill());
        }
        return map;
    }

    private List<String> getSkillsForMember(UUID memberId) {
        List<RoomMemberSkill> list = skillRepository.findByMemberId(memberId);
        List<String> result = new ArrayList<>();
        for (RoomMemberSkill s : list) result.add(s.getSkill());
        return result;
    }

    /**
     * Updates member last_seen_at timestamp to mark presence as active.
     */
    @Transactional
    public void recordHeartbeat(User user, UUID roomId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        member.setLastSeenAt(Instant.now());
        memberRepository.save(member);
    }
}
