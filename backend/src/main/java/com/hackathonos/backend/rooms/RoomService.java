package com.hackathonos.backend.rooms;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.dto.*;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class RoomService {

    private static final String JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final EventTemplateService templateService;
    private final UserSettingsRepository settingsRepository;
    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final RoomMapper roomMapper;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final com.hackathonos.backend.users.UserRepository userRepository;
    private final com.hackathonos.backend.submission.SubmissionRepository submissionRepository;
    private final com.hackathonos.backend.tasks.TaskRepository taskRepository;
    private final com.hackathonos.backend.plan.PlanStepRepository planStepRepository;

    public RoomService(RoomRepository roomRepository,
                       RoomMemberRepository memberRepository,
                       EventTemplateService templateService,
                       UserSettingsRepository settingsRepository,
                       RoomAccess roomAccess,
                       RoomStageService stageService,
                       RoomMapper roomMapper,
                       ActivityLogger activityLogger,
                       NotificationService notificationService,
                       com.hackathonos.backend.users.UserRepository userRepository,
                       com.hackathonos.backend.submission.SubmissionRepository submissionRepository,
                       com.hackathonos.backend.tasks.TaskRepository taskRepository,
                       com.hackathonos.backend.plan.PlanStepRepository planStepRepository) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.templateService = templateService;
        this.settingsRepository = settingsRepository;
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.roomMapper = roomMapper;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.taskRepository = taskRepository;
        this.planStepRepository = planStepRepository;
    }

    /**
     * Creates a room, makes the creator its leader, and gives it a unique join code.
     * Computes start and end clocks, sets key prefix, and dispatches creation notifications.
     */
    @Transactional
    public RoomDetailDto createRoom(User creator, CreateRoomRequest request) {
        EventTemplate template;
        try {
            template = templateService.getOrThrow(request.templateId());
        } catch (com.hackathonos.backend.common.error.NotFoundException e) {
            throw new BadRequestException("INVALID_TEMPLATE", "Unknown event template", Map.of("templateId", "Unknown event template"));
        }
        String timezone = resolveTimezone(creator, request.timezone());
        Instant eventStart = resolveEventStart(request.eventStart(), timezone);
        Instant eventEnd = eventStart.plus(template.getDurationHours(), ChronoUnit.HOURS);
        String joinCode = generateUniqueJoinCode();
        String keyPrefix = generateKeyPrefix(request.name());

        Room room = new Room(
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.projectDescription() != null ? request.projectDescription().trim() : null,
                template.getId(),
                creator.getId(),
                eventStart,
                eventEnd,
                timezone,
                keyPrefix,
                joinCode
        );
        roomRepository.save(room);

        RoomMember leader = new RoomMember(room.getId(), creator.getId(), "LEADER");
        memberRepository.save(leader);

        activityLogger.log(room, creator, "room_created", "Created the room");
        notificationService.notifyUser(creator, room, NotificationType.ROOM_CREATED, "Room created", room.getName());

        return roomMapper.toDetail(room, template.getName(), 1, "LEADER", true);
    }

    /**
     * Returns all active rooms where the user is currently a member, newest first.
     * Summarizes phase completion progress and member counts for each card.
     */
    public List<RoomListItemDto> listRooms(User user) {
        List<Room> rooms = roomRepository.findActiveRoomsByMemberUserId(user.getId());
        if (rooms.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> roomIds = rooms.stream().map(Room::getId).toList();

        // 1. Batched fetch members
        List<RoomMember> allMembers = memberRepository.findByRoomIdIn(roomIds);
        Map<UUID, List<RoomMember>> membersByRoom = allMembers.stream()
                .collect(java.util.stream.Collectors.groupingBy(RoomMember::getRoomId));

        // 2. Collect up to 4 user IDs per room for avatar previews
        Set<UUID> previewUserIds = new HashSet<>();
        for (UUID rId : roomIds) {
            List<RoomMember> rMembers = membersByRoom.getOrDefault(rId, Collections.emptyList());
            rMembers.stream()
                    .sorted((a, b) -> {
                        boolean aLead = "LEADER".equalsIgnoreCase(a.getRole());
                        boolean bLead = "LEADER".equalsIgnoreCase(b.getRole());
                        if (aLead != bLead) return aLead ? -1 : 1;
                        return 0;
                    })
                    .limit(4)
                    .forEach(m -> previewUserIds.add(m.getUserId()));
        }

        // 3. Batched fetch users
        Map<UUID, com.hackathonos.backend.users.User> userMap = userRepository.findAllById(previewUserIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.hackathonos.backend.users.User::getId, u -> u));

        // 4. Batched fetch submissions
        Map<UUID, com.hackathonos.backend.submission.Submission> submissionMap = submissionRepository.findAllById(roomIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.hackathonos.backend.submission.Submission::getRoomId, s -> s));

        // 5. Batched fetch tasks
        Map<UUID, List<com.hackathonos.backend.tasks.Task>> tasksByRoom = taskRepository.findByRoomIdIn(roomIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(com.hackathonos.backend.tasks.Task::getRoomId));

        // 6. Batched fetch plan steps
        Map<UUID, List<com.hackathonos.backend.plan.PlanStep>> planStepsByRoom = planStepRepository.findByRoomIdIn(roomIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(com.hackathonos.backend.plan.PlanStep::getRoomId));

        Instant now = Instant.now();
        List<RoomListItemDto> items = new ArrayList<>();

        for (Room room : rooms) {
            EventTemplate template = null;
            try {
                template = templateService.getOrThrow(room.getTemplateId());
            } catch (Exception ignored) {}
            String templateName = template != null ? template.getName() : "Hackathon";
            int durationHours = template != null ? template.getDurationHours() : 36;

            List<RoomMember> roomMembers = membersByRoom.getOrDefault(room.getId(), Collections.emptyList());
            long memberCount = roomMembers.size();

            RoomMember currentMember = roomMembers.stream()
                    .filter(m -> m.getUserId().equals(user.getId()))
                    .findFirst()
                    .orElse(null);
            String role = currentMember != null ? currentMember.getRole() : "BUILDER";
            boolean isLeader = "LEADER".equalsIgnoreCase(role);

            // Member previews
            List<com.hackathonos.backend.users.dto.UserSummaryDto> memberPreview = roomMembers.stream()
                    .sorted((a, b) -> {
                        boolean aLead = "LEADER".equalsIgnoreCase(a.getRole());
                        boolean bLead = "LEADER".equalsIgnoreCase(b.getRole());
                        if (aLead != bLead) return aLead ? -1 : 1;
                        return 0;
                    })
                    .limit(4)
                    .map(m -> {
                        com.hackathonos.backend.users.User u = userMap.get(m.getUserId());
                        return com.hackathonos.backend.users.dto.UserSummaryDto.from(u, "Member");
                    })
                    .filter(Objects::nonNull)
                    .toList();

            com.hackathonos.backend.submission.Submission sub = submissionMap.get(room.getId());
            Instant submittedAt = (sub != null && sub.getSubmittedAt() != null) ? sub.getSubmittedAt() : null;
            boolean isSubmitted = submittedAt != null || (sub != null && "SUBMITTED".equalsIgnoreCase(sub.getStatus()));

            String phase;
            int phaseIndex;
            int phaseCount = 4;

            if (isSubmitted) {
                phase = "Submitted";
                phaseIndex = 3;
            } else if ("present".equalsIgnoreCase(room.getStage())
                    || (room.getBuildStartedAt() != null && room.getEventEnd() != null && now.isAfter(room.getEventEnd().minus(Duration.ofHours(2))))) {
                phase = "Present";
                phaseIndex = 2;
            } else if (room.getBuildStartedAt() != null || "build".equalsIgnoreCase(room.getStage())) {
                phase = "Build";
                phaseIndex = 1;
            } else {
                phase = "Planning";
                phaseIndex = 0;
            }

            List<com.hackathonos.backend.tasks.Task> roomTasks = tasksByRoom.getOrDefault(room.getId(), Collections.emptyList());
            List<com.hackathonos.backend.plan.PlanStep> roomPlanSteps = planStepsByRoom.getOrDefault(room.getId(), Collections.emptyList());

            int attentionCount = 0;
            String nextStepLabel = null;

            if (phaseIndex == 3) {
                nextStepLabel = "Submitted — ready for judging";
            } else if (phaseIndex == 2) {
                nextStepLabel = "Next: finalize pitch deck & submission";
                if (room.getEventEnd() != null && now.isAfter(room.getEventEnd().minus(Duration.ofHours(1)))) {
                    attentionCount++;
                }
            } else if (phaseIndex == 1) {
                long blockedTasks = roomTasks.stream()
                        .filter(t -> t.isFlagged() && !"done".equalsIgnoreCase(t.getStatus()))
                        .count();
                long overdueTasks = roomTasks.stream()
                        .filter(t -> t.getDueAt() != null && t.getDueAt().isBefore(now) && !"done".equalsIgnoreCase(t.getStatus()))
                        .count();
                long unassignedTasks = roomTasks.stream()
                        .filter(t -> t.getAssigneeId() == null && !"done".equalsIgnoreCase(t.getStatus()))
                        .count();

                attentionCount = (int) (blockedTasks + overdueTasks);
                if (room.getEventEnd() != null && now.isAfter(room.getEventEnd().minus(Duration.ofHours(2)))) {
                    attentionCount++;
                }

                if (blockedTasks > 0) {
                    nextStepLabel = blockedTasks == 1 ? "1 blocked task needs attention" : blockedTasks + " blocked tasks need attention";
                } else if (unassignedTasks > 0) {
                    nextStepLabel = unassignedTasks == 1 ? "1 task needs an owner" : unassignedTasks + " tasks need an owner";
                } else {
                    com.hackathonos.backend.tasks.Task nextTask = roomTasks.stream()
                            .filter(t -> !"done".equalsIgnoreCase(t.getStatus()))
                            .findFirst()
                            .orElse(null);
                    if (nextTask != null) {
                        nextStepLabel = "Next: " + nextTask.getSummary();
                    } else {
                        nextStepLabel = "All sprint tasks complete";
                    }
                }
            } else {
                if (!room.isBriefDone()) {
                    nextStepLabel = "Next: add problem statement";
                    if (room.getEventStart() != null && now.isAfter(room.getEventStart())) {
                        attentionCount++;
                    }
                } else if (!room.isIdeateDone()) {
                    nextStepLabel = "Next: brainstorm and approve ideas";
                } else if (!room.isPlanDone()) {
                    com.hackathonos.backend.plan.PlanStep unvalidatedStep = roomPlanSteps.stream()
                            .filter(s -> !s.isValidated())
                            .findFirst()
                            .orElse(null);
                    if (unvalidatedStep != null) {
                        String stepName = switch (unvalidatedStep.getStepKey()) {
                            case "prd" -> "PRD & Scope";
                            case "tech" -> "Tech Stack & Architecture";
                            case "phases" -> "Phases & Timeline";
                            case "tasks" -> "Tasks & Milestones";
                            case "demo" -> "Demo & Q&A";
                            default -> unvalidatedStep.getStepKey();
                        };
                        nextStepLabel = "Next: validate " + stepName;
                        attentionCount++;
                    } else {
                        nextStepLabel = "Next: finalize implementation plan";
                    }
                } else {
                    nextStepLabel = "Next: start build phase";
                }
            }

            int doneJourney = (room.isBriefDone() ? 1 : 0) +
                    (room.isIdeateDone() ? 1 : 0) +
                    (room.isPlanDone() ? 1 : 0) +
                    (room.getBuildStartedAt() != null ? 1 : 0);

            items.add(new RoomListItemDto(
                    room.getId(),
                    room.getName(),
                    room.getDescription(),
                    room.getTemplateId(),
                    templateName,
                    room.getStage(),
                    room.getEventStart(),
                    room.getEventEnd(),
                    memberCount,
                    role,
                    isLeader,
                    new RoomListItemDto.JourneyProgress(doneJourney, 4),
                    room.getCreatedAt(),
                    durationHours,
                    phase,
                    phaseIndex,
                    phaseCount,
                    room.getEventStart(),
                    room.getEventEnd(),
                    submittedAt,
                    memberPreview,
                    nextStepLabel,
                    attentionCount
            ));
        }

        return items;
    }

    /**
     * Returns full room details including stage completion flags and server timestamp.
     * Ensures caller is an active member of the requested room.
     */
    public RoomDetailDto getRoomDetail(User user, UUID roomId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String templateName = templateService.getOrThrow(room.getTemplateId()).getName();
        long count = memberRepository.countByRoomId(room.getId());
        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        return roomMapper.toDetail(room, templateName, count, member.getRole(), isLeader);
    }

    /**
     * Updates editable room fields (name, description, eventStart, timezone).
     * Recalculates eventEnd if eventStart changed; requires leader privileges.
     */
    @Transactional
    public RoomDetailDto updateRoom(User user, UUID roomId, UpdateRoomRequest request) {
        RoomMember member = roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        EventTemplate template = templateService.getOrThrow(room.getTemplateId());

        applyRoomUpdates(room, request, template);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);

        activityLogger.log(room, user, "room_updated", "Updated room details");
        long count = memberRepository.countByRoomId(room.getId());
        return roomMapper.toDetail(room, template.getName(), count, member.getRole(), true);
    }

    /**
     * Archives a room so it no longer appears in member room lists.
     * Requires leader privileges; preserves database rows for audit integrity.
     */
    @Transactional
    public void archiveRoom(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        room.setArchivedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "room_archived", "Archived the room");
    }

    /**
     * Generates a unique, non-colliding room name suggestion based on season and tech themes.
     */
    public SuggestNameResponse suggestName(User user) {
        String[] adjectives = {"Autumn", "Quantum", "Hyper", "Stellar", "Cosmic", "Agile", "Apex", "Nexus", "Turbo", "Vivid", "Rapid"};
        String[] nouns = {"Build Sprint", "Codefest", "Hacks", "Lab", "Works", "Studio", "Launch", "Sprint", "Challenge"};
        int year = LocalDate.now().getYear();

        for (int i = 0; i < 20; i++) {
            String adj = adjectives[RANDOM.nextInt(adjectives.length)];
            String noun = nouns[RANDOM.nextInt(nouns.length)];
            String candidate = adj + " " + noun + " " + year;
            return new SuggestNameResponse(candidate);
        }
        return new SuggestNameResponse("Hackathon Sprint " + year);
    }

    /**
     * Regenerates the 4-character join code for the room.
     * Requires leader privileges and immediately invalidates the old code.
     */
    @Transactional
    public JoinCodeResponse regenerateJoinCode(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String newCode = generateUniqueJoinCode();
        room.setJoinCode(newCode);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "join_code_regenerated", "Regenerated the room join code");
        return new JoinCodeResponse(newCode);
    }

    /**
     * Returns stage steps and status for the room's hackathon journey.
     */
    public JourneyDto getJourney(User user, UUID roomId) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        return stageService.getJourney(room);
    }

    private void applyRoomUpdates(Room room, UpdateRoomRequest request, EventTemplate template) {
        if (request.name() != null) room.setName(request.name().trim());
        if (request.description() != null) room.setDescription(request.description().trim());
        if (request.projectDescription() != null) room.setProjectDescription(request.projectDescription().trim());
        if (request.timezone() != null) room.setTimezone(request.timezone().trim());
        if (request.eventStart() != null) {
            Instant newStart = Instant.parse(request.eventStart().trim());
            room.setEventStart(newStart);
            room.setEventEnd(newStart.plus(template.getDurationHours(), ChronoUnit.HOURS));
        }
    }

    private String resolveTimezone(User user, String requestedTimezone) {
        if (requestedTimezone != null && !requestedTimezone.isBlank()) {
            return requestedTimezone.trim();
        }
        return settingsRepository.findById(user.getId())
                .map(UserSettings::getTimezone)
                .orElse("UTC");
    }

    private Instant resolveEventStart(String eventStartStr, String timezone) {
        if (eventStartStr != null && !eventStartStr.isBlank()) {
            Instant parsed = Instant.parse(eventStartStr.trim());
            if (parsed.isAfter(Instant.now().plus(730, ChronoUnit.DAYS))) {
                throw new BadRequestException("INVALID_START_DATE", "Event start date cannot be more than 2 years in the future");
            }
            return parsed;
        }

        ZoneId zone = ZoneId.of(timezone.equals("UTC") ? "UTC" : timezone);
        LocalDate nextSaturday = LocalDate.now(zone).with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
        ZonedDateTime satMorning = nextSaturday.atTime(9, 0).atZone(zone);
        return satMorning.toInstant();
    }

    private String generateUniqueJoinCode() {
        for (int i = 0; i < 50; i++) {
            StringBuilder sb = new StringBuilder(4);
            for (int c = 0; c < 4; c++) {
                sb.append(JOIN_CODE_CHARS.charAt(RANDOM.nextInt(JOIN_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByJoinCodeIgnoreCase(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique join code after retries");
    }

    private String generateKeyPrefix(String name) {
        if (name == null || name.isBlank()) return "ROOM";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            String cleaned = w.replaceAll("[^a-zA-Z]", "");
            if (!cleaned.isEmpty()) {
                sb.append(Character.toUpperCase(cleaned.charAt(0)));
            }
            if (sb.length() >= 4) break;
        }
        return sb.length() >= 2 ? sb.toString() : "ROOM";
    }
}
