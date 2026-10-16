package com.hackathonos.backend.rooms;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
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

    public NextStepService(BriefRepository briefRepository,
                           RoomMemberRepository memberRepository,
                           PlanStepRepository planStepRepository,
                           TaskRepository taskRepository,
                           SubmissionRepository submissionRepository,
                           PlanPhaseRepository phaseRepository) {
        this.briefRepository = briefRepository;
        this.memberRepository = memberRepository;
        this.planStepRepository = planStepRepository;
        this.taskRepository = taskRepository;
        this.submissionRepository = submissionRepository;
        this.phaseRepository = phaseRepository;
    }

    public NextStepDto computeNextStep(Room room) {
        return computeNextStep(room, null);
    }

    public NextStepDto computeNextStep(Room room, User user) {
        if (room == null) {
            return new NextStepDto("Create a room", "/app", "Start a hackathon sprint");
        }
        UUID roomId = room.getId();

        // 0. Submitted room check
        if (room.getSubmittedAt() != null) {
            return new NextStepDto(
                    "Review your summary",
                    "/app/room/" + roomId + "/summary",
                    "Room is complete; view your milestone timeline and achievements"
            );
        }

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

        // 3. Plan steps evaluation (4 milestones)
        List<PlanStep> steps = planStepRepository.findByRoomId(roomId);
        long validatedSteps = steps.stream().filter(PlanStep::isValidated).count();
        if (validatedSteps < 4) {
            String nextStepName = findFirstIncompleteStep(steps);
            return new NextStepDto(
                    "Validate " + nextStepName,
                    "/app/rooms/" + roomId + "/plan",
                    "Complete all 4 planning milestones to unlock Build"
            );
        }

        // 4. Build phase tasks
        String stage = room.getWorkflowStage() != null ? room.getWorkflowStage() : room.getStage();
        if ("BUILD".equalsIgnoreCase(stage)) {
            List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);

            // Find active phase
            Optional<PlanPhase> activePhaseOpt = phases.stream()
                    .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                    .findFirst();

            if (activePhaseOpt.isPresent()) {
                PlanPhase activePhase = activePhaseOpt.get();
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

                boolean isLeader = true;
                if (user != null) {
                    isLeader = memberRepository.findByRoomIdAndUserId(roomId, user.getId())
                            .map(m -> "LEADER".equalsIgnoreCase(m.getRole()))
                            .orElse(true);
                }

                boolean tasksGenerated = activePhase.getTasksGeneratedAt() != null;
                boolean isReady = tasksGenerated && !phaseTasks.isEmpty() && phaseTasks.stream().allMatch(Task::isConfirmedDone);

                if (isReady) {
                    if (isLeader) {
                        String actionTitle = nextPKey != null ? ("Start phase " + nextPKey) : "Complete build";
                        return new NextStepDto(
                                actionTitle,
                                "/app/room/" + roomId + "/board",
                                "Phase checkpoint reached; advance to the next phase"
                        );
                    } else {
                        return new NextStepDto(
                                "Waiting for the leader to start " + (nextPKey != null ? nextPKey : "next stage"),
                                "/app/room/" + roomId + "/board",
                                pKey + " complete. Waiting for the leader to advance."
                        );
                    }
                }

                if (!tasksGenerated || phaseTasks.isEmpty()) {
                    if (isLeader) {
                        return new NextStepDto(
                                "Generate tasks for " + pKey,
                                "/app/room/" + roomId + "/board",
                                "Break down phase deliverables into board tasks"
                        );
                    } else {
                        return new NextStepDto(
                                "Waiting for the leader to generate " + pKey + " tasks",
                                "/app/room/" + roomId + "/board",
                                "Your room leader is preparing tasks for this phase"
                        );
                    }
                } else {
                    if (user != null) {
                        boolean hasAssignedOpen = phaseTasks.stream()
                                .anyMatch(t -> user.getId().equals(t.getAssigneeId()) && !t.isConfirmedDone());
                        if (hasAssignedOpen) {
                            return new NextStepDto(
                                    "Pick up your next task",
                                    "/app/room/" + roomId + "/board",
                                    "Advance your assigned tasks on the Kanban board"
                            );
                        }
                    }

                    long unassigned = phaseTasks.stream().filter(t -> t.getAssigneeId() == null).count();
                    if (unassigned > 0) {
                        return new NextStepDto(
                                "Assign " + unassigned + " open tasks",
                                "/app/room/" + roomId + "/board",
                                "Delegate unassigned tasks to active teammates"
                        );
                    }
                    long openTasks = phaseTasks.stream().filter(t -> !t.isConfirmedDone()).count();
                    if (openTasks > 0) {
                        return new NextStepDto(
                                "Complete " + openTasks + " active tasks",
                                "/app/room/" + roomId + "/board",
                                "Advance in-progress tasks toward phase freeze"
                        );
                    }
                }
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
