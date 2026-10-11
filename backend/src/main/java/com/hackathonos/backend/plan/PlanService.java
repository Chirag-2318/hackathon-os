package com.hackathonos.backend.plan;

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
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.plan.dto.*;
import com.hackathonos.backend.plan.validators.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing plan steps, validation pipeline, AI step generation, and stage transitions.
 */
@Service
public class PlanService {

    public static final List<String> STEP_KEYS = List.of("prd", "tech", "phases", "tasks", "demo");
    public static final List<String> STEP_TITLES = List.of(
            "PRD & MVP",
            "Tech stack and architecture",
            "Phases",
            "Tasks",
            "Demo & Q&A"
    );

    private final PlanStepRepository stepRepository;
    private final PlanPhaseRepository phaseRepository;
    private final DocRepository docRepository;
    private final TaskRepository taskRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final PromptBuilder promptBuilder;
    private final PrdValidator prdValidator;
    private final TechValidator techValidator;
    private final PhasesValidator phasesValidator;
    private final TasksValidator tasksValidator;
    private final DemoValidator demoValidator;
    private final PlanCompletionService planCompletionService;
    private final IdeasService ideasService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final com.hackathonos.backend.checkpoints.CheckpointService checkpointService;

    public PlanService(
            PlanStepRepository stepRepository,
            PlanPhaseRepository phaseRepository,
            DocRepository docRepository,
            TaskRepository taskRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            PromptBuilder promptBuilder,
            PrdValidator prdValidator,
            TechValidator techValidator,
            PhasesValidator phasesValidator,
            TasksValidator tasksValidator,
            DemoValidator demoValidator,
            PlanCompletionService planCompletionService,
            IdeasService ideasService,
            AiService aiService,
            ObjectMapper objectMapper,
            com.hackathonos.backend.checkpoints.CheckpointService checkpointService) {
        this.stepRepository = stepRepository;
        this.phaseRepository = phaseRepository;
        this.docRepository = docRepository;
        this.taskRepository = taskRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.promptBuilder = promptBuilder;
        this.prdValidator = prdValidator;
        this.techValidator = techValidator;
        this.phasesValidator = phasesValidator;
        this.tasksValidator = tasksValidator;
        this.demoValidator = demoValidator;
        this.planCompletionService = planCompletionService;
        this.ideasService = ideasService;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
        this.checkpointService = checkpointService;
    }

