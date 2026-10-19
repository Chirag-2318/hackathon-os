package com.hackathonos.backend.plan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.docs.*;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.plan.dto.PlanCompletionSummaryDto;
import com.hackathonos.backend.plan.validators.PhasesValidator;
import com.hackathonos.backend.plan.validators.TasksValidator;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service that compiles validated plan steps into real phases, 9 Markdown documents, and board tasks.
 */
@Service
public class PlanCompletionService {

    private final PlanStepRepository stepRepository;
    private final PlanPhaseRepository phaseRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final TaskRepository taskRepository;
    private final TaskKeyService taskKeyService;
    private final TaskLabelRepository labelRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskHistoryRepository historyRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final RoomStageService stageService;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final PhasesValidator phasesValidator;
    private final TasksValidator tasksValidator;
    private final ObjectMapper objectMapper;
    private final com.hackathonos.backend.checkpoints.CheckpointService checkpointService;
    private final com.hackathonos.backend.mvp.MvpSeedService mvpSeedService;
    private final com.hackathonos.backend.diagrams.DiagramSeedService diagramSeedService;
    private final com.hackathonos.backend.demo.DemoSeedService demoSeedService;
    private final com.hackathonos.backend.pitch.QaSeedService qaSeedService;

    public PlanCompletionService(
            PlanStepRepository stepRepository,
            PlanPhaseRepository phaseRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            TaskRepository taskRepository,
            TaskKeyService taskKeyService,
            TaskLabelRepository labelRepository,
            TaskDependencyRepository dependencyRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskHistoryRepository historyRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            RoomStageService stageService,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            PhasesValidator phasesValidator,
            TasksValidator tasksValidator,
            ObjectMapper objectMapper,
            com.hackathonos.backend.checkpoints.CheckpointService checkpointService,
            com.hackathonos.backend.mvp.MvpSeedService mvpSeedService,
            com.hackathonos.backend.diagrams.DiagramSeedService diagramSeedService,
            com.hackathonos.backend.demo.DemoSeedService demoSeedService,
            com.hackathonos.backend.pitch.QaSeedService qaSeedService) {
        this.stepRepository = stepRepository;
        this.phaseRepository = phaseRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.taskRepository = taskRepository;
        this.taskKeyService = taskKeyService;
        this.labelRepository = labelRepository;
        this.dependencyRepository = dependencyRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.historyRepository = historyRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.stageService = stageService;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.phasesValidator = phasesValidator;
        this.tasksValidator = tasksValidator;
        this.objectMapper = objectMapper;
        this.checkpointService = checkpointService;
        this.mvpSeedService = mvpSeedService;
        this.diagramSeedService = diagramSeedService;
        this.demoSeedService = demoSeedService;
        this.qaSeedService = qaSeedService;
    }

    /**
     * Executes clean plan regeneration, creates 9 documents, phases, tasks, and assigns work by skill.
     */
    @Transactional
    public PlanCompletionSummaryDto complete(Room room) {
        roomRepository.findWithLockById(room.getId());
        UUID roomId = room.getId();

        List<Doc> docs = docRepository.findByRoomId(roomId).stream()
                .filter(d -> "PLAN".equalsIgnoreCase(d.getSource()) || isPlanDoc(d.getFileName()))
                .toList();
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<Task> tasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
        if (tasks.isEmpty()) {
            tasks = taskRepository.findByRoomId(roomId);
        }
        int totalTasks = tasks.size();
        int assignedCount = (int) tasks.stream().filter(t -> t.getAssigneeId() != null).count();
        int unassignedCount = totalTasks - assignedCount;

        room.setPlanDone(true);
        if (room.getBuildStartedAt() == null) {
            room.setBuildStartedAt(Instant.now());
            room.setStage("build");
        }
        if (!phases.isEmpty()) {
            PlanPhase p1 = phases.get(0);
            if (!"ACTIVE".equals(p1.getStatus()) && !"COMPLETED".equals(p1.getStatus())) {
                p1.setStatus("ACTIVE");
                p1.setActivatedAt(Instant.now());
                phaseRepository.save(p1);
            }
        }
        stageService.recompute(room);
        roomRepository.save(room);

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        UUID leaderId = members.stream()
                .filter(m -> "leader".equalsIgnoreCase(m.getRole()))
                .map(RoomMember::getUserId)
                .findFirst()
                .orElse(room.getOwnerId());

        User leaderUser = leaderId != null ? userRepository.findById(leaderId).orElse(null) : null;
        activityLogger.log(room, leaderUser, "PLAN_COMPLETE", "Plan completed with " + totalTasks + " tasks");
        notificationService.notifyRoomMembers(room, null, NotificationType.PLAN_COMPLETE,
                "Plan complete", "Plan is complete! Team is ready to enter the build phase.");

        checkpointService.createForRoom(room);

        return new PlanCompletionSummaryDto(
                docs.size(),
                phases.size(),
                totalTasks,
                assignedCount,
                unassignedCount,
                DateTimeFormatter.ISO_INSTANT.format(Instant.now())
        );
    }

