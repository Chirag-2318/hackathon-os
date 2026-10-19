package com.hackathonos.backend.rooms;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.dto.NextStepDto;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NextStepService {

    private final BriefRepository briefRepository;
    private final RoomMemberRepository memberRepository;
    private final PlanStepRepository planStepRepository;
    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;
    private final PlanPhaseRepository phaseRepository;
    private final IdeaRepository ideaRepository;

    public NextStepService(BriefRepository briefRepository,
                           RoomMemberRepository memberRepository,
                           PlanStepRepository planStepRepository,
                           TaskRepository taskRepository,
                           SubmissionRepository submissionRepository,
                           PlanPhaseRepository phaseRepository,
                           IdeaRepository ideaRepository) {
        this.briefRepository = briefRepository;
        this.memberRepository = memberRepository;
        this.planStepRepository = planStepRepository;
        this.taskRepository = taskRepository;
        this.submissionRepository = submissionRepository;
        this.phaseRepository = phaseRepository;
        this.ideaRepository = ideaRepository;
    }

    public NextStepDto computeNextStep(Room room) {
        return computeNextStep(room, null);
    }

    public NextStepDto computeNextStep(Room room, User user) {
        if (room == null) {
            return new NextStepDto("Create a room", "/app", "Start a hackathon sprint", false);
        }
        UUID roomId = room.getId();

        // Submitted room check
        if (room.getSubmittedAt() != null || "SUBMITTED".equalsIgnoreCase(room.getStage())) {
            return new NextStepDto(
                    "View summary",
                    "/app/room/" + roomId + "/summary",
                    "Room is complete; view your milestone timeline and achievements",
                    false
            );
        }

        // 1. Brief not confirmed: "Open Brief"
        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        if (briefOpt.isEmpty() || !briefOpt.get().isConfirmed()) {
            return new NextStepDto(
                    "Open Brief",
                    "/app/room/" + roomId + "/brief",
                    "Confirm event rules, constraints, and judging criteria",
                    false
            );
        }

        // 2. Brief confirmed and no approved idea: "Go to Ideate" (ideation in progress)
        long approvedIdeas = ideaRepository.countByRoomIdAndStatus(roomId, "APPROVED");
        if (approvedIdeas == 0) {
            return new NextStepDto(
                    "Go to Ideate",
                    "/app/room/" + roomId + "/ideate",
                    "Brainstorm and approve the winning project direction",
                    false
            );
        }

        // 3. An approved idea but the plan not finished: "Continue Plan, step N of 4"
        List<PlanStep> steps = planStepRepository.findByRoomId(roomId);
        long validatedSteps = steps.stream().filter(PlanStep::isValidated).count();
        if (validatedSteps < 4) {
            long stepNum = Math.min(4, validatedSteps + 1);
            return new NextStepDto(
                    "Continue Plan, step " + stepNum + " of 4",
                    "/app/room/" + roomId + "/plan",
                    "Complete all 4 planning milestones to unlock Build",
                    false
            );
        }

        boolean isLeader = true;
        if (user != null) {
            isLeader = memberRepository.findByRoomIdAndUserId(roomId, user.getId())
                    .map(m -> "LEADER".equalsIgnoreCase(m.getRole()))
                    .orElse(true);
        }

        // 4. Build stage / phases
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        boolean allPhasesComplete = !phases.isEmpty() && phases.stream().allMatch(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()));
        String stage = room.getWorkflowStage() != null ? room.getWorkflowStage() : room.getStage();

        if (allPhasesComplete || "PRESENT".equalsIgnoreCase(stage)) {
            return new NextStepDto(
                    "Go to Present",
                    "/app/room/" + roomId + "/submission",
                    "Build is complete; prepare final submission and pitch materials",
                    false
            );
        }

        if (!phases.isEmpty()) {
            // Find active phase
            PlanPhase activePhase = phases.stream()
                    .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                    .findFirst()
                    .orElse(phases.stream().filter(p -> !"COMPLETED".equalsIgnoreCase(p.getStatus())).findFirst().orElse(phases.get(0)));

            String pKey = activePhase.getPhaseKey() != null ? activePhase.getPhaseKey() : ("P" + (activePhase.getPosition() + 1));
            int pos = activePhase.getPosition();
            String nextPKey = (pos + 1 < phases.size()) ? phases.get(pos + 1).getPhaseKey() : null;

            List<Task> phaseTasks = taskRepository.findByRoomIdAndPhaseKey(roomId, activePhase.getPhaseKey()).stream()
                    .filter(t -> !t.isDropped())
                    .toList();
            if (phaseTasks.isEmpty() && activePhase.getId() != null) {
                phaseTasks = taskRepository.findByRoomIdAndPhaseId(roomId, activePhase.getId()).stream()
                        .filter(t -> !t.isDropped())
                        .toList();
            }

            // active phase has no tasks
            if (phaseTasks.isEmpty()) {
                if (isLeader) {
                    return new NextStepDto(
                            "Generate tasks for " + pKey,
                            "/app/room/" + roomId + "/board",
                            "Break down phase deliverables into board tasks",
                            true
                    );
                } else {
                    return new NextStepDto(
                            "Open Board",
                            "/app/room/" + roomId + "/board",
                            "Waiting for the leader to generate " + pKey + " tasks",
                            false
                    );
                }
            }

            // tasks exist: check if phase ready
            boolean isReady = phaseTasks.stream().allMatch(Task::isConfirmedDone);
            if (isReady) {
                if (isLeader) {
                    String actionTitle = nextPKey != null ? ("Start " + nextPKey) : "Complete build";
                    return new NextStepDto(
                            actionTitle,
                            "/app/room/" + roomId + "/board",
                            pKey + " complete; advance to the next phase",
                            true
                    );
                } else {
                    return new NextStepDto(
                            "Open Board",
                            "/app/room/" + roomId + "/board",
                            pKey + " complete. Waiting for the leader to advance.",
                            true
                    );
                }
            }

            // tasks exist and active
            return new NextStepDto(
                    "Open Board",
                    "/app/room/" + roomId + "/board",
                    "Advance active tasks on the Kanban board",
                    false
            );
        }

        return new NextStepDto(
                "Open Board",
                "/app/room/" + roomId + "/board",
                "Advance active tasks on the Kanban board",
                false
        );
    }

    private String findFirstIncompleteStep(List<PlanStep> steps) {
        List<String> order = List.of("prd-mvp", "stack-arch", "phases-design", "demo-qna");
        for (String k : order) {
            boolean valid = steps.stream().anyMatch(s ->
                    (k.equalsIgnoreCase(s.getStepKey()) || isLegacyMatch(k, s.getStepKey())) && s.isValidated());
            if (!valid) {
                return switch (k) {
                    case "prd-mvp" -> "PRD & MVP";
                    case "stack-arch" -> "Stack & Architecture";
                    case "phases-design" -> "Phases & Design";
                    case "demo-qna" -> "Demo Script & Q&A";
                    default -> k;
                };
            }
        }
        return "Plan milestones";
    }

    private boolean isLegacyMatch(String canonical, String stepKey) {
        if (stepKey == null) return false;
        return switch (canonical) {
            case "prd-mvp" -> stepKey.equalsIgnoreCase("prd") || stepKey.equals("1");
            case "stack-arch" -> stepKey.equalsIgnoreCase("tech") || stepKey.equals("2");
            case "phases-design" -> stepKey.equalsIgnoreCase("phases") || stepKey.equals("3");
            case "demo-qna" -> stepKey.equalsIgnoreCase("demo") || stepKey.equals("5") || stepKey.equals("4");
            default -> false;
        };
    }
}
