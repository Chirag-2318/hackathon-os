package com.hackathonos.backend.pitch;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.demo.DemoSection;
import com.hackathonos.backend.demo.DemoSectionRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service managing pitch rehearsal timer runs and roles.
 */
@Service
public class PitchRehearsalService {

    private final PitchRehearsalRepository rehearsalRepository;
    private final PitchRoleRepository roleRepository;
    private final PitchDeckRepository deckRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final DemoSectionRepository demoSectionRepository;
    private final RoomAccess roomAccess;
    private final CheckpointService checkpointService;
    private final ObjectMapper objectMapper;

    public PitchRehearsalService(
            PitchRehearsalRepository rehearsalRepository,
            PitchRoleRepository roleRepository,
            PitchDeckRepository deckRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            DemoSectionRepository demoSectionRepository,
            RoomAccess roomAccess,
            CheckpointService checkpointService,
            ObjectMapper objectMapper
    ) {
        this.rehearsalRepository = rehearsalRepository;
        this.roleRepository = roleRepository;
        this.deckRepository = deckRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.demoSectionRepository = demoSectionRepository;
        this.roomAccess = roomAccess;
        this.checkpointService = checkpointService;
        this.objectMapper = objectMapper;
    }

    /**
     * Lists rehearsal runs, target duration, assigned roles, and demo section paces.
     */
    @Transactional(readOnly = true)
    public PitchDtos.RehearseResponse getRehearsals(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        PitchDeck deck = deckRepository.findByRoomId(roomId).orElse(null);
        int targetSeconds = deck != null
                ? FormatProfileResolver.getProfileForKind(deck.getFormatKind()).targetSeconds()
                : 180;

        List<PitchRehearsal> runs = rehearsalRepository.findByRoomIdOrderByRunAtAsc(roomId);
        List<PitchDtos.RehearsalRunDto> runDtos = runs.stream().map(this::toRunDto).toList();

        PitchDtos.RehearsalRunDto bestRun = null;
        int minDiff = Integer.MAX_VALUE;
        for (PitchDtos.RehearsalRunDto r : runDtos) {
            int diff = Math.abs(r.durationSec() - targetSeconds);
            if (diff < minDiff) {
                minDiff = diff;
                bestRun = r;
            }
        }

        PitchRole roles = roleRepository.findByRoomId(roomId).orElse(null);
        PitchDtos.UserSummaryDto presenterSummary = roles != null && roles.getPresenterId() != null
                ? getUserSummary(roles.getPresenterId()) : null;
        PitchDtos.UserSummaryDto operatorSummary = roles != null && roles.getOperatorId() != null
                ? getUserSummary(roles.getOperatorId()) : null;

        List<PitchDtos.RoleAssignmentDto> roleList = new ArrayList<>();
        if (presenterSummary != null) {
            roleList.add(new PitchDtos.RoleAssignmentDto("Presenter", presenterSummary.id().toString(), presenterSummary.name()));
        }
        if (operatorSummary != null) {
            roleList.add(new PitchDtos.RoleAssignmentDto("Demo operator", operatorSummary.id().toString(), operatorSummary.name()));
        }

        List<DemoSection> demoSections = demoSectionRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<PitchDtos.DemoSectionOutlineDto> sectionOutlines = demoSections.stream()
                .map(s -> new PitchDtos.DemoSectionOutlineDto(s.getTitle(), s.getSeconds()))
                .toList();

        return new PitchDtos.RehearseResponse(
                runDtos,
                runDtos.size(),
                3,
                bestRun,
                new PitchDtos.PitchRolesDto(presenterSummary, operatorSummary),
                roleList,
                targetSeconds,
                sectionOutlines
        );
    }

