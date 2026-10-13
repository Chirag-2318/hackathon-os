package com.hackathonos.backend.rooms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.checkpoints.RoomCheckpoint;
import com.hackathonos.backend.checkpoints.RoomCheckpointRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.dto.*;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class RoomService {

    private static final String UNAMBIGUOUS_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final EventTemplateService templateService;
    private final UserSettingsRepository settingsRepository;
    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final RoomTimeService timeService;
    private final RoomMapper roomMapper;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PlanStepRepository planStepRepository;
    private final BriefRepository briefRepository;
    private final RoomCheckpointRepository checkpointRepository;
    private final NextStepService nextStepService;
    private final CheckpointService checkpointService;
    private final PlanPhaseRepository phaseRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final ObjectMapper objectMapper;

    public RoomService(RoomRepository roomRepository,
                       RoomMemberRepository memberRepository,
                       EventTemplateService templateService,
                       UserSettingsRepository settingsRepository,
                       RoomAccess roomAccess,
                       RoomStageService stageService,
                       RoomTimeService timeService,
                       RoomMapper roomMapper,
                       ActivityLogger activityLogger,
                       NotificationService notificationService,
                       UserRepository userRepository,
                       TaskRepository taskRepository,
                       PlanStepRepository planStepRepository,
                       BriefRepository briefRepository,
                       RoomCheckpointRepository checkpointRepository,
                       NextStepService nextStepService,
                       CheckpointService checkpointService,
                       PlanPhaseRepository phaseRepository,
                       DocRepository docRepository,
                       DocVersionRepository docVersionRepository,
                       ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.templateService = templateService;
        this.settingsRepository = settingsRepository;
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.timeService = timeService;
        this.roomMapper = roomMapper;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.planStepRepository = planStepRepository;
        this.briefRepository = briefRepository;
        this.checkpointRepository = checkpointRepository;
        this.nextStepService = nextStepService;
        this.checkpointService = checkpointService;
        this.phaseRepository = phaseRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public RoomDetailDto createRoom(User creator, CreateRoomRequest request) {
        EventTemplate template = templateService.getOrThrow(request.templateId());
        int duration = (request.durationHours() != null && request.durationHours() > 0)
                ? request.durationHours() : template.getDurationHours();
        if (duration < 1 || duration > 168) {
            throw new BadRequestException("INVALID_DATES", "Duration must be between 1 and 168 hours");
        }

        String timezone = resolveTimezone(creator, request.timezone());
        Instant startsAt = (request.startsAt() != null && !request.startsAt().isBlank())
                ? Instant.parse(request.startsAt().trim())
                : resolveEventStart(request.eventStart(), timezone);
        Instant endsAt = (request.endsAt() != null && !request.endsAt().isBlank())
                ? Instant.parse(request.endsAt().trim())
                : startsAt.plus(duration, ChronoUnit.HOURS);
        Instant freezeAt = (request.freezeAt() != null && !request.freezeAt().isBlank())
                ? Instant.parse(request.freezeAt().trim())
                : startsAt.plus((long) (duration * 3600_000L * 0.70), ChronoUnit.MILLIS);

        if (!startsAt.isBefore(freezeAt) || !freezeAt.isBefore(endsAt)) {
            throw new BadRequestException("INVALID_DATES", "Dates must satisfy startsAt < freezeAt < endsAt");
        }

        String joinCode = generateUniqueJoinCode();
        String keyPrefix = generateKeyPrefix(request.name());

        Room room = new Room(request.name().trim(), request.description(), request.projectDescription(),
                template.getId(), creator.getId(), startsAt, endsAt, timezone, keyPrefix, joinCode);
        room.setDurationHours(duration);
        room.setFreezeAt(freezeAt);
        roomRepository.save(room);

        RoomMember leader = new RoomMember(room.getId(), creator.getId(), "LEADER");
        memberRepository.save(leader);

        seedTemplatePhases(room, template);
        checkpointService.createForRoom(room);
        seedInitialDocs(room, creator);

        activityLogger.log(room, creator, "room_created", "Created the room");
        notificationService.notifyUser(creator, room, NotificationType.ROOM_CREATED, "Room created", room.getName());

        return getRoomDetail(creator, room.getId());
    }

    private void seedTemplatePhases(Room room, EventTemplate template) {
        if (template.getPhases() == null || template.getPhases().isBlank()) return;
        try {
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(template.getPhases());
            if (root.isArray()) {
                int pos = 0;
                for (com.fasterxml.jackson.databind.JsonNode node : root) {
                    String name = node.has("name") ? node.get("name").asText() : "Phase " + (pos + 1);
                    double startPct = node.has("startPct") ? node.get("startPct").asDouble() : 0.0;
                    double endPct = node.has("endPct") ? node.get("endPct").asDouble() : 100.0;
                    String exitCheckpoint = node.has("exitCheckpoint") ? node.get("exitCheckpoint").asText() : "";
                    String key = name.toLowerCase().replaceAll("[^a-z0-9]+", "_");
                    PlanPhase phase = new PlanPhase(
                            room.getId(),
                            key,
                            pos++,
                            name,
                            java.math.BigDecimal.valueOf(startPct),
                            java.math.BigDecimal.valueOf(endPct),
                            exitCheckpoint,
                            "[]"
                    );
                    phaseRepository.save(phase);
                }
            }
        } catch (Exception ignored) {}
    }

    private void seedInitialDocs(Room room, User creator) {
        try {
            if (docRepository.findByRoomIdAndFileName(room.getId(), "README.md").isEmpty()) {
                Doc readme = new Doc(room.getId(), "README.md", "Project Overview", 1);
                readme.setLastEditedBy(creator.getId());
                readme = docRepository.save(readme);
                String initialContent = "# " + room.getName() + "\n\n" +
                        (room.getDescription() != null ? room.getDescription() + "\n\n" : "") +
                        (room.getProjectDescription() != null ? "### Project Scope\n" + room.getProjectDescription() + "\n" : "");
                docVersionRepository.save(new DocVersion(readme.getId(), 1, initialContent, "Initial workspace README", creator.getId()));
            }
        } catch (Exception ignored) {}
    }

    public List<RoomListItemDto> listRooms(User user) {
        List<Room> rooms = roomRepository.findActiveRoomsByMemberUserId(user.getId());
        if (rooms.isEmpty()) return Collections.emptyList();

        List<UUID> roomIds = rooms.stream().map(Room::getId).toList();
        List<RoomMember> allMembers = memberRepository.findByRoomIdIn(roomIds);
        Map<UUID, List<RoomMember>> membersByRoom = allMembers.stream()
                .collect(java.util.stream.Collectors.groupingBy(RoomMember::getRoomId));

        Set<UUID> previewUserIds = new HashSet<>();
        for (UUID rId : roomIds) {
            membersByRoom.getOrDefault(rId, Collections.emptyList()).stream().limit(4)
                    .forEach(m -> previewUserIds.add(m.getUserId()));
        }
        Map<UUID, User> userMap = userRepository.findAllById(previewUserIds).stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, u -> u));

        List<RoomListItemDto> items = new ArrayList<>();
        for (Room room : rooms) {
            List<RoomMember> rMembers = membersByRoom.getOrDefault(room.getId(), Collections.emptyList());
            RoomMember myMember = rMembers.stream().filter(m -> m.getUserId().equals(user.getId())).findFirst().orElse(null);
            String myRole = myMember != null ? myMember.getRole() : "BUILDER";
            boolean isLeader = "LEADER".equalsIgnoreCase(myRole);

            List<UserSummaryDto> memberPreview = rMembers.stream().limit(4)
                    .map(m -> userMap.get(m.getUserId()))
                    .filter(Objects::nonNull)
                    .map(u -> new UserSummaryDto(u.getId(), u.getName(), u.getAvatarUrl(), u.getLogin()))
                    .toList();

            RoomClockDto clock = timeService.computeClock(room);
            boolean aiAllowed = isAiAllowed(room.getId());
            RoomProgressSummaryDto progress = computeProgressSummary(room.getId());
            NextStepDto nextStep = nextStepService.computeNextStep(room);

            items.add(new RoomListItemDto(
                    room.getId(), room.getName(), room.getDescription(), room.getTemplateId(),
                    resolveTemplateName(room.getTemplateId()),
                    room.getStage(), room.getStartsAt(), room.getEndsAt(), rMembers.size(), myRole, isLeader,
                    new RoomListItemDto.JourneyProgress((int) progress.stepsValidated(), (int) progress.stepsTotal()),
                    room.getCreatedAt(), room.getDurationHours(), room.getWorkflowStage(),
                    0, 4, room.getStartsAt(), room.getEndsAt(), room.getSubmittedAt(), memberPreview,
                    nextStep != null ? nextStep.label() : ("Live in " + room.getWorkflowStage()), 0, clock, aiAllowed, progress, nextStep
            ));
        }
        return items;
    }

    public RoomDetailDto getRoomDetail(User user, UUID roomId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String templateName = resolveTemplateName(room.getTemplateId());
        long memberCount = memberRepository.countByRoomId(room.getId());
        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());

        RoomClockDto clock = timeService.computeClock(room);
        boolean aiAllowed = isAiAllowed(room.getId());
        RoomProgressSummaryDto progress = computeProgressSummary(room.getId());
        List<StageUnlockRuleDto> unlockRules = stageService.computeUnlockRules(room);
        NextStepDto nextStep = nextStepService.computeNextStep(room);

        return roomMapper.toDetail(room, templateName, memberCount, member.getRole(), isLeader,
                clock, aiAllowed, progress, unlockRules, nextStep);
    }

    @Transactional
    public RoomDetailDto updateRoom(User user, UUID roomId, UpdateRoomRequest request) {
        RoomMember member = roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        EventTemplate template = templateService.getOrThrow(room.getTemplateId());

        applyRoomUpdates(room, request, template);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);

        activityLogger.log(room, user, "room_updated", "Updated room details");
        return getRoomDetail(user, roomId);
    }

    @Transactional
    public void archiveRoom(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        room.setArchivedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "room_archived", "Archived the room");
    }

    @Transactional
    public void deleteRoom(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        room.setDeletedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "room_deleted", "Deleted the room");
    }

    @Transactional
    public JoinCodeResponse regenerateJoinCode(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String newCode = generateUniqueJoinCode();
        room.setJoinCode(newCode);
        room.setCodeRevoked(false);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "join_code_regenerated", "Regenerated the room join code");
        return new JoinCodeResponse(newCode);
    }

    @Transactional
    public void revokeJoinCode(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        room.setCodeRevoked(true);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "join_code_revoked", "Revoked the room join code");
    }

    public JourneyDto getJourney(User user, UUID roomId) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        return stageService.getJourney(room);
    }

    public SuggestNameResponse suggestName(User user) {
        String[] adjs = {"Quantum", "Hyper", "Stellar", "Cosmic", "Agile", "Apex", "Nexus", "Turbo", "Vivid", "Rapid"};
        String[] nouns = {"Codefest", "Hacks", "Lab", "Works", "Studio", "Launch", "Sprint", "Challenge"};
        int year = LocalDate.now().getYear();
        String candidate = adjs[SECURE_RANDOM.nextInt(adjs.length)] + " " + nouns[SECURE_RANDOM.nextInt(nouns.length)] + " " + year;
        return new SuggestNameResponse(candidate);
    }

    public RoomProgressSummaryDto computeProgressSummary(UUID roomId) {
        List<Task> tasks = taskRepository.findByRoomId(roomId);
        long tasksTotal = tasks.size();
        long tasksDone = tasks.stream().filter(Task::isConfirmedDone).count();
        boolean hasTasks = tasksTotal > 0;

        List<PlanStep> steps = planStepRepository.findByRoomId(roomId);
        long stepsValidated = steps.stream().filter(PlanStep::isValidated).count();

        List<RoomCheckpoint> checkpoints = checkpointRepository.findByRoomIdOrderByPositionAsc(roomId);
        long checklistTotal = checkpoints.size();
        long checklistDone = checkpoints.stream().filter(c -> c.getPassedAt() != null).count();

        return new RoomProgressSummaryDto(tasksDone, tasksTotal, hasTasks, stepsValidated, 5L, checklistDone, checklistTotal);
    }

    public boolean isAiAllowed(UUID roomId) {
        if (roomId == null) return true;
        return briefRepository.findByRoomId(roomId).map(b -> {
            String p = b.getAiPolicy();
            if (p == null || p.isBlank()) return true;
            String up = p.toUpperCase();
            return !(up.contains("FORBIDDEN") || up.contains("RESTRICTED") || up.contains("PROHIBITED") || up.contains("NO_AI"));
        }).orElse(true);
    }

    private void applyRoomUpdates(Room room, UpdateRoomRequest request, EventTemplate template) {
        if (request.name() != null) room.setName(request.name().trim());
        if (request.description() != null) room.setDescription(request.description().trim());
        if (request.projectDescription() != null) room.setProjectDescription(request.projectDescription().trim());
        if (request.timezone() != null) room.setTimezone(request.timezone().trim());
        if (request.deadlineOverridden() != null) room.setDeadlineOverridden(request.deadlineOverridden());

        if (request.durationHours() != null) {
            if (request.durationHours() < 1 || request.durationHours() > 168) {
                throw new BadRequestException("INVALID_DATES", "Duration must be between 1 and 168 hours");
            }
            room.setDurationHours(request.durationHours());
        }

        Instant startsAt = room.getStartsAt();
        if (request.startsAt() != null && !request.startsAt().isBlank()) {
            startsAt = Instant.parse(request.startsAt().trim());
            room.setStartsAt(startsAt);
        } else if (request.eventStart() != null && !request.eventStart().isBlank()) {
            startsAt = Instant.parse(request.eventStart().trim());
            room.setStartsAt(startsAt);
        }

        int duration = room.getDurationHours() > 0 ? room.getDurationHours() : template.getDurationHours();
        room.setDurationHours(duration);

        Instant endsAt = room.getEndsAt();
        if (request.endsAt() != null && !request.endsAt().isBlank()) {
            endsAt = Instant.parse(request.endsAt().trim());
            room.setEndsAt(endsAt);
            room.setDeadlineOverridden(true);
        } else if (!room.isDeadlineOverridden() && startsAt != null) {
            endsAt = startsAt.plus(duration, ChronoUnit.HOURS);
            room.setEndsAt(endsAt);
        }

        Instant freezeAt = room.getFreezeAt();
        if (request.freezeAt() != null && !request.freezeAt().isBlank()) {
            freezeAt = Instant.parse(request.freezeAt().trim());
            room.setFreezeAt(freezeAt);
        } else if (startsAt != null) {
            freezeAt = startsAt.plus((long) (duration * 3600_000L * 0.70), ChronoUnit.MILLIS);
            room.setFreezeAt(freezeAt);
        }

        if (startsAt != null && freezeAt != null && endsAt != null) {
            if (!startsAt.isBefore(freezeAt) || !freezeAt.isBefore(endsAt)) {
                throw new BadRequestException("INVALID_DATES", "Dates must satisfy startsAt < freezeAt < endsAt");
            }
        }
    }

    private String resolveTimezone(User user, String req) {
        if (req != null && !req.isBlank()) return req.trim();
        return settingsRepository.findById(user.getId()).map(UserSettings::getTimezone).orElse("UTC");
    }

    private Instant resolveEventStart(String eventStartStr, String timezone) {
        if (eventStartStr != null && !eventStartStr.isBlank()) {
            return Instant.parse(eventStartStr.trim());
        }
        ZoneId zone = ZoneId.of(timezone.equals("UTC") ? "UTC" : timezone);
        LocalDate nextSaturday = LocalDate.now(zone).with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
        return nextSaturday.atTime(9, 0).atZone(zone).toInstant();
    }

    private String generateUniqueJoinCode() {
        for (int i = 0; i < 50; i++) {
            StringBuilder sb = new StringBuilder(8);
            for (int c = 0; c < 8; c++) {
                sb.append(UNAMBIGUOUS_ALPHABET.charAt(SECURE_RANDOM.nextInt(UNAMBIGUOUS_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByJoinCodeIgnoreCase(code)) return code;
        }
        throw new IllegalStateException("Failed to generate unique join code");
    }

    private String generateKeyPrefix(String name) {
        if (name == null || name.isBlank()) return "ROOM";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            String cleaned = w.replaceAll("[^a-zA-Z]", "");
            if (!cleaned.isEmpty()) sb.append(Character.toUpperCase(cleaned.charAt(0)));
            if (sb.length() >= 4) break;
        }
        return sb.length() >= 2 ? sb.toString() : "ROOM";
    }

    private String resolveTemplateName(String templateId) {
        if (templateId == null || templateId.isBlank()) {
            return "Custom";
        }
        try {
            EventTemplate template = templateService.getOrThrow(templateId);
            return template != null ? template.getName() : "Custom";
        } catch (Exception e) {
            return "Custom";
        }
    }
}

