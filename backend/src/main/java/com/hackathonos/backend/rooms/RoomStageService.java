package com.hackathonos.backend.rooms;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.dto.JourneyDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RoomStageService {

    private final BriefRepository briefRepository;
    private final IdeaRepository ideaRepository;
    private final PlanStepRepository stepRepository;

    public RoomStageService(
            BriefRepository briefRepository,
            IdeaRepository ideaRepository,
            PlanStepRepository stepRepository) {
        this.briefRepository = briefRepository;
        this.ideaRepository = ideaRepository;
        this.stepRepository = stepRepository;
    }

    /**
     * Recomputes room stage based on phase flags: build -> plan -> ideate -> brief.
     * Called whenever a phase completion flag or build_started_at timestamp changes.
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
        if (briefOpt.isEmpty()) {
            return "Not added";
        }
        Brief brief = briefOpt.get();
        if (brief.isConfirmed()) {
            return "Confirmed";
        }
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
        String status;
        if (isDone) {
            status = "done";
        } else if (isCurrent) {
            status = "current";
        } else {
            status = "upcoming";
        }
        return new JourneyDto.JourneyStepDto(key, label, status, helper);
    }

    private JourneyDto.JourneyStepDto buildBuildStep(boolean isCurrent, boolean isUnlocked, String helper) {
        String status;
        if (isCurrent) {
            status = "current";
        } else if (isUnlocked) {
            status = "upcoming";
        } else {
            status = "locked";
        }
        return new JourneyDto.JourneyStepDto("build", "Build", status, helper);
    }
}
