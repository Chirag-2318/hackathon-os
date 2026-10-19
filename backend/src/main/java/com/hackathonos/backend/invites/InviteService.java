package com.hackathonos.backend.invites;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.email.EmailOutboxRepository;
import com.hackathonos.backend.email.MailService;
import com.hackathonos.backend.invites.dto.*;
import com.hackathonos.backend.members.*;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class InviteService {

    private static final List<String> ALL_SKILLS = List.of(
            "Frontend", "Backend", "ML/AI", "Design", "Presenter", "Domain", "QA/Demo"
    );

    private final InviteRepository inviteRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final RoomInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final JoinAttemptLimiter attemptLimiter;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final AppProperties appProperties;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;
    private final com.hackathonos.backend.events.RoomEventHub eventHub;
    private final MailService mailService;
    private final EmailOutboxRepository outboxRepository;
    private final com.hackathonos.backend.templates.EventTemplateRepository templateRepository;

    public InviteService(InviteRepository inviteRepository,
                         RoomRepository roomRepository,
                         RoomMemberRepository memberRepository,
                         RoomMemberSkillRepository skillRepository,
                         RoomInvitationRepository invitationRepository,
                         UserRepository userRepository,
                         RoomAccess roomAccess,
                         JoinAttemptLimiter attemptLimiter,
                         ActivityLogger activityLogger,
                         NotificationService notificationService,
                         AppProperties appProperties,
                         com.hackathonos.backend.templates.EventTemplateRepository templateRepository,
                         com.hackathonos.backend.events.RoomEventService roomEventService,
                         com.hackathonos.backend.events.RoomEventHub eventHub,
                         MailService mailService,
                         EmailOutboxRepository outboxRepository) {
        this.inviteRepository = inviteRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.attemptLimiter = attemptLimiter;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.appProperties = appProperties;
        this.templateRepository = templateRepository;
        this.roomEventService = roomEventService;
        this.eventHub = eventHub;
        this.mailService = mailService;
        this.outboxRepository = outboxRepository;
    }

    /**
     * Creates or reuses a shareable invite link for a room.
     * Reuses existing active link with the same role and creator to avoid link spam.
     */
    @Transactional
    public InviteResponse createInviteLink(User caller, UUID roomId, CreateInviteRequest request) {
        roomAccess.requireMember(roomId, caller);
        String role = (request != null && request.role() != null && !request.role().isBlank())
                ? request.role().trim().toUpperCase() : "BUILDER";
        int days = (request != null && request.expiresInDays() != null && request.expiresInDays() > 0)
                ? Math.min(request.expiresInDays(), 30) : 7;
        Integer maxUses = (request != null) ? request.maxUses() : null;

        Optional<Invite> existing = inviteRepository
                .findFirstByRoomIdAndRoleAndCreatedByAndRevokedAtIsNullAndExpiresAtAfter(
                        roomId, role, caller.getId(), Instant.now());
        if (existing.isPresent()) {
            Invite inv = existing.get();
            return new InviteResponse(inv.getToken(), buildUrl(inv.getToken()), inv.getExpiresAt());
        }

        String token = UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plus(days, ChronoUnit.DAYS);

        Invite invite = new Invite(roomId, token, role, caller.getId(), expiresAt, maxUses);
        inviteRepository.save(invite);
        return new InviteResponse(token, buildUrl(token), expiresAt);
    }



    /**
     * Lists active invite links for a room. Requires leader privileges.
     */
    public List<InviteResponse> listActiveInvites(User caller, UUID roomId) {
        roomAccess.requireLeader(roomId, caller);
        List<Invite> invites = inviteRepository.findByRoomIdAndRevokedAtIsNullAndExpiresAtAfter(roomId, Instant.now());
        List<InviteResponse> results = new ArrayList<>();
        for (Invite inv : invites) {
            results.add(new InviteResponse(inv.getToken(), buildUrl(inv.getToken()), inv.getExpiresAt()));
        }
        return results;
    }

    /**
     * Revokes a shareable invite link. Requires leader privileges.
     */
    @Transactional
    public void revokeInvite(User caller, UUID roomId, UUID inviteId) {
        roomAccess.requireLeader(roomId, caller);
        Invite invite = inviteRepository.findByIdAndRoomId(inviteId, roomId)
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));
        invite.setRevokedAt(Instant.now());
        inviteRepository.save(invite);
    }

    /**
     * Public preview of an invite link. Computes validity reason and missing team skills.
     * Never exposes room ID or internal details if invalid.
     */
    public InvitePreviewDto previewInvite(String token, User callerOrNull) {
        Optional<Invite> inviteOpt = inviteRepository.findByToken(token);
        if (inviteOpt.isEmpty()) {
            return new InvitePreviewDto(false, "NOT_FOUND", null, null, null, null, Collections.emptyList(), null, null);
        }

        Invite invite = inviteOpt.get();
        String invalidReason = validateInviteState(invite);
        if (invalidReason != null) {
            return new InvitePreviewDto(false, invalidReason, null, null, null, null, Collections.emptyList(), null, null);
        }

        Room room = roomRepository.findByIdAndArchivedAtIsNull(invite.getRoomId())
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        User host = loadHost(invite.getCreatedBy(), room.getOwnerId());
        long count = memberRepository.countByRoomId(room.getId());
        List<String> needed = computeSkillsNeeded(room.getId());
        Boolean already = (callerOrNull != null) ? memberRepository.existsByRoomIdAndUserId(room.getId(), callerOrNull.getId()) : null;

        String hostAvatarUrl = com.hackathonos.backend.users.dto.UserSummaryDto.resolveAvatar(host).avatarUrl();
        return new InvitePreviewDto(true, null, room.getName(), host.getName(), hostAvatarUrl, count, needed, invite.getExpiresAt(), already);
    }

    /**
     * Joins the room using an invite token. Adds the member and marks matching invitations accepted.
     */
    @Transactional
    public JoinInviteResponse joinByInvite(User caller, String token) {
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("INVALID_INVITE", "Invite link not found"));
        String reason = validateInviteState(invite);
        if (reason != null) {
            throw new BadRequestException("INVALID_INVITE", "Invite link is " + reason.toLowerCase());
        }

        Room room = roomRepository.findByIdAndArchivedAtIsNull(invite.getRoomId())
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        if (room.getDeletedAt() != null) {
            throw new NotFoundException("ROOM_NOT_FOUND", "Room not found");
        }

        if (memberRepository.existsByRoomIdAndUserId(room.getId(), caller.getId())) {
            return new JoinInviteResponse(room.getId());
        }

        checkRoomCapacity(room);

        addMemberAndProcessInvites(caller, room, invite.getRole());
        invite.setUsedCount(invite.getUsedCount() + 1);
        inviteRepository.save(invite);
        return new JoinInviteResponse(room.getId());
    }

    /**
     * Joins a room using the 8-character join code. Throttled to 10 attempts per minute.
     * Returns the same generic error for invalid or revoked/expired codes to prevent enumeration.
     */
    @Transactional
    public JoinInviteResponse joinByCode(User caller, JoinCodeRequest request) {
        attemptLimiter.checkAndRecord(caller.getId());

        String rawCode = request.code() != null ? request.code().trim().toUpperCase() : "";
        Room room = roomRepository.findByJoinCodeIgnoreCaseAndArchivedAtIsNull(rawCode)
                .orElse(null);

        if (room == null || room.getDeletedAt() != null || room.isCodeRevoked()
                || (room.getCodeExpiresAt() != null && Instant.now().isAfter(room.getCodeExpiresAt()))) {
            throw new NotFoundException("INVALID_CODE", "Invalid join code");
        }

        if (memberRepository.existsByRoomIdAndUserId(room.getId(), caller.getId())) {
            return new JoinInviteResponse(room.getId());
        }

        checkRoomCapacity(room);

        addMemberAndProcessInvites(caller, room, "BUILDER");
        return new JoinInviteResponse(room.getId());
    }

    private void checkRoomCapacity(Room room) {
        long current = memberRepository.countByRoomId(room.getId());
        if (current >= 20) {
            throw new com.hackathonos.backend.common.error.LimitReachedException(
                    com.hackathonos.backend.common.error.ErrorCode.LIMIT_REACHED,
                    "This room has reached the limit of 20 members."
            );
        }
        if (room.getTemplateId() != null) {
            templateRepository.findById(room.getTemplateId()).ifPresent(tpl -> {
                if (tpl.getTeamMax() > 0 && current >= tpl.getTeamMax()) {
                    throw new BadRequestException("ROOM_FULL", "Room has reached the maximum capacity of " + tpl.getTeamMax() + " members");
                }
            });
        }
    }

    public void addMemberAndProcessInvites(User caller, Room room, String role) {
        RoomMember member = new RoomMember(room.getId(), caller.getId(), role);
        member = memberRepository.save(member);

        matchPendingInvitation(caller, room.getId());
        activityLogger.log(room, caller, "member_joined", caller.getName() + " joined the room");
        roomEventService.recordEvent(room.getId(), "member.joined", "room_member", member.getId().toString(), caller.getId());

        if (room.getOwnerId() != null && !room.getOwnerId().equals(caller.getId())) {
            userRepository.findById(room.getOwnerId()).ifPresent(leader ->
                    notificationService.notifyUser(leader, room, NotificationType.MEMBER_JOINED,
                            "Teammate joined", caller.getName() + " joined " + room.getName()));
        }

        eventHub.publish(room.getId(), "members", caller, member.getId().toString());
        eventHub.publish(room.getId(), "overview", caller, null);
        eventHub.publishUser(caller.getId(), "rooms");
        if (room.getOwnerId() != null) {
            eventHub.publishUser(room.getOwnerId(), "rooms");
        }

        sendJoinedEmails(caller, room);
    }

    private void sendJoinedEmails(User caller, Room room) {
        if (caller.getEmail() != null && !caller.getEmail().isBlank()) {
            Map<String, Object> selfVars = new HashMap<>();
            selfVars.put("variant", "SELF");
            selfVars.put("roomName", room.getName());
            selfVars.put("roomId", room.getId().toString());
            selfVars.put("appUrl", appProperties.getPublicUrl());
            selfVars.put("teammates", buildTeammateRoster(room.getId()));
            selfVars.put("nextStep", resolveNextStep(room));

            mailService.enqueue("joined", caller.getEmail(), selfVars, "joined-self:" + room.getId() + ":" + caller.getId());
        }

        if (room.getOwnerId() != null && !room.getOwnerId().equals(caller.getId())) {
            userRepository.findById(room.getOwnerId()).ifPresent(leader -> {
                if (leader.getEmail() != null && !leader.getEmail().isBlank()) {
                    java.time.ZonedDateTime nowPacific = java.time.ZonedDateTime.now(java.time.ZoneId.of("America/Los_Angeles"));
                    Instant midnightPacific = nowPacific.toLocalDate().atStartOfDay(java.time.ZoneId.of("America/Los_Angeles")).toInstant();
                    long leaderCountToday = outboxRepository.countByDedupeKeyPrefixSince(
                            "joined-lead:" + room.getId() + ":",
                            midnightPacific
                    );
                    if (leaderCountToday < 6) {
                        long currentMembers = memberRepository.countByRoomId(room.getId());
                        int cap = 4;
                        if (room.getTemplateId() != null) {
                            cap = templateRepository.findById(room.getTemplateId())
                                    .map(com.hackathonos.backend.templates.EventTemplate::getTeamMax)
                                    .orElse(4);
                        }
                        Map<String, Object> leadVars = new HashMap<>();
                        leadVars.put("variant", "LEADER");
                        leadVars.put("roomName", room.getName());
                        leadVars.put("roomId", room.getId().toString());
                        leadVars.put("appUrl", appProperties.getPublicUrl());
                        leadVars.put("handle", caller.getUsername() != null ? caller.getUsername() : caller.getName());
                        leadVars.put("displayName", caller.getDisplayName() != null ? caller.getDisplayName() : caller.getName());
                        leadVars.put("memberCount", (int) currentMembers);
                        leadVars.put("memberCap", cap);
                        leadVars.put("roleTags", parseJsonRoles(caller.getRoleTags()));

                        mailService.enqueue("joined", leader.getEmail(), leadVars, "joined-lead:" + room.getId() + ":" + caller.getId());
                    }
                }
            });
        }
    }

    private List<Map<String, Object>> buildTeammateRoster(UUID roomId) {
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<Map<String, Object>> roster = new ArrayList<>();
        int count = 0;
        for (RoomMember m : members) {
            if (count++ >= 6) break;
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                com.hackathonos.backend.users.dto.UserSummaryDto.ResolvedAvatar summary = com.hackathonos.backend.users.dto.UserSummaryDto.resolveAvatar(u);
                Map<String, Object> map = new HashMap<>();
                map.put("handle", u.getUsername() != null ? u.getUsername() : u.getName());
                map.put("displayName", u.getDisplayName() != null ? u.getDisplayName() : u.getName());
                map.put("role", m.getRole() != null ? m.getRole() : "Builder");
                map.put("isLeader", "LEADER".equalsIgnoreCase(m.getRole()));
                map.put("avatarUrl", summary.avatarUrl());
                roster.add(map);
            });
        }
        return roster;
    }

    private String resolveNextStep(Room room) {
        if (!room.isBriefDone()) {
            return "Review the event brief and extract project goals.";
        }
        if (!room.isIdeateDone()) {
            return "Contribute and vote on ideas on the Ideate board.";
        }
        if (!room.isPlanDone()) {
            return "Draft the execution plan and lock the MVP cut-list.";
        }
        return "Pick up tasks from the build board and assemble the prototype.";
    }

    private List<String> parseJsonRoles(String json) {
        if (json == null || json.isBlank() || "[]".equals(json)) {
            return Collections.emptyList();
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                    json,
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
            );
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void matchPendingInvitation(User caller, UUID roomId) {
        if (caller.getEmail() != null) {
            invitationRepository.findFirstByRoomIdAndInviteeTextIgnoreCaseAndStatus(roomId, caller.getEmail(), "PENDING")
                    .ifPresent(inv -> markInvitationAccepted(inv, caller.getId()));
        }
        invitationRepository.findFirstByRoomIdAndInviteeTextIgnoreCaseAndStatus(roomId, caller.getName(), "PENDING")
                .ifPresent(inv -> markInvitationAccepted(inv, caller.getId()));
    }

    private void markInvitationAccepted(RoomInvitation inv, UUID userId) {
        inv.setStatus("ACCEPTED");
        inv.setAcceptedUserId(userId);
        invitationRepository.save(inv);
    }

    private String validateInviteState(Invite invite) {
        if (invite.getRevokedAt() != null) return "REVOKED";
        if (Instant.now().isAfter(invite.getExpiresAt())) return "EXPIRED";
        if (invite.getMaxUses() != null && invite.getUsedCount() >= invite.getMaxUses()) return "FULL";
        return null;
    }

    private User loadHost(UUID createdBy, UUID ownerId) {
        UUID hostId = createdBy != null ? createdBy : ownerId;
        if (hostId == null) return new User("DEV", "dev", "Team Host", null, null, null);
        return userRepository.findById(hostId)
                .orElseGet(() -> new User("DEV", "dev", "Team Host", null, null, null));
    }

    private List<String> computeSkillsNeeded(UUID roomId) {
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<UUID> memberIds = new ArrayList<>();
        for (RoomMember m : members) memberIds.add(m.getId());
        List<RoomMemberSkill> skills = skillRepository.findByMemberIdIn(memberIds);

        Set<String> existing = new HashSet<>();
        for (RoomMemberSkill s : skills) existing.add(s.getSkill());

        List<String> needed = new ArrayList<>();
        for (String s : ALL_SKILLS) {
            if (!existing.contains(s)) needed.add(s);
        }
        return needed;
    }

    private String buildUrl(String token) {
        return appProperties.getFrontendUrl() + "/invite/" + token;
    }
}
