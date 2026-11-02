package com.hackathonos.backend.mcp;

import com.hackathonos.backend.billing.BillingService;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.mcp.dto.McpBriefResponse;
import com.hackathonos.backend.mcp.dto.McpRoomDto;
import com.hackathonos.backend.mcp.dto.McpStepDto;
import com.hackathonos.backend.mcp.dto.McpSubmitRequest;
import com.hackathonos.backend.mcp.dto.McpSubmitResponse;
import com.hackathonos.backend.phases.PhaseService;
import com.hackathonos.backend.plan.PlanPromptService;
import com.hackathonos.backend.plan.PlanService;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.plan.PlanValidationService;
import com.hackathonos.backend.plan.dto.ValidatePlanResponse;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.rooms.dto.RoomListItemDto;
import com.hackathonos.backend.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class McpService {

    private static final Logger log = LoggerFactory.getLogger(McpService.class);

    private final BillingService billingService;
    private final AppProperties appProperties;
    private final RoomAccessService roomAccessService;
    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final PlanService planService;
    private final PlanPromptService planPromptService;
    private final PlanValidationService planValidationService;
    private final PhaseService phaseService;
    private final IdeasService ideasService;
    private final PlanStepRepository planStepRepository;

    public McpService(
            BillingService billingService,
            AppProperties appProperties,
            RoomAccessService roomAccessService,
            RoomService roomService,
            RoomRepository roomRepository,
            PlanService planService,
            PlanPromptService planPromptService,
            PlanValidationService planValidationService,
            PhaseService phaseService,
            IdeasService ideasService,
            PlanStepRepository planStepRepository
    ) {
        this.billingService = billingService;
        this.appProperties = appProperties;
        this.roomAccessService = roomAccessService;
        this.roomService = roomService;
        this.roomRepository = roomRepository;
        this.planService = planService;
        this.planPromptService = planPromptService;
        this.planValidationService = planValidationService;
        this.phaseService = phaseService;
        this.ideasService = ideasService;
        this.planStepRepository = planStepRepository;
    }

    /**
     * Checks if user plan is within allowed plans (app.mcp.allowed-plans, default PRO,MAX).
     */
    public boolean isPlanAllowed(User user) {
        String userPlan = billingService.getUserPlan(user);
        String allowedConfig = appProperties.getMcp().getAllowedPlans();
        Set<String> allowedSet = Arrays.stream(allowedConfig.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
        return allowedSet.contains(userPlan.toUpperCase());
    }

    public void requireAllowedPlan(User user) {
        if (!isPlanAllowed(user)) {
            String userPlan = billingService.getUserPlan(user);
            throw new ForbiddenException("MCP_REQUIRES_PRO",
                    "MCP access requires a Pro or Max plan. Your current plan is " + userPlan);
        }
    }

    @Transactional(readOnly = true)
    public com.hackathonos.backend.mcp.dto.McpMeResponse getMe(User user) {
        String plan = billingService.getUserPlan(user);
        boolean allowed = isPlanAllowed(user);
        return new com.hackathonos.backend.mcp.dto.McpMeResponse(user.getId(), user.getName(), plan, allowed);
    }

    /**
     * Lists rooms where the current user is an active member.
     */
    @Transactional(readOnly = true)
    public List<McpRoomDto> listRooms(User user) {
        requireAllowedPlan(user);
        List<RoomListItemDto> rooms = roomService.listRooms(user);
        return rooms.stream()
                .map(r -> new McpRoomDto(r.id(), r.name(), r.stage(), r.myRole()))
                .toList();
    }

    private record StepDef(int number, String key, String title, List<String> expectedFiles, List<String> matchKeys) {}

    private static final List<StepDef> STEP_DEFINITIONS = List.of(
            new StepDef(1, "prd", "PRD and MVP", List.of("PRD.md", "MVP.md"), List.of("prd", "prd-mvp")),
            new StepDef(2, "tech", "Tech stack and architecture", List.of("TECH_STACK.md", "ARCHITECTURE.md"), List.of("tech", "stack-arch")),
            new StepDef(3, "phases", "Phases and design", List.of("PHASES.md", "DESIGN.md"), List.of("phases", "phases-design")),
            new StepDef(4, "tasks", "Tasks", List.of("TASKS.md"), List.of("tasks")),
            new StepDef(5, "demo", "Demo and Q&A", List.of("DEMO_SCRIPT.md", "QNA.md"), List.of("demo", "demo-qna"))
    );

    /**
     * Retrieves the 5 plan steps with their current status for a room.
     */
    @Transactional(readOnly = true)
    public List<McpStepDto> getSteps(UUID roomId, User user) {
        requireAllowedPlan(user);
        roomAccessService.requireMember(roomId, user);

        List<PlanStep> existingSteps = planStepRepository.findByRoomId(roomId);
        Map<String, PlanStep> stepMap = existingSteps.stream()
                .collect(Collectors.toMap(s -> s.getStepKey().toLowerCase(), s -> s, (s1, s2) -> s1));

        List<McpStepDto> result = new ArrayList<>();
        boolean foundCurrent = false;

        for (StepDef def : STEP_DEFINITIONS) {
            PlanStep foundStep = null;
            for (String mk : def.matchKeys()) {
                if (stepMap.containsKey(mk)) {
                    foundStep = stepMap.get(mk);
                    break;
                }
            }

            boolean validated = foundStep != null && foundStep.isValidated();
            String status;
            if (validated) {
                status = "validated";
            } else if (!foundCurrent) {
                status = "current";
                foundCurrent = true;
            } else {
                status = "upcoming";
            }

            // Expected files from PlanValidationService.STEP_EXPECTED_FILES
            List<String> expected = PlanValidationService.STEP_EXPECTED_FILES.getOrDefault(def.key(), def.expectedFiles());

            result.add(new McpStepDto(def.number(), def.key(), def.title(), expected, status));
        }

        return result;
    }

    /**
     * Retrieves prompt, context, expectedFiles, and webUrl for a given step.
     */
    @Transactional
    public McpBriefResponse getStepBrief(UUID roomId, String stepParam, User user) {
        requireAllowedPlan(user);
        roomAccessService.requireMember(roomId, user);
        Room room = roomAccessService.getActiveRoomOrThrow(roomId);

        String normalizedStep = normalizeStepKey(stepParam);
        StepDef stepDef = STEP_DEFINITIONS.stream()
                .filter(d -> d.key().equalsIgnoreCase(normalizedStep))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("INVALID_STEP", "Unknown step: " + stepParam + ". Allowed: prd, tech, phases, tasks, demo"));

        // Ensure plan is started so context retrieval functions properly
        if (room.getPlanStartedAt() == null) {
            room.setPlanStartedAt(Instant.now());
            roomRepository.save(room);
        }

        // Build prompt (including output delivery block)
        String prompt = planPromptService.buildStepPrompt(roomId, normalizedStep, user);

        // Build context
        String context = resolveStepContext(roomId, normalizedStep, user);

        // Web URL
        String webUrl = appProperties.getPublicUrl() + "/app/room/" + roomId + "/plan?step=" + normalizedStep;

        List<String> expectedFiles = PlanValidationService.STEP_EXPECTED_FILES.getOrDefault(stepDef.key(), stepDef.expectedFiles());

        return new McpBriefResponse(
                stepDef.key(),
                expectedFiles,
                prompt,
                context,
                webUrl
        );
    }

    private String resolveStepContext(UUID roomId, String stepKey, User user) {
        try {
            if ("tasks".equalsIgnoreCase(stepKey)) {
                byte[] pack = phaseService.buildProjectContextPack(roomId, user);
                String packStr = new String(pack, StandardCharsets.UTF_8);
                if (!packStr.isBlank()) {
                    return packStr;
                }
            }

            String context = planService.getContextMarkdown(roomId, stepKey, user);
            if (context != null && !context.isBlank()) {
                return context;
            }
        } catch (Exception e) {
            log.debug("Fallback to ideas context for step {}: {}", stepKey, e.getMessage());
        }

        return ideasService.exportIdeasMarkdown(roomId, user);
    }

    /**
     * Submits a step document answer and validates it through the existing service path.
     */
    @Transactional
    public McpSubmitResponse submitStep(UUID roomId, String stepParam, McpSubmitRequest request, User user) {
        requireAllowedPlan(user);
        roomAccessService.requireMember(roomId, user);

        if (request == null || request.text() == null || request.text().isBlank()) {
            throw new BadRequestException("EMPTY_INPUT", "Step answer text cannot be empty");
        }

        String normalizedStep = normalizeStepKey(stepParam);

        ValidatePlanResponse response = planValidationService.validateStepText(
                roomId,
                normalizedStep,
                request.text(),
                request.isConfirm(),
                request.isOverride(),
                user
        );

        String webUrl = appProperties.getPublicUrl() + "/app/room/" + roomId + "/plan?step=" + normalizedStep;
        return new McpSubmitResponse(response, webUrl);
    }

    public static String normalizeStepKey(String stepParam) {
        if (stepParam == null || stepParam.isBlank()) {
            throw new BadRequestException("INVALID_STEP", "Step parameter is required");
        }
        String s = stepParam.trim().toLowerCase();
        return switch (s) {
            case "prd", "1", "prd-mvp", "step1" -> "prd";
            case "tech", "2", "stack", "stack-arch", "step2" -> "tech";
            case "phases", "3", "phase", "phases-design", "step3" -> "phases";
            case "tasks", "4", "task", "step4" -> "tasks";
            case "demo", "5", "demo-qna", "qna", "step5" -> "demo";
            default -> throw new BadRequestException("INVALID_STEP",
                    "Unknown step: " + stepParam + ". Allowed steps are: prd, tech, phases, tasks, demo");
        };
    }
}