    /**
     * Retrieves full plan state, steps, prompts, readiness indicators, and completion metrics.
     */
    @Transactional(readOnly = true)
    public PlanDto getPlan(UUID roomId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        List<BriefRubricItem> rubric = brief != null ? rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId()) : Collections.emptyList();
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<UUID, User> memberUsers = userRepository.findAllById(members.stream().map(RoomMember::getUserId).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        List<PlanStep> existingSteps = stepRepository.findByRoomId(roomId);
        Map<String, PlanStep> stepMap = existingSteps.stream().collect(Collectors.toMap(PlanStep::getStepKey, s -> s));

        Map<String, String> validatedAnswers = new HashMap<>();
        for (PlanStep s : existingSteps) {
            if (s.isValidated() && s.getAnswer() != null) {
                validatedAnswers.put(s.getStepKey(), s.getAnswer());
            }
        }

        List<PlanStepDto> stepDtos = new ArrayList<>();
        boolean foundCurrent = false;

        for (int i = 0; i < STEP_KEYS.size(); i++) {
            String key = STEP_KEYS.get(i);
            String title = STEP_TITLES.get(i);
            PlanStep step = stepMap.get(key);

            boolean validated = step != null && step.isValidated();
            String status;
            if (validated) {
                status = "validated";
            } else if (!foundCurrent) {
                status = "current";
                foundCurrent = true;
            } else {
                status = "upcoming";
            }

            String answer = step != null ? step.getAnswer() : null;
            List<String> errors = parseStringList(step != null ? step.getErrors() : null);
            List<String> warnings = parseStringList(step != null ? step.getWarnings() : null);

            String promptText = promptBuilder.buildPromptForStep(key, room, brief, rubric, members, memberUsers, validatedAnswers);
            String expectedFormat = getExpectedFormat(key);
            int charCount = answer != null ? answer.length() : 0;

            List<ContextFileDto> contextFiles = List.of(
                    new ContextFileDto("ideas.md", "/api/v1/rooms/" + roomId + "/ideas/export.md"),
                    new ContextFileDto("context.md", "/api/v1/rooms/" + roomId + "/plan/context.md?step=" + key)
            );

            stepDtos.add(new PlanStepDto(
                    key,
                    i + 1,
                    title,
                    status,
                    answer,
                    validated,
                    errors,
                    warnings,
                    promptText,
                    expectedFormat,
                    charCount,
                    contextFiles
            ));
        }

        // Context Pack readiness
        long approvedCount = ideaRepository.countByRoomIdAndStatus(roomId, "APPROVED");
        boolean rubricOk = brief != null && brief.isConfirmed() && !rubric.isEmpty();

        int membersWithSkills = 0;
        for (RoomMember m : members) {
            List<RoomMemberSkill> skills = skillRepository.findByMemberId(m.getId());
            boolean hasSkills = !skills.isEmpty();
            if (hasSkills) membersWithSkills++;
        }

        ContextPackDto contextPack = new ContextPackDto(
                new ContextPackDto.IdeaContextDto(approvedCount >= 1, approvedCount),
                new ContextPackDto.RubricContextDto(rubricOk),
                new ContextPackDto.SkillsContextDto(membersWithSkills >= 2, membersWithSkills)
        );

        // Completion summary
        PlanCompletionSummaryDto completion = null;
        if (room.isPlanDone()) {
            int docCount = docRepository.findByRoomId(roomId).size();
            int phaseCount = phaseRepository.findByRoomIdOrderByPositionAsc(roomId).size();
            List<Task> tasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
            int assigned = (int) tasks.stream().filter(t -> t.getAssigneeId() != null).count();
            int unassigned = tasks.size() - assigned;
            completion = new PlanCompletionSummaryDto(docCount, phaseCount, tasks.size(), assigned, unassigned, room.getUpdatedAt().toString());
        }

        boolean planLocked = room.getBuildStartedAt() != null;
        boolean canEnterBuild = room.isPlanDone() && !planLocked;

        PlanPermissionsDto permissions = new PlanPermissionsDto(!planLocked, isLeader && canEnterBuild);

        return new PlanDto(stepDtos, contextPack, completion, planLocked, canEnterBuild, permissions);
    }

    /**
     * Saves step draft without validating, checking cascade reset confirmation if text modified.
     */
    @Transactional
    public void saveStepDraft(UUID roomId, String stepKey, SaveStepRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan cannot be modified once build phase has started");
        }

        PlanStep step = stepRepository.findByRoomIdAndStepKey(roomId, stepKey)
                .orElseGet(() -> new PlanStep(roomId, stepKey));

        String newAnswer = req.answer() != null ? req.answer() : "";
        boolean textChanged = !Objects.equals(step.getAnswer(), newAnswer);

        if (step.isValidated() && textChanged) {
            int currentIdx = STEP_KEYS.indexOf(stepKey);
            List<String> laterValidatedKeys = new ArrayList<>();

            for (int i = currentIdx + 1; i < STEP_KEYS.size(); i++) {
                String k = STEP_KEYS.get(i);
                stepRepository.findByRoomIdAndStepKey(roomId, k).ifPresent(ls -> {
                    if (ls.isValidated()) {
                        laterValidatedKeys.add(k);
                    }
                });
            }

            if (!laterValidatedKeys.isEmpty() && !req.confirmClear()) {
                throw new ConflictException("CONFIRM_REQUIRED",
                        "Modifying this step clears later validated steps: " + String.join(", ", laterValidatedKeys),
                        laterValidatedKeys);
            }

            // Invalidate current and clear later steps
            step.setValidated(false);
            step.setValidatedAt(null);

            for (int i = currentIdx + 1; i < STEP_KEYS.size(); i++) {
                String k = STEP_KEYS.get(i);
                stepRepository.findByRoomIdAndStepKey(roomId, k).ifPresent(ls -> {
                    ls.setAnswer(null);
                    ls.setValidated(false);
                    ls.setErrors(null);
                    ls.setWarnings(null);
                    ls.setParsed(null);
                    ls.setValidatedAt(null);
                    ls.setUpdatedAt(Instant.now());
                    stepRepository.save(ls);
                });
            }
        }

