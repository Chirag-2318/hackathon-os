package com.hackathonos.backend.rooms;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.dto.NextStepDto;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Computes single-source-of-truth next actionable step for a room from live entity states.
 * Rules are strictly ordered and evaluated deterministically:
 *  1. Missing or unconfirmed Brief -> "Add the event brief"
 *  2. Low team count (< 2 members) -> "Invite your team"
 *  3. Incomplete Plan steps -> "Validate [Step] / complete plan"
 *  4. In Build stage:
 *     - No tasks -> "Generate tasks from plan"
 *     - Unassigned tasks -> "Assign open tasks"
 *     - Open tasks -> "Work on sprint tasks"
 *  5. In Present stage:
 *     - Incomplete submission -> "Finish the submission checklist"
 *     - Rehearsal / pitch -> "Prepare pitch kit and demo"
 *  6. In Review stage -> "Conduct team retrospective"
 */
@Service
public class NextStepService {

    private final BriefRepository briefRepository;
    private final RoomMemberRepository memberRepository;
    private final PlanStepRepository planStepRepository;
    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;

    public NextStepService(BriefRepository briefRepository,
                           RoomMemberRepository memberRepository,
                           PlanStepRepository planStepRepository,
                           TaskRepository taskRepository,
                           SubmissionRepository submissionRepository) {
        this.briefRepository = briefRepository;
        this.memberRepository = memberRepository;
        this.planStepRepository = planStepRepository;
        this.taskRepository = taskRepository;
        this.submissionRepository = submissionRepository;
    }

    public NextStepDto computeNextStep(Room room) {
        if (room == null) {
            return new NextStepDto("Create a room", "/app", "Start a hackathon sprint");
        }
        UUID roomId = room.getId();

        // 1. Brief confirmation
        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        if (briefOpt.isEmpty() || !briefOpt.get().isConfirmed()) {
            return new NextStepDto(
                    "Add the event brief",
                    "/app/rooms/" + roomId + "/brief",
                    "Confirm event rules, constraints, and judging criteria"
            );
        }

        // 2. Team membership check
        long memberCount = memberRepository.countByRoomId(roomId);
        if (memberCount < 2) {
            return new NextStepDto(
                    "Invite your team",
                    "/app/rooms/" + roomId + "/team",
                    "Share your 8-character room code with teammates"
            );
        }

        // 3. Plan steps evaluation
        List<PlanStep> steps = planStepRepository.findByRoomId(roomId);
        long validatedSteps = steps.stream().filter(PlanStep::isValidated).count();
        if (validatedSteps < 5) {
            String nextStepName = findFirstIncompleteStep(steps);
            return new NextStepDto(
                    "Validate " + nextStepName,
                    "/app/rooms/" + roomId + "/plan",
                    "Complete all 5 planning milestones to unlock Build"
            );
        }

        // 4. Build phase tasks
        String stage = room.getWorkflowStage() != null ? room.getWorkflowStage() : room.getStage();
        if ("BUILD".equalsIgnoreCase(stage)) {
            List<Task> tasks = taskRepository.findByRoomId(roomId);
            if (tasks.isEmpty()) {
                return new NextStepDto(
                    "Generate tasks from plan",
                    "/app/rooms/" + roomId + "/board",
                    "Break down the validated plan into actionable board tasks"
                );
            }
            long unassigned = tasks.stream().filter(t -> t.getAssigneeId() == null).count();
            if (unassigned > 0) {
                return new NextStepDto(
                    "Assign " + unassigned + " open tasks",
                    "/app/rooms/" + roomId + "/board",
                    "Delegate unassigned tasks to active teammates"
                );
            }
            long openTasks = tasks.stream().filter(t -> !"DONE".equalsIgnoreCase(t.getStatus())).count();
            if (openTasks > 0) {
                return new NextStepDto(
                    "Complete " + openTasks + " active tasks",
                    "/app/rooms/" + roomId + "/board",
                    "Advance in-progress tasks toward feature freeze"
                );
            }
        }

        // 5. Present phase & submission
        if ("PRESENT".equalsIgnoreCase(stage)) {
            Optional<Submission> submissionOpt = submissionRepository.findByRoomId(roomId);
            if (submissionOpt.isEmpty() || !submissionOpt.get().isComplete()) {
                return new NextStepDto(
                    "Finish the submission checklist",
                    "/app/rooms/" + roomId + "/submission",
                    "Verify repo links, demo video, and submit before deadline"
                );
            }
            return new NextStepDto(
                "Prepare pitch kit and demo",
                "/app/rooms/" + roomId + "/pitch",
                "Rehearse demo transitions and review judge Q&A"
            );
        }

        // 6. Review / Retrospective
        if ("REVIEW".equalsIgnoreCase(stage) || room.getSubmittedAt() != null) {
            return new NextStepDto(
                "Conduct team retrospective",
                "/app/rooms/" + roomId + "/review",
                "Capture project highlights, feedback, and lessons learned"
            );
        }

        return new NextStepDto(
                "Go to room overview",
                "/app/rooms/" + roomId + "/overview",
                "Review live progress and team momentum"
        );
    }

    private String findFirstIncompleteStep(List<PlanStep> steps) {
        List<String> order = List.of("prd", "tech", "phases", "tasks", "demo");
        for (String k : order) {
            boolean valid = steps.stream().anyMatch(s -> k.equalsIgnoreCase(s.getStepKey()) && s.isValidated());
            if (!valid) {
                return switch (k) {
                    case "prd" -> "PRD & Problem";
                    case "tech" -> "Tech Stack";
                    case "phases" -> "Sprint Phases";
                    case "tasks" -> "Task Breakdown";
                    case "demo" -> "Demo Script & Q&A";
                    default -> k;
                };
            }
        }
        return "Plan milestones";
    }
}