    private boolean isPlanDoc(String fileName) {
        if (fileName == null) return false;
        return List.of("PRD.md", "MVP.md", "TECH_STACK.md", "ARCHITECTURE.md", "PHASES.md", "DESIGN.md", "DEMO_SCRIPT.md", "QNA.md")
                .contains(fileName);
    }

    private void cleanRegenerate(UUID roomId) {
        // Delete tasks with source PLAN
        List<Task> planTasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
        for (Task t : planTasks) {
            dependencyRepository.deleteByTaskId(t.getId());
            acceptanceRepository.deleteByTaskId(t.getId());
            labelRepository.deleteByTaskId(t.getId());
            historyRepository.deleteByTaskId(t.getId());
            taskRepository.delete(t);
        }

        // Delete generated docs (docs where version 1 createdBy is null)
        List<Doc> docs = docRepository.findByRoomId(roomId);
        for (Doc d : docs) {
            List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(d.getId());
            if (versions.stream().allMatch(v -> v.getCreatedBy() == null)) {
                docVersionRepository.deleteByDocId(d.getId());
                docRepository.delete(d);
            }
        }

        // Delete phases
        phaseRepository.deleteByRoomId(roomId);

        // Clean MVP, diagram, demo, and QA for regeneration
        mvpSeedService.cleanForRoom(roomId);
        diagramSeedService.cleanForRoom(roomId);
        demoSeedService.cleanForRoom(roomId);
        qaSeedService.cleanForRoom(roomId);
    }