    /**
     * Records a new rehearsal run and updates the DEMO_REHEARSED checkpoint progress.
     */
    @Transactional
    public PitchDtos.RehearsalRunDto addRun(UUID roomId, User user, PitchDtos.CreateRunRequest req) {
        roomAccess.requireMember(roomId, user);
        int durationSec = req.getEffectiveDurationSec();
        if (durationSec < 10 || durationSec > 1800) {
            throw new BadRequestException("INVALID_DURATION", "Rehearsal duration must be between 10 and 1800 seconds");
        }

        PitchRole roles = roleRepository.findByRoomId(roomId).orElse(null);
        UUID presenterId = roles != null && roles.getPresenterId() != null ? roles.getPresenterId() : user.getId();
        UUID operatorId = roles != null ? roles.getOperatorId() : null;

        PitchRehearsal run = new PitchRehearsal(
                roomId,
                Instant.now(),
                durationSec,
                presenterId,
                operatorId,
                req.sectionPaces() != null ? req.sectionPaces() : "[]",
                req.notes() != null ? req.notes().trim() : ""
        );
        PitchRehearsal saved = rehearsalRepository.save(run);

        // Update checkpoint DEMO_REHEARSED
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room != null) {
            long totalRuns = rehearsalRepository.countByRoomId(roomId);
            checkpointService.evaluate(room);
        }

        return toRunDto(saved);
    }

    /**
     * Deletes a rehearsal run; author or room leader only.
     */
    @Transactional
    public void deleteRun(UUID roomId, UUID runId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        PitchRehearsal run = rehearsalRepository.findById(runId)
                .filter(r -> r.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("RUN_NOT_FOUND", "Rehearsal run not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isAuthor = user.getId().equals(run.getPresenterId());
        if (!isLeader && !isAuthor) {
            throw new ForbiddenException("CANNOT_DELETE_RUN", "Only the presenter or room leader can delete this rehearsal run");
        }

        rehearsalRepository.delete(run);

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room != null) {
            checkpointService.evaluate(room);
        }
    }

    /**
     * Updates rehearsal presenter and operator roles. Both must be members and distinct.
     */
    @Transactional
    public PitchDtos.PitchRolesDto setRoles(UUID roomId, User user, PitchDtos.UpdateRolesRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.presenterId() == null || req.operatorId() == null) {
            throw new BadRequestException("MISSING_ROLES", "Presenter and operator must be specified");
        }
        if (req.presenterId().equals(req.operatorId())) {
            throw new BadRequestException("SAME_PERSON", "Presenter and operator must be different team members");
        }

        // Verify both are room members
        if (memberRepository.findByRoomIdAndUserId(roomId, req.presenterId()).isEmpty() ||
            memberRepository.findByRoomIdAndUserId(roomId, req.operatorId()).isEmpty()) {
            throw new BadRequestException("INVALID_MEMBER", "Both presenter and operator must be members of the room");
        }

        PitchRole role = roleRepository.findByRoomId(roomId).orElseGet(() -> new PitchRole(roomId, req.presenterId(), req.operatorId()));
        role.setPresenterId(req.presenterId());
        role.setOperatorId(req.operatorId());
        roleRepository.save(role);

        return new PitchDtos.PitchRolesDto(
                getUserSummary(req.presenterId()),
                getUserSummary(req.operatorId())
        );
    }

    private PitchDtos.RehearsalRunDto toRunDto(PitchRehearsal r) {
        List<PitchDtos.SectionPaceDto> paces = new ArrayList<>();
        if (r.getSectionPaces() != null && !r.getSectionPaces().isBlank()) {
            try {
                paces = objectMapper.readValue(r.getSectionPaces(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        return new PitchDtos.RehearsalRunDto(
                r.getId(),
                r.getRunAt(),
                r.getDurationSec(),
                r.getDurationSec(),
                getUserSummary(r.getPresenterId()),
                getUserSummary(r.getOperatorId()),
                paces,
                r.getNotes()
        );
    }

    private PitchDtos.UserSummaryDto getUserSummary(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> new PitchDtos.UserSummaryDto(u.getId(), u.getName(), u.getAvatarUrl()))
                .orElse(null);
    }
}