        step.setAnswer(newAnswer);
        step.setUpdatedAt(Instant.now());
        stepRepository.save(step);
    }

    /**
     * Validates step answer enforcing ordering, saving parsed results and triggering completion on step 5.
     */
    @Transactional
    public ValidatePlanResponse validateStep(UUID roomId, ValidatePlanRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan is locked");
        }

        int stepIdx = STEP_KEYS.indexOf(req.stepKey());
        if (stepIdx < 0) {
            throw new BadRequestException("INVALID_STEP", "Unknown step key: " + req.stepKey());
        }

        // Enforce step order
        if (stepIdx > 0) {
            String prevKey = STEP_KEYS.get(stepIdx - 1);
            PlanStep prevStep = stepRepository.findByRoomIdAndStepKey(roomId, prevKey).orElse(null);
            if (prevStep == null || !prevStep.isValidated()) {
                throw new ConflictException("STEP_ORDER", "Previous step (" + prevKey + ") must be validated first");
            }
        }

        ValidationResult result = runValidator(roomId, req.stepKey(), req.answer());

        PlanStep step = stepRepository.findByRoomIdAndStepKey(roomId, req.stepKey())
                .orElseGet(() -> new PlanStep(roomId, req.stepKey()));
        step.setAnswer(req.answer());
        step.setUpdatedAt(Instant.now());

        if (!result.valid()) {
            step.setValidated(false);
            step.setErrors(toJson(result.errors()));
            step.setWarnings(toJson(result.warnings()));
            stepRepository.save(step);

            String repairPrompt = "Your previous answer had these problems: " + String.join("; ", result.errors())
                    + ". Fix ONLY those problems and reply again in the exact required format. Previous answer:\n" + req.answer();
            return new ValidatePlanResponse(false, result.errors(), result.warnings(), result.summary(), repairPrompt, null, false, null);
        }

        step.setValidated(true);
        step.setErrors(null);
        step.setWarnings(toJson(result.warnings()));
        step.setParsed(toJson(result.parsed()));
        step.setValidatedAt(Instant.now());
        stepRepository.save(step);

        String nextStepKey = stepIdx < STEP_KEYS.size() - 1 ? STEP_KEYS.get(stepIdx + 1) : null;
        boolean isDemo = "demo".equalsIgnoreCase(req.stepKey());

        boolean allValidated = true;
        for (String k : STEP_KEYS) {
            if (k.equals(req.stepKey())) continue;
            PlanStep s = stepRepository.findByRoomIdAndStepKey(roomId, k).orElse(null);
            if (s == null || !s.isValidated()) {
                allValidated = false;
                break;
            }
        }

        PlanCompletionSummaryDto completion = null;
        boolean planComplete = false;
        if (isDemo && allValidated) {
            completion = planCompletionService.complete(room);
            planComplete = true;
        }

        return new ValidatePlanResponse(true, Collections.emptyList(), result.warnings(), result.summary(), null, nextStepKey, planComplete, completion);
    }

    /**
     * Generates a draft answer using caller's API key, attaching ideas.md and preceding answers.
     */
    @Transactional
    public GenerateStepResponse generateStep(UUID roomId, String stepKey, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan is locked");
        }

        String contextMarkdown = getContextMarkdown(roomId, stepKey, user);
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        List<BriefRubricItem> rubric = brief != null ? rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId()) : Collections.emptyList();
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<UUID, User> memberUsers = userRepository.findAllById(members.stream().map(RoomMember::getUserId).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        List<PlanStep> existingSteps = stepRepository.findByRoomId(roomId);
        Map<String, String> validatedAnswers = new HashMap<>();
        for (PlanStep s : existingSteps) {
            if (s.isValidated() && s.getAnswer() != null) validatedAnswers.put(s.getStepKey(), s.getAnswer());
        }

        String prompt = promptBuilder.buildPromptForStep(stepKey, room, brief, rubric, members, memberUsers, validatedAnswers);
        String fullPrompt = prompt + "\n\nContext files:\n" + contextMarkdown;

        String answer = aiService.complete(user.getId(), fullPrompt);
        return new GenerateStepResponse(answer);
    }

    /**
     * Builds and downloads context.md containing ideas.md followed by previous validated step answers.
     */
    @Transactional(readOnly = true)
    public String getContextMarkdown(UUID roomId, String stepKey, User user) {
        roomAccess.requireMember(roomId, user);
        String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);
        if ("prd".equalsIgnoreCase(stepKey)) {
            return ideasMd;
        }

        StringBuilder sb = new StringBuilder(ideasMd);
        int targetIdx = STEP_KEYS.indexOf(stepKey);
        if (targetIdx < 0) targetIdx = STEP_KEYS.size();

        for (int i = 0; i < targetIdx; i++) {
            String k = STEP_KEYS.get(i);
            PlanStep s = stepRepository.findByRoomIdAndStepKey(roomId, k).orElse(null);
            if (s != null && s.isValidated() && s.getAnswer() != null) {
                sb.append("\n\n## Step ").append(i + 1).append(": ").append(STEP_TITLES.get(i)).append("\n\n");
                sb.append(s.getAnswer());
            }
        }

        return sb.toString();
    }

    /**
     * Transitions room into build stage if plan is complete (leader only).
     */
    @Transactional
    public void enterBuild(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (!room.isPlanDone()) {
            throw new BadRequestException("PLAN_NOT_COMPLETE", "Plan must be completed before entering build phase");
        }

        if (room.getBuildStartedAt() == null) {
            room.setBuildStartedAt(Instant.now());
            room.setStage("build");
            roomRepository.save(room);
            checkpointService.createForRoom(room);
            activityLogger.log(room, user, "BUILD_STARTED", "Entered build phase");
            notificationService.notifyRoomMembers(room, null, NotificationType.ROOM_CREATED,
                    "Build phase live", "The build phase has officially started! Good luck!");
        }
    }

    /**
     * Unlocks build phase early without a completed plan (leader only).
     */
    @Transactional
    public void unlockBuild(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (room.getBuildStartedAt() == null) {
            room.setBuildStartedAt(Instant.now());
            room.setStage("build");
            roomRepository.save(room);
            checkpointService.createForRoom(room);
            activityLogger.log(room, user, "BUILD_UNLOCKED_EARLY", "Build unlocked early");
            notificationService.notifyRoomMembers(room, null, NotificationType.ROOM_CREATED,
                    "Build unlocked early", "Build phase unlocked early by room leader.");
        }
    }

    private ValidationResult runValidator(UUID roomId, String stepKey, String answer) {
        return switch (stepKey.toLowerCase()) {
            case "prd" -> prdValidator.validate(answer);
            case "tech" -> techValidator.validate(answer);
            case "phases" -> phasesValidator.validate(answer);
            case "tasks" -> {
                Room room = roomAccess.getActiveRoomOrThrow(roomId);
                List<RoomMember> members = memberRepository.findByRoomId(roomId);
                long hours = 36;
                if (room.getEventStart() != null && room.getEventEnd() != null) {
                    hours = Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
                }

                // Known phase IDs from phases step
                PlanStep phasesStep = stepRepository.findByRoomIdAndStepKey(roomId, "phases").orElse(null);
                Set<String> knownPhaseIds = new HashSet<>();
                if (phasesStep != null && phasesStep.getAnswer() != null) {
                    ValidationResult pv = phasesValidator.validate(phasesStep.getAnswer());
                    if (pv.parsed() instanceof List<?> list) {
                        for (Object o : list) {
                            if (o instanceof PhasesValidator.NormalizedPhase np) knownPhaseIds.add(np.id);
                        }
                    }
                }

                Set<String> knownRoles = new HashSet<>();
                for (RoomMember m : members) {
                    knownRoles.add(m.getRole().toLowerCase());
                    List<RoomMemberSkill> mSkills = skillRepository.findByMemberId(m.getId());
                    for (RoomMemberSkill s : mSkills) {
                        knownRoles.add(s.getSkill().toLowerCase());
                    }
                }

                yield tasksValidator.validate(answer, knownPhaseIds, knownRoles, members.size(), hours);
            }
            case "demo" -> demoValidator.validate(answer);
            default -> new ValidationResult(false, List.of("Unknown step key: " + stepKey), Collections.emptyList(), "Validation failed", null);
        };
    }

    private String getExpectedFormat(String stepKey) {
        return switch (stepKey.toLowerCase()) {
            case "prd" -> promptBuilder.getExpectedFormatPrd();
            case "tech" -> promptBuilder.getExpectedFormatTech();
            case "phases" -> promptBuilder.getExpectedFormatPhases();
            case "tasks" -> promptBuilder.getExpectedFormatTasks();
            case "demo" -> promptBuilder.getExpectedFormatDemo();
            default -> "";
        };
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