    private List<Doc> generateDocs(Room room, Map<String, String> answers, List<PhasesValidator.NormalizedPhase> phases) {
        String prdAnswer = answers.getOrDefault("prd", "");
        String techAnswer = answers.getOrDefault("tech", "");
        String demoAnswer = answers.getOrDefault("demo", "");

        MarkdownSections prdSec = MarkdownSections.parse(prdAnswer);
        MarkdownSections techSec = MarkdownSections.parse(techAnswer);
        MarkdownSections demoSec = MarkdownSections.parse(demoAnswer);

        String dateStr = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        String grayLine = "*Generated from the plan on " + dateStr + "*\n\n";

        List<Doc> docs = new ArrayList<>();

        // 1. PRD.md: # PRD up to # MVP
        String prdContent = extractBetween(prdAnswer, "# PRD", "# MVP");
        docs.add(saveDoc(room.getId(), "PRD.md", "Product Requirements Document", grayLine + prdContent));

        // 2. MVP.md: # MVP excluding Cut list and Risks
        String mvpPart = extractFrom(prdAnswer, "# MVP");
        mvpPart = removeSection(mvpPart, "## Cut list");
        mvpPart = removeSection(mvpPart, "## Risks and fallbacks");
        docs.add(saveDoc(room.getId(), "MVP.md", "Minimum Viable Product", grayLine + mvpPart));

        // 3. PROBLEM.md
        StringBuilder problemSb = new StringBuilder();
        problemSb.append("# Problem & Identity\n\n");
        problemSb.append("## Problem\n").append(sectionOrDefault(prdSec.getSection("## Problem"))).append("\n\n");
        problemSb.append("## Target user\n").append(sectionOrDefault(prdSec.getSection("## Target user"))).append("\n\n");
        problemSb.append("## One-sentence identity\n").append(sectionOrDefault(prdSec.getSection("## One-sentence identity"))).append("\n");
        docs.add(saveDoc(room.getId(), "PROBLEM.md", "Problem and Audience", grayLine + problemSb));

        // 4. CUT_LIST.md
        String cutList = "# Cut List\n\n" + sectionOrDefault(prdSec.getSection("## Cut list"));
        docs.add(saveDoc(room.getId(), "CUT_LIST.md", "MVP Scope Cut List", grayLine + cutList));

        // 5. RISKS.md
        String risks = "# Risks & Fallbacks\n\n" + sectionOrDefault(prdSec.getSection("## Risks and fallbacks"));
        docs.add(saveDoc(room.getId(), "RISKS.md", "Risks and Fallbacks", grayLine + risks));

        // 6. TECH_STACK.md
        docs.add(saveDoc(room.getId(), "TECH_STACK.md", "Tech Stack and Architecture", grayLine + (techAnswer.isBlank() ? "Not provided in the plan answer." : techAnswer)));

        // 7. PHASES.md: Markdown table
        StringBuilder phasesTable = new StringBuilder();
        phasesTable.append("# Sprint Phases\n\n");
        phasesTable.append("| Phase | Time share | Exit checkpoint | Goals |\n");
        phasesTable.append("| --- | --- | --- | --- |\n");
        for (PhasesValidator.NormalizedPhase p : phases) {
            String goalsStr = String.join("; ", p.goals);
            phasesTable.append(String.format(Locale.US, "| %s | %.0f%% - %.0f%% | %s | %s |\n",
                    p.name, p.startPct, p.endPct, p.exitCheckpoint, goalsStr));
        }
        docs.add(saveDoc(room.getId(), "PHASES.md", "Sprint Timeline & Milestones", grayLine + phasesTable));

        // 8. DEMO_SCRIPT.md: # Demo script and # Shot list
        StringBuilder demoSb = new StringBuilder();
        demoSb.append("# Demo Script & Shot List\n\n");
        demoSb.append("## Demo script\n").append(sectionOrDefault(demoSec.getSection("# Demo script"))).append("\n\n");
        demoSb.append("## Shot list\n").append(sectionOrDefault(demoSec.getSection("# Shot list"))).append("\n");
        docs.add(saveDoc(room.getId(), "DEMO_SCRIPT.md", "Judge Demo Script", grayLine + demoSb));

        // 9. QA.md: # Likely judge Q&A
        String qa = "# Judge Q&A Preparation\n\n" + sectionOrDefault(demoSec.getSection("# Likely judge Q&A"));
        docs.add(saveDoc(room.getId(), "QA.md", "Judge Q&A Defense", grayLine + qa));

        // 10. DECISIONS.md
        docs.add(generateDecisionsDoc(room, phases, techAnswer, grayLine));

        return docs;
    }

    private Doc generateDecisionsDoc(Room room, List<PhasesValidator.NormalizedPhase> phases, String techAnswer, String grayLine) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Architecture & Product Decisions\n\n");
        sb.append("Generated: ").append(DateTimeFormatter.ISO_INSTANT.format(Instant.now())).append("\n\n");

        Optional<Idea> primary = ideaRepository.findByRoomIdAndPrimaryTrue(room.getId());
        sb.append("## Primary Concept\n");
        if (primary.isPresent()) {
            sb.append("- ").append(primary.get().getText()).append("\n\n");
        } else {
            sb.append("- Not selected\n\n");
        }

        List<Idea> approved = ideaRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(room.getId(), "APPROVED");
        sb.append("## Approved Features & Concepts\n");
        if (approved.isEmpty()) {
            sb.append("- None\n\n");
        } else {
            for (Idea a : approved) {
                sb.append("- ").append(a.getText().split("\\n")[0]).append("\n");
            }
            sb.append("\n");
        }

        sb.append("## Tech Stack & Architecture\n");
        sb.append(techAnswer.isBlank() ? "Not provided in the plan answer.\n\n" : techAnswer + "\n\n");

        sb.append("## Sprint Milestones\n");
        for (PhasesValidator.NormalizedPhase p : phases) {
            sb.append(String.format(Locale.US, "- **%s** (%.0f%% - %.0f%%): %s\n", p.name, p.startPct, p.endPct, p.exitCheckpoint));
        }

