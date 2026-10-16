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
import com.hackathonos.backend.ideas.Idea;
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

    public static final List<String> STEP_KEYS = List.of("prd-mvp", "stack-arch", "phases-design", "demo-qna");
    public static final List<String> STEP_TITLES = List.of(
            "PRD and MVP",
            "Tech stack and architecture",
            "Phases and design",
            "Demo and Q&A"
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
    private final com.hackathonos.backend.events.RoomEventService roomEventService;
    private final PlanPromptService planPromptService;
    private final PlanDocumentParser planDocumentParser;
    private final PlanDownstreamSyncService planDownstreamSyncService;
    private final com.hackathonos.backend.rooms.RoomService roomService;
    private final PlanValidationService planValidationService;

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
            com.hackathonos.backend.checkpoints.CheckpointService checkpointService,
            com.hackathonos.backend.events.RoomEventService roomEventService,
            PlanPromptService planPromptService,
            PlanDocumentParser planDocumentParser,
            PlanDownstreamSyncService planDownstreamSyncService,
            com.hackathonos.backend.rooms.RoomService roomService,
            PlanValidationService planValidationService) {
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
        this.roomEventService = roomEventService;
        this.planPromptService = planPromptService;
        this.planDocumentParser = planDocumentParser;
        this.planDownstreamSyncService = planDownstreamSyncService;
        this.roomService = roomService;
        this.planValidationService = planValidationService;
    }

    /**
     * Retrieves full plan state, steps, prompts, readiness indicators, and completion metrics.
     */
    @Transactional
    public PlanDto startPlan(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (!room.isIdeateDone()) {
            throw new BadRequestException("IDEATION_NOT_DONE", "Ideation must be complete before planning can begin");
        }
        room.setPlanStartedAt(Instant.now());
        roomRepository.save(room);
        return getPlan(roomId, user);
    }

    @Transactional
    public void updatePlanNotes(UUID roomId, String notes, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (notes != null && notes.length() > 4000) {
            throw new BadRequestException("NOTES_TOO_LONG", "Plan notes cannot exceed 4000 characters");
        }
        room.setPlanNotes(notes);
        roomRepository.save(room);
    }

    /**
     * Retrieves the 5 planning steps, prompt text, context pack readiness, and completion summary.
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

        List<Idea> approvedIdeas = ideaRepository.findByRoomIdAndStatus(roomId, "APPROVED");
        Set<UUID> ideaAuthorIds = approvedIdeas.stream().map(Idea::getAuthorId).collect(Collectors.toSet());
        Map<UUID, String> authorNamesMap = userRepository.findAllById(ideaAuthorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u.getName() != null && !u.getName().isBlank() ? u.getName() : "Team Member"));

        Map<UUID, List<String>> memberSkillsMap = new HashMap<>();
        Set<String> allSkills = new LinkedHashSet<>();
        int membersWithSkills = 0;
        for (RoomMember m : members) {
            List<String> skills = skillRepository.findByMemberId(m.getId()).stream().map(RoomMemberSkill::getSkill).toList();
            memberSkillsMap.put(m.getId(), skills);
            allSkills.addAll(skills);
            if (!skills.isEmpty()) membersWithSkills++;
        }

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
            if (step == null) {
                String alias = switch (key) {
                    case "prd-mvp" -> "prd";
                    case "stack-arch" -> "tech";
                    case "phases-design" -> "phases";
                    case "demo-qna" -> "demo";
                    default -> null;
                };
                if (alias != null) step = stepMap.get(alias);
            }

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

            PlanPromptResponseDto promptResp = null;
            try {
                if (planPromptService.hasCachedOrPersistedPrompt(roomId, i + 1)) {
                    promptResp = planPromptService.getOrAssemblePrompt(roomId, i + 1, false, user);
                }
            } catch (Exception ignored) {}

            String promptText = promptResp != null ? promptResp.prompt() : promptBuilder.buildPromptForStep(
                    key, room, brief, rubric, members, memberUsers,
                    memberSkillsMap, approvedIdeas, authorNamesMap, validatedAnswers
            );
            String mode = promptResp != null ? promptResp.mode() : "BALANCED";
            String ideaVerdict = promptResp != null ? promptResp.ideaVerdict() : null;
            boolean stale = promptResp != null && promptResp.stale();
            String expectedFormat = getExpectedFormat(key);
            int charCount = answer != null ? answer.length() : (promptText != null ? promptText.length() : 0);

            List<ContextFileDto> contextFiles = List.of(
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
                    contextFiles,
                    mode,
                    ideaVerdict,
                    stale,
                    step != null && step.isValidatedWithOverrides()
            ));
        }

        // Context Pack readiness
        long approvedCount = approvedIdeas.size();
        boolean problemOk = brief != null && brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank();
        boolean weightsOk = !rubric.isEmpty() && rubric.stream().anyMatch(r -> r.getWeight() > 0);
        boolean deadlinesOk = (room.getEventStart() != null && room.getEventEnd() != null)
                || (brief != null && brief.getRawText() != null && (brief.getRawText().toLowerCase().contains("deadline") || brief.getRawText().toLowerCase().contains("schedule") || brief.getRawText().toLowerCase().contains("freeze")));
        boolean rubricBriefOk = problemOk && weightsOk && deadlinesOk;

        boolean everyMemberHasRoleTags = !members.isEmpty() && members.stream().allMatch(m -> {
            User u = memberUsers.get(m.getUserId());
            List<String> r = parseStringList(u != null ? u.getRoleTags() : null);
            return !r.isEmpty();
        });
        boolean hasNotes = room.getPlanNotes() != null && !room.getPlanNotes().isBlank();

        ContextPackDto contextPack = new ContextPackDto(
                new ContextPackDto.IdeaContextDto(approvedCount >= 1, approvedCount),
                new ContextPackDto.RubricContextDto(rubricBriefOk),
                new ContextPackDto.SkillsContextDto(everyMemberHasRoleTags, membersWithSkills, members.size()),
                new ContextPackDto.NotesContextDto(hasNotes, hasNotes),
                new ContextPackDto.FilesContextDto(true, 2)
        );

        // Completion summary
        PlanCompletionSummaryDto completion = null;
        if (room.isPlanDone()) {
            int docCount = docRepository.findByRoomId(roomId).size();
            int phaseCount = phaseRepository.findByRoomIdOrderByPositionAsc(roomId).size();
            List<Task> tasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
            if (tasks.isEmpty()) tasks = taskRepository.findByRoomId(roomId);
            int assigned = (int) tasks.stream().filter(t -> t.getAssigneeId() != null).count();
            int unassigned = tasks.size() - assigned;
            completion = new PlanCompletionSummaryDto(docCount, phaseCount, tasks.size(), assigned, unassigned, room.getUpdatedAt().toString());
        }

        boolean planLocked = room.getBuildStartedAt() != null;
        boolean canEnterBuild = room.isPlanDone() && !planLocked;

        PlanPermissionsDto permissions = new PlanPermissionsDto(!planLocked, isLeader && canEnterBuild);

        String statementPreview = (brief != null && brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank())
                ? brief.getProblemStatement()
                : (brief != null && brief.getRawText() != null ? brief.getRawText().substring(0, Math.min(500, brief.getRawText().length())) : "No brief statement confirmed yet");
        boolean briefConfirmed = brief != null && brief.isConfirmed();
        int eventHours = 36;
        if (room.getEventStart() != null && room.getEventEnd() != null) {
            eventHours = (int) Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
        }

        List<ApprovedIdeaSummaryDto> approvedIdeaDtos = approvedIdeas.stream()
                .map(i -> new ApprovedIdeaSummaryDto(i.getId(), i.getText(), authorNamesMap.getOrDefault(i.getAuthorId(), "Team Member"), i.isPrimary()))
                .toList();

        PlanContextSummaryDto contextSummary = new PlanContextSummaryDto(
                statementPreview,
                statementPreview,
                briefConfirmed,
                eventHours,
                approvedIdeaDtos,
                new ArrayList<>(allSkills),
                new ArrayList<>(allSkills)
        );

        return new PlanDto(
                stepDtos,
                contextPack,
                completion,
                planLocked,
                canEnterBuild,
                permissions,
                room.getPlanStartedAt() != null,
                room.getPlanNotes(),
                contextSummary
        );
    }

    /**
     * Saves step draft without validating, checking cascade reset confirmation if text modified.
     */
    @Transactional
    public void saveStepDraft(UUID roomId, String stepKey, SaveStepRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getPlanStartedAt() == null) {
            throw new ConflictException("PLAN_NOT_STARTED", "Planning has not started yet. Complete the 'Before we plan' setup first.");
        }
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan cannot be modified once build phase has started");
        }

        PlanStep step = stepRepository.findByRoomIdAndStepKey(roomId, stepKey)
                .orElseGet(() -> new PlanStep(roomId, stepKey));

        String newAnswer = req.answer() != null ? req.answer() : "";
        boolean textChanged = !Objects.equals(step.getAnswer(), newAnswer);

        if (step.isValidated() && textChanged) {
            int currentIdx = STEP_KEYS.indexOf(PlanPromptService.normalizeStepKey(stepKey));
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
        return planValidationService.validateStepText(roomId, req.stepKey(), req.answer(), Boolean.TRUE.equals(req.confirmWarnings()), user);
    }

    /**
     * Generates a draft answer using caller's API key, attaching ideas.md and preceding answers.
     */
    @Transactional
    public GenerateStepResponse generateStep(UUID roomId, String stepKey, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getPlanStartedAt() == null) {
            throw new ConflictException("PLAN_NOT_STARTED", "Planning has not started yet. Complete the 'Before we plan' setup first.");
        }
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan is locked");
        }
        if (!roomService.isAiAllowed(roomId)) {
            throw new BadRequestException("AI_RESTRICTED_BY_EVENT", "AI generation is disabled by event rules");
        }

        int stepIdx = STEP_KEYS.indexOf(PlanPromptService.normalizeStepKey(stepKey));
        if (stepIdx < 0) {
            throw new BadRequestException("INVALID_STEP", "Unknown step key: " + stepKey);
        }

        PlanPromptResponseDto promptResp = planPromptService.getOrAssemblePrompt(roomId, stepIdx + 1, false, user);
        String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);

        String systemPrompt = "You are a senior technical architect and hackathon strategist. Produce the complete, real markdown documents requested with =====FILE: NAME.md===== and =====END FILE===== delimiters exactly as specified. Do not summarize or skip sections.";
        String userMessage = promptResp.prompt() + "\n\nAttached CONTEXT.MD:\n" + ideasMd;

        String feature = "plan.generate." + PlanPromptService.normalizeStepKey(stepKey);
        String answer = aiService.text(feature, roomId, user.getId(), systemPrompt, userMessage);
        return new GenerateStepResponse(answer);
    }

    /**
     * Builds and downloads context.md containing ideas.md followed by previous validated step answers.
     */
    @Transactional(readOnly = true)
    public String getContextMarkdown(UUID roomId, String stepKey, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getPlanStartedAt() == null) {
            throw new ConflictException("PLAN_NOT_STARTED", "Planning has not started yet. Complete the 'Before we plan' setup first.");
        }
        String ideasMd = ideasService.exportIdeasMarkdown(roomId, user);
        String normKey = PlanPromptService.normalizeStepKey(stepKey);
        if ("prd-mvp".equalsIgnoreCase(normKey)) {
            return ideasMd;
        }

        StringBuilder sb = new StringBuilder(ideasMd);
        int targetIdx = STEP_KEYS.indexOf(normKey);
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

            // Auto-activate first phase
            List<PlanPhase> roomPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
            if (!roomPhases.isEmpty()) {
                PlanPhase p1 = roomPhases.get(0);
                if (!"ACTIVE".equals(p1.getStatus()) && !"COMPLETED".equals(p1.getStatus())) {
                    p1.setStatus("ACTIVE");
                    p1.setActivatedAt(Instant.now());
                    phaseRepository.save(p1);
                }
            }

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

            // Auto-activate first phase
            List<PlanPhase> roomPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
            if (!roomPhases.isEmpty()) {
                PlanPhase p1 = roomPhases.get(0);
                if (!"ACTIVE".equals(p1.getStatus()) && !"COMPLETED".equals(p1.getStatus())) {
                    p1.setStatus("ACTIVE");
                    p1.setActivatedAt(Instant.now());
                    phaseRepository.save(p1);
                }
            }

            checkpointService.createForRoom(room);
            activityLogger.log(room, user, "BUILD_UNLOCKED_EARLY", "Build unlocked early");
            notificationService.notifyRoomMembers(room, null, NotificationType.ROOM_CREATED,
                    "Build unlocked early", "Build phase unlocked early by room leader.");
        }
    }

    private ValidationResult runValidator(UUID roomId, String stepKey, String answer) {
        return switch (stepKey.toLowerCase()) {
            case "prd", "prd-mvp" -> prdValidator.validate(answer);
            case "tech", "stack-arch" -> techValidator.validate(answer);
            case "phases", "phases-design" -> phasesValidator.validate(answer);
            case "demo", "demo-qna" -> demoValidator.validate(answer);
            default -> new ValidationResult(false, List.of("Unknown step key: " + stepKey), Collections.emptyList(), "Validation failed", null);
        };
    }

    private String getExpectedFormat(String stepKey) {
        return switch (stepKey.toLowerCase()) {
            case "prd", "prd-mvp" -> promptBuilder.getExpectedFormatPrd();
            case "tech", "stack-arch" -> promptBuilder.getExpectedFormatTech();
            case "phases", "phases-design" -> promptBuilder.getExpectedFormatPhases();
            case "demo", "demo-qna" -> promptBuilder.getExpectedFormatDemo();
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
