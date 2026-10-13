package com.hackathonos.backend.rooms;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.dto.JourneyDto;
import com.hackathonos.backend.rooms.dto.StageUnlockRuleDto;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RoomStageService {

    private static final List<String> STAGE_ORDER = List.of("PLANNING", "BUILD", "PRESENT", "REVIEW");

    private final BriefRepository briefRepository;
    private final IdeaRepository ideaRepository;
    private final PlanStepRepository stepRepository;
    private final RoomRepository roomRepository;
    private final ActivityLogger activityLogger;
    private final RoomAccessService roomAccessService;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;

    public RoomStageService(
            BriefRepository briefRepository,
            IdeaRepository ideaRepository,
            PlanStepRepository stepRepository,
            RoomRepository roomRepository,
            ActivityLogger activityLogger,
            RoomAccessService roomAccessService,
            com.hackathonos.backend.events.RoomEventService roomEventService) {
        this.briefRepository = briefRepository;
        this.ideaRepository = ideaRepository;
        this.stepRepository = stepRepository;
        this.roomRepository = roomRepository;
        this.activityLogger = activityLogger;
        this.roomAccessService = roomAccessService;
        this.roomEventService = roomEventService;
    }

    /**
     * Computes what unlocks what for display in room summary.
     */
    public List<StageUnlockRuleDto> computeUnlockRules(Room room) {
        List<StageUnlockRuleDto> rules = new ArrayList<>();

        boolean planOk = room.isPlanDone();
        rules.add(new StageUnlockRuleDto("BUILD", planOk,
                planOk ? "Plan completed and validated" : "Requires all 5 plan steps completed and validated"));

        boolean buildOk = "BUILD".equalsIgnoreCase(room.getWorkflowStage()) || "PRESENT".equalsIgnoreCase(room.getWorkflowStage()) || "REVIEW".equalsIgnoreCase(room.getWorkflowStage());
        rules.add(new StageUnlockRuleDto("PRESENT", buildOk,
                buildOk ? "Build checkpoint confirmed by leader" : "Requires active BUILD stage"));

        boolean presentOk = "PRESENT".equalsIgnoreCase(room.getWorkflowStage()) || "REVIEW".equalsIgnoreCase(room.getWorkflowStage());
        rules.add(new StageUnlockRuleDto("REVIEW", presentOk,
                presentOk ? "Pitch and submission kit ready" : "Requires active PRESENT stage"));

        return rules;
    }

    /**
     * Transitions room stage forward (leader only, guarded).
     */
    @Transactional
    public Room transitionForward(Room room, User leader, String targetStage) {
        roomAccessService.requireLeader(room.getId(), leader);
        String normalizedTarget = targetStage != null ? targetStage.trim().toUpperCase() : "";

        String currentStage = room.getWorkflowStage() != null ? room.getWorkflowStage().toUpperCase() : "PLANNING";
        int currentIndex = STAGE_ORDER.indexOf(currentStage);
        int targetIndex = STAGE_ORDER.indexOf(normalizedTarget);

        if (targetIndex != currentIndex + 1) {
            throw new BadRequestException("INVALID_STAGE_TRANSITION",
                    "Cannot transition directly from " + currentStage + " to " + normalizedTarget);
        }

        if ("BUILD".equals(normalizedTarget) && !room.isPlanDone()) {
            throw new BadRequestException("STAGE_LOCKED", "Plan must be validated before moving to BUILD");
        }

        room.setWorkflowStage(normalizedTarget);
        if ("BUILD".equals(normalizedTarget)) {
            room.setStage("build");
            if (room.getBuildStartedAt() == null) {
                room.setBuildStartedAt(Instant.now());
            }
        } else if ("PRESENT".equals(normalizedTarget)) {
            room.setStage("present");
        } else if ("REVIEW".equals(normalizedTarget)) {
            room.setStage("review");
        }

        room.setUpdatedAt(Instant.now());
        Room saved = roomRepository.save(room);
        activityLogger.log(room, leader, "STAGE_TRANSITION", "Moved room stage from " + currentStage + " to " + normalizedTarget);
        roomEventService.recordEvent(room.getId(), "stage.changed", "room", room.getId().toString(), leader.getId());
        return saved;
    }

    /**
     * Transitions room stage backward by one step (leader only, reversible, preserves data).
     */
    @Transactional
    public Room transitionBackward(Room room, User leader) {
        roomAccessService.requireLeader(room.getId(), leader);
        String currentStage = room.getWorkflowStage() != null ? room.getWorkflowStage().toUpperCase() : "PLANNING";
        int currentIndex = STAGE_ORDER.indexOf(currentStage);

        if (currentIndex <= 0) {
            throw new BadRequestException("INVALID_STAGE_TRANSITION", "Cannot revert past " + currentStage);
        }

        String targetStage = STAGE_ORDER.get(currentIndex - 1);
        room.setWorkflowStage(targetStage);
        if ("PLANNING".equals(targetStage)) {
            room.setStage("plan");
        } else if ("BUILD".equals(targetStage)) {
            room.setStage("build");
        } else if ("PRESENT".equals(targetStage)) {
            room.setStage("present");
        }

        room.setUpdatedAt(Instant.now());
        Room saved = roomRepository.save(room);
        activityLogger.log(room, leader, "STAGE_REVERTED", "Reverted room stage from " + currentStage + " back to " + targetStage);
        roomEventService.recordEvent(room.getId(), "stage.changed", "room", room.getId().toString(), leader.getId());
        return saved;
    }

    /**
     * Recomputes room stage based on phase flags: build -> plan -> ideate -> brief.
     */
    public String recompute(Room room) {
        String stage;
        if (room.getBuildStartedAt() != null) {
            stage = "build";
        } else if (!room.isBriefDone()) {
            stage = "brief";
        } else if (!room.isIdeateDone()) {
            stage = "ideate";
        } else {
            stage = "plan";
        }
        room.setStage(stage);
        return stage;
    }

    /**
     * Computes the 4 journey steps (brief, ideate, plan, build) with status tags and helper texts.
     */
    public JourneyDto getJourney(Room room) {
        String currentStage = recompute(room);
        boolean buildUnlocked = room.getBuildStartedAt() != null || room.isPlanDone();

        String briefHelper = computeBriefHelper(room);
        String ideateHelper = computeIdeateHelper(room);
        String planHelper = computePlanHelper(room);
        String buildHelper = room.getBuildStartedAt() != null ? "Live" : "Locked";

        List<JourneyDto.JourneyStepDto> steps = new ArrayList<>();
        steps.add(buildStep("brief", "Brief", room.isBriefDone(), currentStage.equals("brief"), briefHelper));
        steps.add(buildStep("ideate", "Ideation", room.isIdeateDone(), currentStage.equals("ideate"), ideateHelper));
        steps.add(buildStep("plan", "Plan", room.isPlanDone(), currentStage.equals("plan"), planHelper));
        steps.add(buildBuildStep(currentStage.equals("build"), buildUnlocked, buildHelper));

        return new JourneyDto(currentStage, steps, buildUnlocked);
    }

    private String computeBriefHelper(Room room) {
        Optional<Brief> briefOpt = briefRepository.findByRoomId(room.getId());
        if (briefOpt.isEmpty()) return "Not added";
        Brief brief = briefOpt.get();
        if (brief.isConfirmed()) return "Confirmed";
        boolean hasSource = (brief.getSourceUrl() != null && !brief.getSourceUrl().isBlank())
                || (brief.getFileName() != null && !brief.getFileName().isBlank())
                || (brief.getRawText() != null && !brief.getRawText().isBlank());
        return hasSource ? "Needs confirmation" : "Not added";
    }

    private String computeIdeateHelper(Room room) {
        long total = ideaRepository.countByRoomId(room.getId());
        long approved = ideaRepository.countByRoomIdAndStatus(room.getId(), "APPROVED");
        return total + " ideas, " + approved + " approved";
    }

    private String computePlanHelper(Room room) {
        List<PlanStep> steps = stepRepository.findByRoomId(room.getId());
        long validated = steps.stream().filter(PlanStep::isValidated).count();
        return validated + " of 5 steps";
    }

    private JourneyDto.JourneyStepDto buildStep(String key, String label, boolean isDone, boolean isCurrent, String helper) {
        String status = isDone ? "done" : (isCurrent ? "current" : "upcoming");
        return new JourneyDto.JourneyStepDto(key, label, status, helper);
    }

    private JourneyDto.JourneyStepDto buildBuildStep(boolean isCurrent, boolean isUnlocked, String helper) {
        String status = isCurrent ? "current" : (isUnlocked ? "upcoming" : "locked");
        return new JourneyDto.JourneyStepDto("build", "Build", status, helper);
    }
}