        return saveDoc(room.getId(), "DECISIONS.md", "Key Product & Architecture Decisions", grayLine + sb);
    }

    private Doc saveDoc(UUID roomId, String fileName, String title, String content) {
        String safeTitle = DefensiveParserUtils.trimAtWordBoundary(title, 2000);
        String safeContent = DefensiveParserUtils.trimAtWordBoundary(content, 400_000);
        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseGet(() -> new Doc(roomId, fileName, safeTitle, 1));
        doc.setCurrentVersion(1);
        doc.setTitle(safeTitle);
        doc.setUpdatedAt(Instant.now());
        doc = docRepository.save(doc);

        docVersionRepository.deleteByDocId(doc.getId());
        DocVersion version = new DocVersion(doc.getId(), 1, safeContent, "Initial generated version", null);
        docVersionRepository.save(version);
        return doc;
    }

    private record TaskGenerationResult(int totalTasks, int assignedCount, int unassignedCount) {}

    private TaskGenerationResult createTasksAndAssignments(
            Room room,
            List<TasksValidator.NormalizedTask> parsedTasks,
            Map<String, PlanPhase> createdPhases,
            List<RoomMember> members,
            UUID leaderId) {

        // Determine which tasks have dependents
        Set<String> dependedUponIds = new HashSet<>();
        for (TasksValidator.NormalizedTask t : parsedTasks) {
            dependedUponIds.addAll(t.dependsOn);
        }

        // Skill map: skill -> List<RoomMember>
        Map<String, List<RoomMember>> membersBySkill = new HashMap<>();
        for (RoomMember m : members) {
            List<RoomMemberSkill> skills = skillRepository.findByMemberId(m.getId());
            Set<String> memberSkills = new HashSet<>();
            for (RoomMemberSkill s : skills) memberSkills.add(s.getSkill().toLowerCase());

            for (String s : memberSkills) {
                membersBySkill.computeIfAbsent(s, k -> new ArrayList<>()).add(m);
            }
        }

        Map<String, Integer> roundRobinIndex = new HashMap<>();
        Map<UUID, Integer> assignedPerUser = new HashMap<>();

        Map<String, Task> createdTasks = new HashMap<>();
        int position = 0;
        int assignedCount = 0;
        int unassignedCount = 0;

        Instant eventStart = room.getEventStart() != null ? room.getEventStart() : Instant.now();
        Instant eventEnd = room.getEventEnd() != null ? room.getEventEnd() : eventStart.plus(Duration.ofHours(36));
        Duration totalDuration = Duration.between(eventStart, eventEnd);

        for (TasksValidator.NormalizedTask pt : parsedTasks) {
            TaskKeyService.TaskKeyResult keyResult = taskKeyService.nextKeyResult(room);
            String priority = dependedUponIds.contains(pt.id) ? "HIGH" : "MEDIUM";
            PlanPhase phase = createdPhases.get(pt.phaseId);
            UUID phaseId = phase != null ? phase.getId() : null;

            Instant dueAt = eventEnd;
            if (phase != null && totalDuration.toMinutes() > 0) {
                double pct = phase.getEndPct().doubleValue() / 100.0;
                long minutesToAdd = (long) (totalDuration.toMinutes() * pct);
                dueAt = eventStart.plus(Duration.ofMinutes(minutesToAdd));
            }

            // Skill assignment
            String skillCategory = mapRoleToSkill(pt.role);
            List<RoomMember> candidates = membersBySkill.getOrDefault(skillCategory.toLowerCase(), Collections.emptyList());
            UUID assigneeId = null;

            if (!candidates.isEmpty()) {
                int idx = roundRobinIndex.getOrDefault(skillCategory, 0) % candidates.size();
                RoomMember assignedMember = candidates.get(idx);
                roundRobinIndex.put(skillCategory, idx + 1);
                assigneeId = assignedMember.getUserId();
                assignedPerUser.put(assigneeId, assignedPerUser.getOrDefault(assigneeId, 0) + 1);
                assignedCount++;
            } else {
                unassignedCount++;
            }

            Task task = new Task(
                    room.getId(),
                    keyResult.key(),
                    keyResult.number(),
                    pt.title,
                    "",
                    "TODO",
                    assigneeId,
                    leaderId,
                    priority,
                    phaseId,
                    pt.role,
                    pt.estimateMin,
                    dueAt,
                    position++,
                    "PLAN"
            );
            task = taskRepository.save(task);
            createdTasks.put(pt.id, task);

            // Labels
            labelRepository.save(new TaskLabel(task.getId(), pt.role));

            // Acceptance items
            if (pt.acceptance != null && !pt.acceptance.isBlank()) {
                String[] sentences = pt.acceptance.split("[.\\n]+");
                int accPos = 0;
                for (String s : sentences) {
                    String clean = s.trim();
                    if (!clean.isEmpty()) {
                        acceptanceRepository.save(new TaskAcceptanceItem(task.getId(), clean, false, accPos++));
                    }
                }
            }

            // History
            historyRepository.save(new TaskHistory(task.getId(), leaderId, "Created from the plan"));
        }

        // Dependencies
        for (TasksValidator.NormalizedTask pt : parsedTasks) {
            Task task = createdTasks.get(pt.id);
            if (task != null && pt.dependsOn != null) {
                for (String depId : pt.dependsOn) {
                    if (depId == null || depId.isBlank()) continue;
                    Task depTask = createdTasks.get(depId);
                    if (depTask == null) {
                        for (Task candidate : createdTasks.values()) {
                            if (candidate.getTaskKey().equalsIgnoreCase(depId.trim())
                                    || candidate.getSummary().equalsIgnoreCase(depId.trim())) {
                                depTask = candidate;
                                break;
                            }
                        }
                    }
                    if (depTask != null && !depTask.getId().equals(task.getId())) {
                        dependencyRepository.save(new TaskDependency(task.getId(), depTask.getId(), room.getId()));
                    }
                }
            }
        }

        // Notify each assignee once
        for (Map.Entry<UUID, Integer> entry : assignedPerUser.entrySet()) {
            userRepository.findById(entry.getKey()).ifPresent(user -> {
                int count = entry.getValue();
                notificationService.notifyUser(user, room, NotificationType.TASK_ASSIGNED,
                        "Tasks assigned", "You have " + count + " new task" + (count > 1 ? "s" : "") + " from the plan.");
            });
        }

        return new TaskGenerationResult(parsedTasks.size(), assignedCount, unassignedCount);
    }

    private String mapRoleToSkill(String role) {
        if (role == null) return "Builder";
        String lower = role.toLowerCase();
        if (lower.contains("frontend") || lower.contains("ui") || lower.contains("react")) return "Frontend";
        if (lower.contains("backend") || lower.contains("api") || lower.contains("database") || lower.contains("server")) return "Backend";
        if (lower.contains("ml") || lower.contains("ai") || lower.contains("model") || lower.contains("data")) return "ML/AI";
        if (lower.contains("design") || lower.contains("ux") || lower.contains("logo")) return "Design";
        if (lower.contains("pitch") || lower.contains("deck") || lower.contains("present") || lower.contains("demo script")) return "Presenter";
        if (lower.contains("domain") || lower.contains("research")) return "Domain";
        if (lower.contains("test") || lower.contains("qa") || lower.contains("demo")) return "QA/Demo";
        return "Frontend";
    }

    private String sectionOrDefault(String section) {
        return (section != null && !section.isBlank()) ? section.trim() : "Not provided in the plan answer.";
    }

    private String extractBetween(String text, String startHeading, String endHeading) {
        int start = text.indexOf(startHeading);
        int end = text.indexOf(endHeading);
        if (start >= 0 && end > start) {
            return text.substring(start, end).trim();
        } else if (start >= 0) {
            return text.substring(start).trim();
        }
        return "Not provided in the plan answer.";
    }

    private String extractFrom(String text, String startHeading) {
        int start = text.indexOf(startHeading);
        if (start >= 0) {
            return text.substring(start).trim();
        }
        return "Not provided in the plan answer.";
    }

    private String removeSection(String text, String heading) {
        int idx = text.indexOf(heading);
        if (idx < 0) return text;
        int nextHeading = text.indexOf("\n#", idx + heading.length());
        if (nextHeading >= 0) {
            return text.substring(0, idx) + text.substring(nextHeading);
        }
        return text.substring(0, idx).trim();
    }
}
