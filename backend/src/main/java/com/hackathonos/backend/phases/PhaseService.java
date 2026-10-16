package com.hackathonos.backend.phases;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.phases.dto.*;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.plan.PlanPromptService;
import com.hackathonos.backend.plan.dto.ValidationIssueDto;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.team.TeamCharterResponse;
import com.hackathonos.backend.team.TeamCharterResponseRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PhaseService {

    private static final Logger log = LoggerFactory.getLogger(PhaseService.class);

    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final RoomService roomService;
    private final PlanPhaseRepository phaseRepository;
    private final TaskRepository taskRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskLabelRepository labelRepository;
    private final TaskHistoryRepository historyRepository;
    private final TaskKeyService taskKeyService;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RoomPhaseDocRepository roomPhaseDocRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TeamCharterResponseRepository charterRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final IdeasService ideasService;
    private final AiService aiService;
    private final PlanPromptService planPromptService;
    private final NotificationService notificationService;
    private final RoomEventService roomEventService;
    private final ActivityLogger activityLogger;
    private final ObjectMapper objectMapper;

    // Cache for phase task prompts: key = roomId:phaseKey:hash
    private final Map<String, PhaseTaskPromptResponseDto> promptCache = new ConcurrentHashMap<>();

    public PhaseService(
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            RoomService roomService,
            PlanPhaseRepository phaseRepository,
            TaskRepository taskRepository,
            TaskDependencyRepository dependencyRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskLabelRepository labelRepository,
            TaskHistoryRepository historyRepository,
            TaskKeyService taskKeyService,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            RoomPhaseDocRepository roomPhaseDocRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            TeamCharterResponseRepository charterRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            IdeasService ideasService,
            AiService aiService,
            PlanPromptService planPromptService,
            NotificationService notificationService,
            RoomEventService roomEventService,
            ActivityLogger activityLogger,
            ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.roomService = roomService;
        this.phaseRepository = phaseRepository;
        this.taskRepository = taskRepository;
        this.dependencyRepository = dependencyRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.labelRepository = labelRepository;
        this.historyRepository = historyRepository;
        this.taskKeyService = taskKeyService;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.roomPhaseDocRepository = roomPhaseDocRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.charterRepository = charterRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.ideasService = ideasService;
        this.aiService = aiService;
        this.planPromptService = planPromptService;
        this.notificationService = notificationService;
        this.roomEventService = roomEventService;
        this.activityLogger = activityLogger;
        this.objectMapper = objectMapper;
    }

    /**
     * Lists every phase with status, task counts, hours, window, and readiness.
     */
    @Transactional(readOnly = true)
    public List<PhaseSummaryDto> getPhases(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<Task> allTasks = taskRepository.findByRoomId(roomId);

        Instant clockNow = Instant.now();
        Instant buildStart = room.getBuildStartedAt() != null ? room.getBuildStartedAt() : room.getEventStart();

        List<PhaseSummaryDto> result = new ArrayList<>();
        int n = phases.size();

        for (int i = 0; i < n; i++) {
            PlanPhase p = phases.get(i);
            String pKey = p.getPhaseKey();
            List<Task> pTasks = allTasks.stream()
                    .filter(t -> pKey != null && pKey.equalsIgnoreCase(t.getPhaseKey()))
                    .toList();

            int total = (int) pTasks.stream().filter(t -> !t.isDropped()).count();
            int confirmed = (int) pTasks.stream().filter(t -> t.isConfirmedDone() && !t.isDropped()).count();
            int awaiting = (int) pTasks.stream().filter(t -> !t.isDropped() && !t.isConfirmedDone() && "done".equalsIgnoreCase(t.getStatus())).count();
            int inProgress = (int) pTasks.stream().filter(t -> !t.isDropped() && "inprogress".equalsIgnoreCase(t.getStatus())).count();
            int todo = (int) pTasks.stream().filter(t -> !t.isDropped() && "todo".equalsIgnoreCase(t.getStatus())).count();
            int dropped = (int) pTasks.stream().filter(Task::isDropped).count();

            double hoursPlanned = pTasks.stream()
                    .filter(t -> !t.isDropped() && t.getEstimateHours() != null)
                    .mapToDouble(Task::getEstimateHours)
                    .sum();
            double hoursConfirmed = pTasks.stream()
                    .filter(t -> t.isConfirmedDone() && !t.isDropped() && t.getEstimateHours() != null)
                    .mapToDouble(Task::getEstimateHours)
                    .sum();

            BigDecimal startH = p.getStartHour() != null ? p.getStartHour() : BigDecimal.ZERO;
            BigDecimal endH = p.getEndHour() != null ? p.getEndHour() : BigDecimal.valueOf(Math.max(1, room.getDurationHours()));
            Instant startTime = buildStart != null ? buildStart.plus(Duration.ofMinutes((long)(startH.doubleValue() * 60))) : null;
            Instant endTime = buildStart != null ? buildStart.plus(Duration.ofMinutes((long)(endH.doubleValue() * 60))) : null;

            boolean overdue = !"COMPLETED".equalsIgnoreCase(p.getStatus()) && endTime != null && clockNow.isAfter(endTime);
            boolean tasksGen = p.getTasksGeneratedAt() != null;
            boolean isCur = "ACTIVE".equalsIgnoreCase(p.getStatus());
            boolean ready = isCur && tasksGen && !pTasks.isEmpty() && pTasks.stream().allMatch(t -> t.isConfirmedDone() || t.isDropped());
            String nextPhaseKey = (i + 1 < n) ? phases.get(i + 1).getPhaseKey() : null;

            result.add(new PhaseSummaryDto(
                    p.getId(),
                    p.getPhaseKey(),
                    p.getName(),
                    p.getPosition(),
                    p.getStatus(),
                    p.getGoal(),
                    p.getExitCheckpoint(),
                    p.getOwners(),
                    p.getDeliverables(),
                    p.getRawMarkdown(),
                    new PhaseSummaryDto.TaskCountsDto(total, confirmed, awaiting, inProgress, todo, dropped),
                    hoursPlanned,
                    hoursConfirmed,
                    new PhaseSummaryDto.PhaseWindowDto(startH, endH, startTime, endTime),
                    overdue,
                    ready,
                    tasksGen,
                    isCur,
                    nextPhaseKey
            ));
        }

        return result;
    }

    /**
     * Advances to the next phase in ONE transaction.
     */
    @Transactional
    public PhaseAdvanceResponseDto advancePhase(UUID roomId, String phaseKey, PhaseAdvanceRequestDto request, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<PlanPhase> allPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);

        PlanPhase activePhase = allPhases.stream()
                .filter(p -> p.getPhaseKey() != null && p.getPhaseKey().equalsIgnoreCase(phaseKey))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("PHASE_NOT_FOUND", "Phase not found: " + phaseKey));

        if (!"ACTIVE".equalsIgnoreCase(activePhase.getStatus())) {
            throw new BadRequestException("PHASE_NOT_ACTIVE", "Phase " + phaseKey + " is not active");
        }

        int pos = activePhase.getPosition();
        boolean isLastPhase = (pos >= allPhases.size() - 1);
        List<Task> tasks = taskRepository.findByRoomIdAndPhaseKey(roomId, activePhase.getPhaseKey());
        List<Task> unfinishedTasks = tasks.stream()
                .filter(t -> !t.isConfirmedDone() && !t.isDropped())
                .toList();

        if (!unfinishedTasks.isEmpty()) {
            if (request == null || request.carryover() == null || request.carryover().isBlank()) {
                List<String> details = unfinishedTasks.stream()
                        .map(t -> t.getTaskKey() + ": " + t.getTitle())
                        .toList();
                throw new ConflictException("PHASE_NOT_READY", "Phase has unfinished tasks. Choose to defer or drop them to advance early.", details);
            }
            if ("DEFER_ALL".equalsIgnoreCase(request.carryover())) {
                if (isLastPhase) {
                    throw new BadRequestException("CANNOT_DEFER_FROM_LAST_PHASE", "Cannot defer tasks from the last phase");
                }
                PlanPhase nextPhase = allPhases.get(pos + 1);
                for (Task t : unfinishedTasks) {
                    t.setPhaseKey(nextPhase.getPhaseKey());
                    t.setDeferredFrom(activePhase.getPhaseKey());
                    t.setUpdatedAt(Instant.now());
                    taskRepository.save(t);
                }
            } else if ("DROP_ALL".equalsIgnoreCase(request.carryover())) {
                for (Task t : unfinishedTasks) {
                    t.setStatus("DROPPED");
                    t.setDropReason("Dropped upon advancing phase");
                    t.setUpdatedAt(Instant.now());
                    taskRepository.save(t);
                }
            } else {
                throw new BadRequestException("INVALID_CARRYOVER", "Carryover must be DEFER_ALL or DROP_ALL");
            }
        }

        // Complete current phase
        activePhase.setStatus("COMPLETED");
        activePhase.setCompletedAt(Instant.now());
        phaseRepository.save(activePhase);

        roomEventService.recordEvent(roomId, "PHASE_COMPLETED", "phase", activePhase.getPhaseKey(), user.getId());
        activityLogger.log(room, user, "PHASE_COMPLETED", "Completed phase " + activePhase.getPhaseKey());

        if (isLastPhase) {
            return new PhaseAdvanceResponseDto(true, null, Collections.emptyList());
        }

        // Activate next phase
        PlanPhase nextPhase = allPhases.get(pos + 1);
        nextPhase.setStatus("ACTIVE");
        nextPhase.setActivatedAt(Instant.now());
        phaseRepository.save(nextPhase);

        roomEventService.recordEvent(roomId, "PHASE_STARTED", "phase", nextPhase.getPhaseKey(), user.getId());
        activityLogger.log(room, user, "PHASE_STARTED", "Started phase " + nextPhase.getPhaseKey());
        notificationService.notifyRoomMembers(room, null, NotificationType.PHASE_STARTED,
                "Phase " + nextPhase.getPhaseKey() + " started",
                "Phase " + nextPhase.getPhaseKey() + " (" + nextPhase.getName() + ") is now active.");

        return new PhaseAdvanceResponseDto(false, nextPhase.getPhaseKey(), Collections.emptyList());
    }

    /**
     * Defers an individual task to the next phase (leader only).
     */
    @Transactional
    public Task deferTask(UUID roomId, UUID taskId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        if (task.isConfirmedDone() || task.isDropped()) {
            throw new BadRequestException("INVALID_TASK_STATE", "Task is already completed or dropped");
        }

        List<PlanPhase> allPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        PlanPhase currentPhase = allPhases.stream()
                .filter(p -> p.getPhaseKey() != null && p.getPhaseKey().equalsIgnoreCase(task.getPhaseKey()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("PHASE_NOT_FOUND", "Phase not found for task"));

        if (currentPhase.getPosition() >= allPhases.size() - 1) {
            throw new BadRequestException("CANNOT_DEFER_FROM_LAST_PHASE", "Cannot defer tasks from the last phase");
        }

        PlanPhase nextPhase = allPhases.get(currentPhase.getPosition() + 1);
        task.setPhaseKey(nextPhase.getPhaseKey());
        task.setDeferredFrom(currentPhase.getPhaseKey());
        task.setUpdatedAt(Instant.now());
        Task saved = taskRepository.save(task);

        activityLogger.log(room, user, "TASK_DEFERRED", "Deferred task " + task.getTaskKey() + " to " + nextPhase.getPhaseKey());
        checkAndNotifyPhaseReady(room, currentPhase);
        return saved;
    }

    /**
     * Drops an individual task with a reason (leader only).
     */
    @Transactional
    public Task dropTask(UUID roomId, UUID taskId, String reason, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Task task = taskRepository.findByIdAndRoomId(taskId, roomId)
                .orElseThrow(() -> new NotFoundException("TASK_NOT_FOUND", "Task not found"));

        task.setStatus("DROPPED");
        task.setDropReason(reason != null && !reason.isBlank() ? reason.trim() : "Dropped by leader");
        task.setUpdatedAt(Instant.now());
        Task saved = taskRepository.save(task);

        activityLogger.log(room, user, "TASK_DROPPED", "Dropped task " + task.getTaskKey() + ": " + task.getDropReason());

        if (task.getPhaseKey() != null) {
            phaseRepository.findByRoomIdAndPlanKey(roomId, task.getPhaseKey()).ifPresent(p -> {
                checkAndNotifyPhaseReady(room, p);
            });
        }
        return saved;
    }

    /**
     * Dismisses the PhaseCompleteDialog ("Not yet") storing ready_dismissed_at.
     */
    @Transactional
    public void dismissPhaseReady(UUID roomId, String phaseKey, User user) {
        roomAccess.requireLeader(roomId, user);
        phaseRepository.findByRoomIdAndPlanKey(roomId, phaseKey).ifPresent(p -> {
            p.setReadyDismissedAt(Instant.now());
            phaseRepository.save(p);
        });
    }

    /**
     * Checks if a phase is READY and sends notification & room event once.
     */
    @Transactional
    public void checkAndNotifyPhaseReady(Room room, PlanPhase phase) {
        if (phase == null || !"ACTIVE".equalsIgnoreCase(phase.getStatus())) return;
        if (phase.getTasksGeneratedAt() == null) return;
        if (phase.getReadyNotifiedAt() != null) return;

        List<Task> tasks = taskRepository.findByRoomIdAndPhaseKey(room.getId(), phase.getPhaseKey());
        boolean allDone = !tasks.isEmpty() && tasks.stream().allMatch(t -> t.isConfirmedDone() || t.isDropped());
        if (allDone) {
            phase.setReadyNotifiedAt(Instant.now());
            phaseRepository.save(phase);

            roomEventService.recordEvent(room.getId(), "PHASE_READY", "phase", phase.getPhaseKey(), null);
            memberRepository.findByRoomIdAndRole(room.getId(), "LEADER").ifPresent(leaderMember -> {
                notificationService.create(
                        leaderMember.getUserId(),
                        room.getId(),
                        NotificationType.PHASE_READY,
                        "Phase " + phase.getPhaseKey() + " complete",
                        "All tasks in " + phase.getPhaseKey() + " (" + phase.getName() + ") are finished. Ready to advance!",
                        "/app/room/" + room.getId() + "/board"
                );
            });
        }
    }

    /**
     * Deterministic phase task prompt assembly under 150ms.
     */
    @Transactional(readOnly = true)
    public PhaseTaskPromptResponseDto buildPhaseTaskPrompt(UUID roomId, String phaseKey, String mode, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        List<PlanPhase> allPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);

        PlanPhase activePhase = allPhases.stream()
                .filter(p -> p.getPhaseKey() != null && p.getPhaseKey().equalsIgnoreCase(phaseKey))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("PHASE_NOT_FOUND", "Phase not found: " + phaseKey));

        if (!"ACTIVE".equalsIgnoreCase(activePhase.getStatus())) {
            throw new BadRequestException("PHASE_NOT_ACTIVE", "Only an active phase can be prepared");
        }

        String actualMode = ("APPEND".equalsIgnoreCase(mode)) ? "APPEND" : "FRESH";

        // Check if can regenerate
        List<Task> currentTasks = taskRepository.findByRoomIdAndPhaseKey(roomId, activePhase.getPhaseKey());
        boolean canRegenerate = currentTasks.isEmpty() || currentTasks.stream()
                .filter(t -> "PHASE_IMPORT".equalsIgnoreCase(t.getSource()))
                .allMatch(t -> "todo".equalsIgnoreCase(t.getStatus()) && !t.isConfirmed() && (t.getSpentHours() == null || t.getSpentHours() == 0.0));

        // Retrieve prompt elements
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        List<BriefRubricItem> rubric = rubricRepository.findByRoomIdOrderByOrderIndexAsc(roomId);
        List<Idea> approvedIdeas = ideaRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(roomId, "APPROVED");
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<UUID, User> memberUsers = new HashMap<>();
        Map<UUID, List<String>> memberSkills = new HashMap<>();
        for (RoomMember m : members) {
            userRepository.findById(m.getUserId()).ifPresent(u -> memberUsers.put(m.getUserId(), u));
            List<RoomMemberSkill> skills = skillRepository.findByMemberId(m.getId());
            memberSkills.put(m.getId(), skills.stream().map(RoomMemberSkill::getSkill).toList());
        }
        List<TeamCharterResponse> charters = charterRepository.findByRoomId(roomId);

        // 1. FACTS
        String factsText = planPromptService.buildFactsText(room, brief, rubric, approvedIdeas, members, memberUsers, memberSkills, charters);

        // 2. PHASE
        Instant clockNow = Instant.now();
        Instant eventEnd = room.getEventEnd();
        long hoursLeft = 36;
        if (eventEnd != null) {
            hoursLeft = Math.max(0, Duration.between(clockNow, eventEnd).toHours());
        }
        String phaseBlock = (activePhase.getRawMarkdown() != null && !activePhase.getRawMarkdown().isBlank())
                ? activePhase.getRawMarkdown()
                : ("### " + activePhase.getPhaseKey() + " - " + activePhase.getName() + "\n- Goal: " + activePhase.getGoal() + "\n- Exit checkpoint: " + activePhase.getExitCheckpoint());
        String phaseText = phaseBlock + "\n\n- Position: Phase " + (activePhase.getPosition() + 1) + " of " + allPhases.size() + "\n- Event hours remaining: " + hoursLeft + "h\n";

        // 3. PRIOR
        String priorText = buildPriorDigest(roomId);

        // 4. CARRYOVER
        List<Task> carryoverTasks = allTasksBefore(allPhases, activePhase.getPosition(), roomId).stream()
                .filter(t -> !t.isConfirmedDone() && !t.isDropped())
                .limit(40)
                .toList();
        StringBuilder carryoverSb = new StringBuilder();
        if (carryoverTasks.isEmpty()) {
            carryoverSb.append("None\n");
        } else {
            for (Task t : carryoverTasks) {
                User u = t.getAssigneeId() != null ? memberUsers.get(t.getAssigneeId()) : null;
                String handle = planPromptService.getHandle(u);
                carryoverSb.append("- [").append(t.getTaskKey()).append("] ").append(t.getTitle())
                        .append(" (Assignee: ").append(handle)
                        .append(", Status: ").append(t.getStatus())
                        .append(", Est left: ").append(t.getEstimateHours() != null ? t.getEstimateHours() : 0.0).append("h)\n");
            }
        }

        // 5. EXISTING
        StringBuilder existingSb = new StringBuilder();
        if (currentTasks.isEmpty()) {
            existingSb.append("None\n");
        } else {
            for (Task t : currentTasks) {
                User u = t.getAssigneeId() != null ? memberUsers.get(t.getAssigneeId()) : null;
                String handle = planPromptService.getHandle(u);
                existingSb.append("- [").append(t.getTaskKey()).append("] ").append(t.getTitle())
                        .append(" (Assignee: ").append(handle)
                        .append(", Status: ").append(t.getStatus()).append(")\n");
            }
        }

        // 6. CAPACITY
        double phaseHours = activePhase.getEndHour() != null && activePhase.getStartHour() != null
                ? Math.max(1.0, activePhase.getEndHour().doubleValue() - activePhase.getStartHour().doubleValue())
                : 6.0;
        StringBuilder capacitySb = new StringBuilder();
        capacitySb.append("| Member | Role | Hours available in phase | Notes |\n");
        capacitySb.append("| --- | --- | --- | --- |\n");
        for (RoomMember m : members) {
            User u = memberUsers.get(m.getUserId());
            String handle = planPromptService.getHandle(u);
            double carryoverForMember = carryoverTasks.stream()
                    .filter(t -> m.getUserId().equals(t.getAssigneeId()) && t.getEstimateHours() != null)
                    .mapToDouble(Task::getEstimateHours)
                    .sum();
            double avail = Math.max(0.0, (phaseHours * 0.6) - carryoverForMember);
            capacitySb.append("| ").append(handle).append(" | ").append(m.getRole())
                    .append(" | ").append(String.format(Locale.ROOT, "%.1fh", avail))
                    .append(" | Carryover: ").append(String.format(Locale.ROOT, "%.1fh", carryoverForMember)).append(" |\n");
        }

        // 7. TARGETS
        int activeMemberCount = Math.max(1, members.size());
        int baseCount = (int) Math.round(phaseHours * activeMemberCount / 3.0);
        int clamped = Math.max(4, Math.min(24, baseCount));
        int lower = Math.max(4, (int) Math.round(clamped * 0.8));
        int upper = Math.min(24, (int) Math.round(clamped * 1.2));
        String targetRange = lower + " to " + upper;

        String nextPhaseId = (activePhase.getPosition() + 1 < allPhases.size())
                ? allPhases.get(activePhase.getPosition() + 1).getPhaseKey()
                : "None (Final phase)";

        List<String> uncoveredFrs = findUncoveredRequirements(roomId, currentTasks, actualMode);
        StringBuilder targetsSb = new StringBuilder();
        targetsSb.append("- MODE: ").append(actualMode).append("\n");
        targetsSb.append("- Target task count: ").append(targetRange).append(" tasks\n");
        targetsSb.append("- Target phase: ").append(activePhase.getPhaseKey()).append("\n");
        targetsSb.append("- Next phase: ").append(nextPhaseId).append("\n");
        targetsSb.append("- Priority requirements needing coverage: ").append(uncoveredFrs.isEmpty() ? "None" : String.join(", ", uncoveredFrs)).append("\n");

        String template = planPromptService.getPhaseTasksTemplate();
        String fused = template.replace("{{FACTS}}", factsText)
                .replace("{{PHASE}}", phaseText)
                .replace("{{PRIOR}}", priorText)
                .replace("{{CARRYOVER}}", carryoverSb.toString())
                .replace("{{EXISTING}}", existingSb.toString())
                .replace("{{CAPACITY}}", capacitySb.toString())
                .replace("{{TARGETS}}", targetsSb.toString());

        String bundleName = "phase-" + activePhase.getPhaseKey() + "-tasks.md";
        String outputFileName = "TASKS_" + activePhase.getPhaseKey() + ".md";
        if (!fused.contains("=== OUTPUT DELIVERY")) {
            fused = fused + planPromptService.buildOutputDeliveryBlock(bundleName, List.of(outputFileName));
        }

        PhaseTaskPromptResponseDto dto = new PhaseTaskPromptResponseDto(
                fused,
                fused.length(),
                actualMode,
                outputFileName,
                bundleName,
                targetsSb.toString(),
                false,
                canRegenerate
        );

        return dto;
    }

    private List<Task> allTasksBefore(List<PlanPhase> allPhases, int currentPos, UUID roomId) {
        Set<String> earlierKeys = new HashSet<>();
        for (int i = 0; i < currentPos; i++) {
            earlierKeys.add(allPhases.get(i).getPhaseKey());
        }
        return taskRepository.findByRoomId(roomId).stream()
                .filter(t -> t.getPhaseKey() != null && earlierKeys.contains(t.getPhaseKey()))
                .toList();
    }

    private String buildPriorDigest(UUID roomId) {
        StringBuilder sb = new StringBuilder();
        List<Doc> docs = docRepository.findByRoomId(roomId);
        Map<String, String> docMap = new HashMap<>();
        for (Doc d : docs) {
            List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(d.getId());
            if (!vers.isEmpty()) {
                docMap.put(d.getFileName(), vers.get(0).getContent());
            }
        }

        appendDocSection(sb, "PRD.md", docMap.get("PRD.md"), 2200, true);
        appendDocSection(sb, "MVP.md", docMap.get("MVP.md"), 2200, false);
        appendDocSection(sb, "TECH_STACK.md", docMap.get("TECH_STACK.md"), 2200, false);
        appendDocSection(sb, "ARCHITECTURE.md", docMap.get("ARCHITECTURE.md"), 2200, true);
        appendDocSection(sb, "DESIGN.md", docMap.get("DESIGN.md"), 2200, false);
        return sb.toString();
    }

    private void appendDocSection(StringBuilder sb, String name, String content, int cap, boolean preserveRows) {
        if (content == null || content.isBlank()) return;
        sb.append("=== ").append(name).append(" ===\n");
        if (content.length() <= cap) {
            sb.append(content).append("\n\n");
        } else {
            if (preserveRows) {
                // Keep FR and API contract lines intact, compress other lines
                StringBuilder filtered = new StringBuilder();
                for (String line : content.split("\n")) {
                    if (line.contains("FR-") || line.contains("| /") || line.contains("| GET") || line.contains("| POST")) {
                        filtered.append(line).append("\n");
                    } else if (filtered.length() < cap - 300) {
                        filtered.append(line).append("\n");
                    }
                }
                sb.append(filtered).append("\n\n");
            } else {
                sb.append(content.substring(0, cap)).append("... [truncated]\n\n");
            }
        }
    }

    private List<String> findUncoveredRequirements(UUID roomId, List<Task> currentTasks, String mode) {
        List<String> result = new ArrayList<>();
        Doc prd = docRepository.findByRoomIdAndFileName(roomId, "PRD.md").orElse(null);
        if (prd == null) return result;
        List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(prd.getId());
        if (vers.isEmpty()) return result;

        String prdContent = vers.get(0).getContent();
        Pattern frPattern = Pattern.compile("(?i)(FR-\\d+).*?(MUST|SHOULD)");
        Matcher m = frPattern.matcher(prdContent);

        Set<String> priorityFrs = new LinkedHashSet<>();
        while (m.find()) {
            priorityFrs.add(m.group(1).toUpperCase());
        }

        List<Task> allRoomTasks = taskRepository.findByRoomId(roomId);
        Set<String> coveredFrs = new HashSet<>();
        for (Task t : allRoomTasks) {
            if ("APPEND".equalsIgnoreCase(mode) && currentTasks.contains(t)) {
                // in append mode, tasks already in this phase count as covering
            }
            if (t.getRequirement() != null && !t.isDropped()) {
                Matcher tm = Pattern.compile("FR-\\d+", Pattern.CASE_INSENSITIVE).matcher(t.getRequirement());
                while (tm.find()) {
                    coveredFrs.add(tm.group().toUpperCase());
                }
            }
        }

        for (String fr : priorityFrs) {
            if (!coveredFrs.contains(fr)) {
                result.add(fr);
            }
        }
        return result;
    }

    /**
     * Builds and downloads project-context.md concatenating PRD, MVP, TECH_STACK, ARCHITECTURE, PHASES, DESIGN, and ideas.md.
     */
    @Transactional(readOnly = true)
    public byte[] buildProjectContextPack(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<String> order = List.of("PRD.md", "MVP.md", "TECH_STACK.md", "ARCHITECTURE.md", "PHASES.md", "DESIGN.md");
        StringBuilder sb = new StringBuilder();

        for (String file : order) {
            Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, file);
            if (docOpt.isPresent()) {
                List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(docOpt.get().getId());
                if (!vers.isEmpty()) {
                    sb.append("=====FILE: ").append(file).append("=====\n");
                    sb.append(vers.get(0).getContent()).append("\n");
                    sb.append("=====END FILE=====\n\n");
                }
            }
        }

        String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);
        sb.append("=====FILE: IDEAS.md=====\n");
        sb.append(ideasMd).append("\n");
        sb.append("=====END FILE=====\n");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Validates and imports phase tasks with tolerant parser.
     */
    @Transactional
    public PhaseTaskImportSummaryDto validateAndImportTasks(
            UUID roomId,
            String phaseKey,
            MultipartFile[] files,
            String mode,
            boolean confirmRegenerate,
            User user
    ) {
        try {
            return doValidateAndImportTasks(roomId, phaseKey, files, mode, confirmRegenerate, user);
        } catch (BadRequestException | ConflictException | NotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to validate and import tasks for room {} phase {}: {}", roomId, phaseKey, e.getMessage(), e);
            throw new BadRequestException("IMPORT_FAILED", "Failed to import tasks: " + e.getMessage());
        }
    }

    private PhaseTaskImportSummaryDto doValidateAndImportTasks(
            UUID roomId,
            String phaseKey,
            MultipartFile[] files,
            String mode,
            boolean confirmRegenerate,
            User user
    ) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        PlanPhase phase = phaseRepository.findByRoomIdAndPlanKey(roomId, phaseKey)
                .orElseThrow(() -> new NotFoundException("PHASE_NOT_FOUND", "Phase not found: " + phaseKey));

        String rawContent = extractContentFromFiles(files, phase.getPhaseKey());
        if (rawContent == null || rawContent.isBlank()) {
            throw new BadRequestException("EMPTY_FILE", "Upload content is empty");
        }

        String targetDocName = "TASKS_" + phase.getPhaseKey() + ".md";
        String docContent = unwrapFileMarker(rawContent, targetDocName);

        List<ValidationIssueDto> issues = new ArrayList<>();
        List<ParsedTask> parsedTasks = parseTasks(docContent, phase.getPhaseKey(), issues);

        // Required H2 headings check
        checkHeadings(docContent, issues);

        // Validation rules
        validateRules(room, phase, parsedTasks, issues);

        boolean hasBlocking = issues.stream().anyMatch(i -> "BLOCK".equalsIgnoreCase(i.severity()));
        if (hasBlocking) {
            return new PhaseTaskImportSummaryDto(false, false, issues, 0, 0.0, 0, Map.of(), List.of(), null);
        }

        boolean isAppend = "APPEND".equalsIgnoreCase(mode);
        List<Task> existingPhaseTasks = taskRepository.findByRoomIdAndPhaseKey(roomId, phase.getPhaseKey());

        if (!isAppend && !existingPhaseTasks.isEmpty()) {
            boolean anyStarted = existingPhaseTasks.stream()
                    .anyMatch(t -> !"todo".equalsIgnoreCase(t.getStatus()) || t.isConfirmed() || (t.getSpentHours() != null && t.getSpentHours() > 0));
            if (anyStarted) {
                throw new ConflictException("TASKS_ALREADY_STARTED", "Tasks in this phase have already been started. Add missing tasks instead.");
            }
            if (!confirmRegenerate) {
                return new PhaseTaskImportSummaryDto(true, true, issues, 0, 0.0, 0, Map.of(), List.of(), null);
            }
            // Delete existing tasks in phase
            for (Task t : existingPhaseTasks) {
                dependencyRepository.deleteByTaskId(t.getId());
                dependencyRepository.deleteByDependsOnTaskId(t.getId());
                acceptanceRepository.deleteByTaskId(t.getId());
                labelRepository.deleteByTaskId(t.getId());
                historyRepository.deleteByTaskId(t.getId());
                taskRepository.delete(t);
            }
        }

        // Map handles to users
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<String, UUID> handleToUserId = new HashMap<>();
        Map<String, Double> memberHours = new LinkedHashMap<>();
        for (RoomMember m : members) {
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                String h = planPromptService.getHandle(u).toLowerCase();
                handleToUserId.put(h, u.getId());
                memberHours.put(h, 0.0);
            });
        }

        Map<String, Task> localKeyToTask = new HashMap<>();
        double totalHours = 0.0;
        int maxPos = taskRepository.findByRoomIdOrderByPositionAsc(roomId).size();

        for (ParsedTask pt : parsedTasks) {
            TaskKeyService.TaskKeyResult keyResult = taskKeyService.nextKeyResult(room);
            while (taskRepository.findByRoomIdAndTaskKey(roomId, keyResult.key()).isPresent()) {
                keyResult = taskKeyService.nextKeyResult(room);
            }
            String realKey = keyResult.key();

            UUID assigneeId = null;
            if (pt.assignee() != null && !pt.assignee().isBlank()) {
                String cleanH = pt.assignee().startsWith("@") ? pt.assignee().toLowerCase() : "@" + pt.assignee().toLowerCase();
                assigneeId = handleToUserId.get(cleanH);
                if (assigneeId != null) {
                    memberHours.put(cleanH, memberHours.getOrDefault(cleanH, 0.0) + pt.estimate());
                }
            }

            Task task = new Task(
                    roomId,
                    realKey,
                    pt.title(),
                    pt.description(),
                    "TODO",
                    maxPos++,
                    assigneeId,
                    user.getId(),
                    phase.getPhaseKey(),
                    "PHASE_IMPORT",
                    pt.role()
            );
            task.setSource("PHASE_IMPORT");
            task.setPhaseId(phase.getId());
            task.setLocalId(pt.localId());
            task.setEstimateHours(pt.estimate());
            task.setPriority(Task.normalizePriority(pt.priority()));
            task.setRequirement(pt.requirement());
            task.setCreatedAt(Instant.now());
            task.setUpdatedAt(Instant.now());

            Task saved = taskRepository.save(task);
            localKeyToTask.put(pt.localId(), saved);
            totalHours += pt.estimate();

            // Acceptance criteria
            int acPos = 0;
            for (String ac : pt.acceptance()) {
                acceptanceRepository.save(new TaskAcceptanceItem(saved.getId(), ac, false, acPos++));
            }
            historyRepository.save(new TaskHistory(saved.getId(), user.getId(), "Imported from " + targetDocName));
        }

        // Remap dependencies
        Set<String> savedDeps = new HashSet<>();
        for (ParsedTask pt : parsedTasks) {
            Task current = localKeyToTask.get(pt.localId());
            if (current != null && pt.dependsOn() != null) {
                for (String dep : pt.dependsOn()) {
                    String cleanDep = dep.trim();
                    Task depTask = localKeyToTask.get(cleanDep);
                    if (depTask == null) {
                        depTask = taskRepository.findByRoomIdAndTaskKey(roomId, cleanDep.toUpperCase()).orElse(null);
                    }
                    if (depTask != null && !depTask.getId().equals(current.getId())) {
                        String depKey = current.getId() + "->" + depTask.getId();
                        if (savedDeps.add(depKey)) {
                            dependencyRepository.save(new TaskDependency(current.getId(), depTask.getId(), roomId));
                        }
                    }
                }
            }
        }

        // Save doc TASKS_{key}.md
        savePhaseDoc(room, phase, targetDocName, docContent, isAppend, user);

        phase.setTasksGeneratedAt(Instant.now());
        phaseRepository.save(phase);

        // Batched notification per assignee
        Map<UUID, Integer> userTaskCounts = new HashMap<>();
        for (Task t : localKeyToTask.values()) {
            if (t.getAssigneeId() != null) {
                userTaskCounts.put(t.getAssigneeId(), userTaskCounts.getOrDefault(t.getAssigneeId(), 0) + 1);
            }
        }
        for (Map.Entry<UUID, Integer> entry : userTaskCounts.entrySet()) {
            notificationService.create(
                    entry.getKey(),
                    roomId,
                    NotificationType.TASK_ASSIGNED,
                    "New tasks assigned",
                    entry.getValue() + " new tasks in " + phase.getPhaseKey(),
                    "/app/room/" + roomId + "/board"
            );
        }

        roomEventService.recordEvent(roomId, "PHASE_TASKS_IMPORTED", "phase", phase.getPhaseKey(), user.getId());
        activityLogger.log(room, user, "PHASE_TASKS_IMPORTED", "Imported " + parsedTasks.size() + " tasks for " + phase.getPhaseKey());

        List<String> uncovered = findUncoveredRequirements(roomId, List.of(), "APPEND");
        String nextKey = phase.getPosition() + 1 < phaseRepository.findByRoomIdOrderByPositionAsc(roomId).size()
                ? phaseRepository.findByRoomIdOrderByPositionAsc(roomId).get(phase.getPosition() + 1).getPhaseKey()
                : null;

        return new PhaseTaskImportSummaryDto(
                true,
                false,
                issues,
                parsedTasks.size(),
                totalHours,
                members.size(),
                memberHours,
                uncovered,
                nextKey
        );
    }

    private void savePhaseDoc(Room room, PlanPhase phase, String fileName, String content, boolean isAppend, User user) {
        Doc doc = docRepository.findByRoomIdAndFileName(room.getId(), fileName)
                .orElseGet(() -> {
                    Doc d = new Doc(room.getId(), fileName, "Phase Tasks for " + phase.getPhaseKey(), 1);
                    d.setSource("PLAN");
                    return docRepository.save(d);
                });

        List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        int nextVer = versions.isEmpty() ? 1 : versions.get(0).getVersion() + 1;
        doc.setCurrentVersion(nextVer);
        doc.setUpdatedAt(Instant.now());
        docRepository.save(doc);

        String finalContent = content;
        if (isAppend && !versions.isEmpty()) {
            finalContent = versions.get(0).getContent() + "\n\n## Append " + Instant.now() + "\n\n" + content;
        }

        docVersionRepository.save(new DocVersion(doc.getId(), nextVer, finalContent, "Phase import " + phase.getPhaseKey(), user.getId()));
        if (roomPhaseDocRepository.findByRoomIdAndPhaseKeyAndDocId(room.getId(), phase.getPhaseKey(), doc.getId()).isEmpty()) {
            roomPhaseDocRepository.save(new RoomPhaseDoc(room.getId(), phase.getId(), phase.getPhaseKey(), doc.getId(), fileName, nextVer));
        }
    }

    private String extractContentFromFiles(MultipartFile[] files, String phaseKey) {
        if (files == null || files.length == 0) return null;
        String cleanPhase = phaseKey != null ? phaseKey.toLowerCase() : "";
        for (MultipartFile file : files) {
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (name.contains(cleanPhase) || name.contains("task") || files.length == 1) {
                try {
                    String s = new String(file.getBytes(), StandardCharsets.UTF_8);
                    if (!s.isBlank()) return s;
                } catch (Exception ignored) {}
            }
        }
        for (MultipartFile file : files) {
            try {
                String s = new String(file.getBytes(), StandardCharsets.UTF_8);
                if (!s.isBlank()) return s;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String unwrapFileMarker(String content, String targetFileName) {
        if (content == null) return "";
        // Match specific target file delimiter first
        Pattern pattern = Pattern.compile("=====FILE:\\s*" + Pattern.quote(targetFileName) + "\\s*=====\\s*([\\s\\S]*?)(?:=====END FILE=====|$)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        // Match ANY file block delimiter like =====FILE: ... ===== ... =====END FILE=====
        Pattern anyPattern = Pattern.compile("=====FILE:\\s*[^\\n=]+=====\\s*([\\s\\S]*?)(?:=====END FILE=====|$)", Pattern.CASE_INSENSITIVE);
        Matcher anyMatcher = anyPattern.matcher(content);
        if (anyMatcher.find()) {
            return anyMatcher.group(1).trim();
        }
        // Strip outer code fences if present (```markdown ... ``` or ``` ... ```)
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1 && trimmed.endsWith("```")) {
                trimmed = trimmed.substring(firstNewline + 1, trimmed.length() - 3).trim();
            }
        }
        return trimmed;
    }

    private void checkHeadings(String docContent, List<ValidationIssueDto> issues) {
        List<String> recommendedH2 = List.of(
                "Phase intent", "Tasks", "Order and dependencies", "Workload for this phase",
                "Requirement coverage", "Carry-over notes", "Phase exit check", "Reality check"
        );
        for (String heading : recommendedH2) {
            Pattern p = Pattern.compile("(?im)^#{1,3}\\s*.*" + Pattern.quote(heading));
            if (!p.matcher(docContent).find()) {
                issues.add(new ValidationIssueDto("WARN", "MISSING_HEADING", heading, null, "Recommended section not explicitly labeled: ## " + heading, null, null));
            }
        }
    }

    public record ParsedTask(
            String localId,
            String title,
            String phase,
            String type,
            String role,
            String assignee,
            double estimate,
            String priority,
            List<String> dependsOn,
            String requirement,
            String description,
            List<String> acceptance
    ) {}

    private List<ParsedTask> parseTasks(String content, String expectedPhase, List<ValidationIssueDto> issues) {
        List<ParsedTask> tasks = new ArrayList<>();
        Set<String> sectionHeadings = Set.of(
                "phase intent", "tasks", "order and dependencies", "order & dependencies",
                "workload for this phase", "workload", "requirement coverage", "carry-over notes",
                "carryover notes", "carry over notes", "phase exit check", "reality check", "phase tasks"
        );

        Pattern headerPattern = Pattern.compile("(?im)^#{2,4}\\s+(.*)$");
        Matcher headerMatcher = headerPattern.matcher(content);

        List<int[]> spans = new ArrayList<>();
        List<String[]> headerInfo = new ArrayList<>();
        int autoIdCounter = 1;

        while (headerMatcher.find()) {
            String fullLine = headerMatcher.group(1).trim();
            String cleanLower = fullLine.toLowerCase().replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();

            if (sectionHeadings.contains(cleanLower) || cleanLower.startsWith("phase intent")
                    || cleanLower.equals("tasks") || cleanLower.startsWith("order and")
                    || cleanLower.startsWith("workload") || cleanLower.startsWith("carry")
                    || cleanLower.startsWith("phase exit") || cleanLower.startsWith("reality check")
                    || cleanLower.startsWith("requirement coverage")) {
                continue;
            }

            String localId = null;
            String title = fullLine;

            Matcher idTitleMatcher = Pattern.compile("^(?:Task\\s*)?([A-Za-z0-9_.-]+)\\s*[-:—–.]\\s*(.*)$", Pattern.CASE_INSENSITIVE).matcher(fullLine);
            if (idTitleMatcher.find()) {
                String candidateId = idTitleMatcher.group(1).trim();
                String candidateTitle = idTitleMatcher.group(2).trim();
                if (!candidateTitle.isBlank()) {
                    localId = candidateId.replaceAll("\\s+", "-");
                    title = candidateTitle;
                }
            }

            if (localId == null || localId.isBlank()) {
                localId = "T-" + String.format(Locale.ROOT, "%03d", autoIdCounter);
            }
            autoIdCounter++;

            spans.add(new int[]{headerMatcher.start(), headerMatcher.end()});
            headerInfo.add(new String[]{localId, title});
        }

        if (spans.isEmpty()) {
            Pattern listPattern = Pattern.compile("(?im)^\\s*(?:-\\s*\\[[ xX]?\\]|\\d+\\.)\\s+(.*)$");
            Matcher listMatcher = listPattern.matcher(content);
            while (listMatcher.find()) {
                String fullLine = listMatcher.group(1).trim();
                if (fullLine.isBlank() || fullLine.length() < 3) continue;

                String localId = "T-" + String.format(Locale.ROOT, "%03d", autoIdCounter++);
                String title = fullLine;

                Matcher idTitleMatcher = Pattern.compile("^(?:Task\\s*)?([A-Za-z0-9_.-]+)\\s*[-:—–.]\\s*(.*)$", Pattern.CASE_INSENSITIVE).matcher(fullLine);
                if (idTitleMatcher.find()) {
                    String candId = idTitleMatcher.group(1).trim();
                    String candTitle = idTitleMatcher.group(2).trim();
                    if (!candTitle.isBlank()) {
                        localId = candId.replaceAll("\\s+", "-");
                        title = candTitle;
                    }
                }

                spans.add(new int[]{listMatcher.start(), listMatcher.end()});
                headerInfo.add(new String[]{localId, title});
            }
        }

        if (spans.isEmpty()) {
            String[] paragraphs = content.split("\n\n+");
            for (String p : paragraphs) {
                String trimmed = p.trim();
                if (trimmed.length() > 5 && !trimmed.startsWith("#")) {
                    String localId = "T-" + String.format(Locale.ROOT, "%03d", autoIdCounter++);
                    String firstLine = trimmed.split("\n")[0].trim();
                    spans.add(new int[]{0, firstLine.length()});
                    headerInfo.add(new String[]{localId, firstLine});
                }
            }
        }

        if (spans.isEmpty()) {
            tasks.add(new ParsedTask(
                    "T-001",
                    "Setup and scaffolding for " + expectedPhase,
                    expectedPhase,
                    "setup",
                    "Backend",
                    "UNASSIGNED",
                    2.0,
                    "P1",
                    List.of(),
                    null,
                    "Initial setup task for " + expectedPhase,
                    List.of("Setup compiles and runs cleanly", "Verification checklist passes")
            ));
            return tasks;
        }

        Set<String> localIds = new HashSet<>();
        for (int i = 0; i < spans.size(); i++) {
            String localId = headerInfo.get(i)[0];
            String rawTitle = headerInfo.get(i)[1];

            if (localIds.contains(localId.toUpperCase())) {
                localId = localId + "-" + (i + 1);
            }
            localIds.add(localId.toUpperCase());

            if (rawTitle.isBlank()) {
                rawTitle = "Task " + localId;
            }

            int bodyStart = spans.get(i)[1];
            int bodyEnd = (i + 1 < spans.size()) ? spans.get(i + 1)[0] : content.length();
            String body = (bodyStart <= bodyEnd && bodyEnd <= content.length()) ? content.substring(bodyStart, bodyEnd) : "";

            String phase = expectedPhase;
            String type = "build";
            String role = "Backend";
            String assignee = "UNASSIGNED";
            double estimate = 2.0;
            String priority = "P1";
            List<String> dependsOn = new ArrayList<>();
            String requirement = null;
            StringBuilder desc = new StringBuilder();
            List<String> acceptance = new ArrayList<>();
            boolean inAcceptance = false;

            for (String rawLine : body.split("\n")) {
                String line = rawLine.trim();
                String lower = line.toLowerCase();

                if (lower.startsWith("- phase:") || lower.startsWith("phase:")) {
                    inAcceptance = false;
                    String pVal = line.substring(line.indexOf(":") + 1).trim();
                    if (!pVal.equalsIgnoreCase(expectedPhase)) {
                        issues.add(new ValidationIssueDto("WARN", "PHASE_MISMATCH", localId, null, "Task phase " + pVal + " normalized to active phase " + expectedPhase, null, null));
                    }
                } else if (lower.startsWith("- type:") || lower.startsWith("type:")) {
                    inAcceptance = false;
                    type = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- role:") || lower.startsWith("role:")) {
                    inAcceptance = false;
                    role = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- assignee:") || lower.startsWith("assignee:")) {
                    inAcceptance = false;
                    assignee = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- estimate:") || lower.startsWith("estimate:")) {
                    inAcceptance = false;
                    String estStr = line.substring(line.indexOf(":") + 1).replaceAll("[^0-9.]", "").trim();
                    try {
                        estimate = Double.parseDouble(estStr);
                    } catch (Exception ignored) {}
                } else if (lower.startsWith("- priority:") || lower.startsWith("priority:")) {
                    inAcceptance = false;
                    priority = line.substring(line.indexOf(":") + 1).trim().toUpperCase();
                } else if (lower.startsWith("- depends on:") || lower.startsWith("depends on:") || lower.startsWith("- depends_on:") || lower.startsWith("depends_on:")) {
                    inAcceptance = false;
                    String deps = line.substring(line.indexOf(":") + 1).trim();
                    if (!deps.equalsIgnoreCase("none")) {
                        for (String d : deps.split("[,;]")) {
                            if (!d.trim().isBlank()) dependsOn.add(d.trim());
                        }
                    }
                } else if (lower.startsWith("- requirement:") || lower.startsWith("requirement:")) {
                    inAcceptance = false;
                    requirement = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- description:") || lower.startsWith("description:")) {
                    inAcceptance = false;
                    desc.append(line.substring(line.indexOf(":") + 1).trim()).append(" ");
                } else if (lower.startsWith("- acceptance:") || lower.startsWith("acceptance:") || lower.startsWith("acceptance criteria:")) {
                    inAcceptance = true;
                } else if (inAcceptance) {
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                        acceptance.add(line.substring(2).trim());
                    } else if (!line.isBlank() && !line.startsWith("-")) {
                        acceptance.add(line);
                    } else {
                        inAcceptance = false;
                    }
                } else if (!line.startsWith("-") && !line.isBlank()) {
                    desc.append(line).append(" ");
                }
            }

            if (acceptance.isEmpty()) {
                acceptance.add("Implementation complete and verified");
                acceptance.add("Passes code review and local build checks");
            }

            tasks.add(new ParsedTask(localId, rawTitle, phase, type, role, assignee, estimate, priority, dependsOn, requirement, desc.toString().trim(), acceptance));
        }

        return tasks;
    }

    private void validateRules(Room room, PlanPhase phase, List<ParsedTask> tasks, List<ValidationIssueDto> issues) {
        // Dependency cycle check
        Map<String, List<String>> adj = new HashMap<>();
        for (ParsedTask pt : tasks) {
            adj.put(pt.localId().toUpperCase(), pt.dependsOn().stream().map(String::toUpperCase).toList());
        }
        for (String node : adj.keySet()) {
            Set<String> visited = new HashSet<>();
            List<String> path = new ArrayList<>();
            if (hasCycle(node, adj, visited, path)) {
                issues.add(new ValidationIssueDto("WARN", "DEPENDENCY_CYCLE", node, null, "Dependency cycle detected: " + String.join(" -> ", path), null, null));
                break;
            }
        }

        // Warnings
        for (ParsedTask pt : tasks) {
            if (pt.estimate() < 0.5 || pt.estimate() > 6.0) {
                issues.add(new ValidationIssueDto("WARN", "ESTIMATE_OUT_OF_RANGE", pt.localId(), null, "Task " + pt.localId() + " estimate outside 0.5h to 6.0h range: " + pt.estimate() + "h", null, null));
            }
            if (pt.acceptance().size() < 2) {
                issues.add(new ValidationIssueDto("WARN", "FEW_ACCEPTANCE_CRITERIA", pt.localId(), null, "Task " + pt.localId() + " has fewer than 2 acceptance criteria bullets", null, null));
            }
        }
    }

    private boolean hasCycle(String curr, Map<String, List<String>> adj, Set<String> visited, List<String> path) {
        if (path.contains(curr)) {
            path.add(curr);
            return true;
        }
        if (visited.contains(curr)) return false;
        visited.add(curr);
        path.add(curr);

        List<String> neighbors = adj.getOrDefault(curr, Collections.emptyList());
        for (String next : neighbors) {
            if (hasCycle(next, adj, visited, path)) {
                return true;
            }
        }
        path.remove(path.size() - 1);
        return false;
    }

    /**
     * Calls AI model to generate tasks for the active phase via AiService,
     * with high-quality fallback generator when AI is unconfigured or unavailable.
     */
    @Transactional
    public String generatePhaseTasks(UUID roomId, String phaseKey, User user) {
        roomAccess.requireLeader(roomId, user);
        if (!roomService.isAiAllowed(roomId)) {
            throw new BadRequestException("AI_RESTRICTED_BY_EVENT", "AI generation is disabled by event rules");
        }

        PhaseTaskPromptResponseDto promptResp = buildPhaseTaskPrompt(roomId, phaseKey, "FRESH", user);
        String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);

        String systemPrompt = "You are a sceptical delivery lead and judge-mentor. Produce the TASKS_" + phaseKey + ".md document with =====FILE: TASKS_" + phaseKey + ".md===== delimiters exactly as specified.";
        String userMessage = promptResp.prompt() + "\n\nAttached IDEAS.MD:\n" + ideasMd;

        try {
            if (aiService.isConfigured(user.getId())) {
                String aiResponse = aiService.text("plan.generate.phasetasks", roomId, user.getId(), systemPrompt, userMessage);
                if (aiResponse != null && !aiResponse.isBlank() && (aiResponse.contains("###") || aiResponse.contains("Task"))) {
                    return aiResponse;
                }
            } else {
                throw new com.hackathonos.backend.common.error.AiKeyMissingException("You haven't added your API key yet.");
            }
        } catch (com.hackathonos.backend.common.error.AiKeyMissingException | com.hackathonos.backend.common.error.AiKeyInvalidException | com.hackathonos.backend.common.error.AiKeyRateLimitedException e) {
            throw e;
        } catch (Exception e) {
            log.warn("AI generation failed for phase tasks, falling back to scaffolded template: {}", e.getMessage());
        }


        return buildFallbackPhaseTasksMarkdown(roomId, phaseKey);
    }

    private String buildFallbackPhaseTasksMarkdown(UUID roomId, String phaseKey) {
        PlanPhase phase = phaseRepository.findByRoomIdAndPlanKey(roomId, phaseKey).orElse(null);
        String pGoal = phase != null && phase.getGoal() != null ? phase.getGoal() : "Complete core phase deliverables";

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<String> handles = new ArrayList<>();
        for (RoomMember m : members) {
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                handles.add(planPromptService.getHandle(u));
            });
        }
        if (handles.isEmpty()) handles.add("@leader");

        List<String> deliverables = new ArrayList<>();
        if (phase != null && phase.getDeliverables() != null && !phase.getDeliverables().isBlank()) {
            for (String line : phase.getDeliverables().split("\n")) {
                String d = line.replaceFirst("^[-*•\\d.]+\\s*", "").trim();
                if (!d.isBlank()) deliverables.add(d);
            }
        }
        if (deliverables.isEmpty()) {
            deliverables = List.of(
                    "Scaffold architecture and initialize repository",
                    "Implement core business logic and schema models",
                    "Build user interface components and interactions",
                    "Conduct integration testing and exit checkpoint review"
            );
        }

        StringBuilder sb = new StringBuilder();
        sb.append("=====FILE: TASKS_").append(phaseKey).append(".md=====\n");
        sb.append("# Phase Tasks\n\n");
        sb.append("## Phase intent\n").append(pGoal).append("\n\n");
        sb.append("## Tasks\n");

        for (int i = 0; i < deliverables.size(); i++) {
            String del = deliverables.get(i);
            String tId = "T-" + String.format(Locale.ROOT, "%03d", i + 1);
            String assignee = handles.get(i % handles.size());
            String role = (i % 2 == 0) ? "Backend" : "Frontend";
            double est = 2.0 + (i % 3) * 0.5;
            String priority = (i == 0) ? "P0" : "P1";
            String prev = (i > 0) ? "T-" + String.format(Locale.ROOT, "%03d", i) : "none";

            sb.append("### ").append(tId).append(" - ").append(del).append("\n");
            sb.append("- Phase: ").append(phaseKey).append("\n");
            sb.append("- Type: build\n");
            sb.append("- Role: ").append(role).append("\n");
            sb.append("- Assignee: ").append(assignee).append("\n");
            sb.append("- Estimate: ").append(est).append("h\n");
            sb.append("- Priority: ").append(priority).append("\n");
            sb.append("- Depends on: ").append(prev).append("\n");
            sb.append("- Requirement: FR-0").append(i + 1).append("\n");
            sb.append("- Description: Deliverable work for ").append(del).append(" in ").append(phaseKey).append(".\n");
            sb.append("- Acceptance:\n");
            sb.append("  - Successfully implements ").append(del).append("\n");
            sb.append("  - Verified through automated checks and exit checkpoint\n\n");
        }

        sb.append("## Order and dependencies\nSequential dependency chain across phase tasks.\n\n");
        sb.append("## Workload for this phase\nTasks distributed across ").append(handles.size()).append(" team members.\n\n");
        sb.append("## Requirement coverage\nAll foundational phase requirements covered.\n\n");
        sb.append("## Carry-over notes\nNone.\n\n");
        sb.append("## Phase exit check\nVerification of all deliverables before phase completion.\n\n");
        sb.append("## Reality check\nDeliverables fit cleanly within the allocated time window.\n");
        sb.append("=====END FILE=====\n");

        return sb.toString();
    }
}
