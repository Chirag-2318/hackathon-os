package com.hackathonos.backend.plan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.demo.DemoSeedService;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.mvp.*;
import com.hackathonos.backend.pitch.QaSeedService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Synchronizes validated planning documents with downstream domain entities:
 * - TASKS.md -> Board tasks, dependencies, assignee mappings, and workload recomputation
 * - MVP.md -> MVP Studio structured state, flows, ledger, and cut list
 * - PHASES.md -> Plan phases, checkpoints, and freeze marker
 * - DEMO_SCRIPT.md & QNA.md -> Pitch kit seeding
 */
@Service
public class PlanDownstreamSyncService {

    private static final Logger log = LoggerFactory.getLogger(PlanDownstreamSyncService.class);

    private final MvpStateRepository mvpStateRepository;
    private final MvpFlowStepRepository flowStepRepository;
    private final MvpLedgerRowRepository ledgerRowRepository;
    private final MvpCutItemRepository cutItemRepository;
    private final PlanPhaseRepository phaseRepository;
    private final TaskRepository taskRepository;
    private final TaskKeyService taskKeyService;
    private final TaskLabelRepository labelRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskAcceptanceItemRepository acceptanceRepository;
    private final TaskHistoryRepository historyRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final CheckpointService checkpointService;
    private final DemoSeedService demoSeedService;
    private final QaSeedService qaSeedService;
    private final ObjectMapper objectMapper;

    public PlanDownstreamSyncService(
            MvpStateRepository mvpStateRepository,
            MvpFlowStepRepository flowStepRepository,
            MvpLedgerRowRepository ledgerRowRepository,
            MvpCutItemRepository cutItemRepository,
            PlanPhaseRepository phaseRepository,
            TaskRepository taskRepository,
            TaskKeyService taskKeyService,
            TaskLabelRepository labelRepository,
            TaskDependencyRepository dependencyRepository,
            TaskAcceptanceItemRepository acceptanceRepository,
            TaskHistoryRepository historyRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            CheckpointService checkpointService,
            DemoSeedService demoSeedService,
            QaSeedService qaSeedService,
            ObjectMapper objectMapper) {
        this.mvpStateRepository = mvpStateRepository;
        this.flowStepRepository = flowStepRepository;
        this.ledgerRowRepository = ledgerRowRepository;
        this.cutItemRepository = cutItemRepository;
        this.phaseRepository = phaseRepository;
        this.taskRepository = taskRepository;
        this.taskKeyService = taskKeyService;
        this.labelRepository = labelRepository;
        this.dependencyRepository = dependencyRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.historyRepository = historyRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.checkpointService = checkpointService;
        this.demoSeedService = demoSeedService;
        this.qaSeedService = qaSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void savePlanDoc(Room room, String fileName, String content, User user) {
        UUID roomId = room.getId();
        String title = switch (fileName) {
            case "PRD.md" -> "Product Requirements Document";
            case "MVP.md" -> "Minimum Viable Product";
            case "TECH_STACK.md" -> "Tech Stack";
            case "ARCHITECTURE.md" -> "System Architecture";
            case "PHASES.md" -> "Project Phases";
            case "DESIGN.md" -> "Design Tokens & System";
            case "TASKS.md" -> "Board Tasks";
            case "DEMO_SCRIPT.md" -> "Demo Script";
            case "QNA.md" -> "Judge Q&A Preparation";
            default -> fileName;
        };

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseGet(() -> new Doc(roomId, fileName, title, 1));
        doc.setTitle(title);
        doc.setSource("PLAN");
        doc.setLastEditedBy(user != null ? user.getId() : null);
        doc.setUpdatedAt(Instant.now());
        doc = docRepository.save(doc);

        List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        int nextVer = versions.isEmpty() ? 1 : versions.get(0).getVersion() + 1;
        doc.setCurrentVersion(nextVer);
        docRepository.save(doc);

        docVersionRepository.save(new DocVersion(doc.getId(), nextVer, content, "Validated from plan step", user != null ? user.getId() : null));
    }

    @Transactional
    public void syncStep(Room room, String stepKey, Map<String, String> files, User user) {
        for (Map.Entry<String, String> entry : files.entrySet()) {
            savePlanDoc(room, entry.getKey(), entry.getValue(), user);
        }
        switch (stepKey.toLowerCase()) {
            case "prd" -> {
                String mvpMd = files.get("MVP.md");
                if (mvpMd != null) {
                    syncMvpFromMarkdown(room, mvpMd, user);
                }
            }
            case "phases" -> {
                String phasesMd = files.get("PHASES.md");
                if (phasesMd != null) {
                    syncPhasesFromMarkdown(room, phasesMd);
                }
            }
            case "tasks" -> {
                String tasksMd = files.get("TASKS.md");
                if (tasksMd != null) {
                    syncTasksFromMarkdown(room, tasksMd, user);
                }
            }
            case "demo" -> {
                String demoMd = files.get("DEMO_SCRIPT.md");
                String qnaMd = files.get("QNA.md");
                syncPitchKitFromMarkdown(room, demoMd, qnaMd);
            }
        }
    }

    @Transactional
    public void syncMvpFromMarkdown(Room room, String mvpMd, User user) {
        UUID roomId = room.getId();
        if (mvpMd == null || mvpMd.isBlank()) return;

        MvpState state = mvpStateRepository.findById(roomId).orElseGet(() -> new MvpState(roomId, "", ""));

        // 1. Wow moment
        String wow = extractSection(mvpMd, "## Wow moment");
        if (wow != null && !wow.isBlank()) {
            if (wow.length() > 400) wow = wow.substring(0, 397) + "...";
            state.setWow(wow.trim());
        }

        // 2. What breaks first
        String breaks = extractSection(mvpMd, "## What breaks first");
        if (breaks != null && !breaks.isBlank()) {
            state.setBreaksFirst(breaks.trim());
        }

        // 3. Differentiation
        String diff = extractSection(mvpMd, "## Differentiation");
        if (diff != null && !diff.isBlank()) {
            state.setDifferentiation(diff.trim());
        }

        // 4. Health checklist
        String health = extractSection(mvpMd, "## Health checklist");
        if (health != null) {
            state.setHealthRuns(health.contains("[x]"));
            state.setHealthStable(health.toLowerCase().contains("external service"));
            state.setHealthClear30(health.toLowerCase().contains("30 seconds"));
            state.setHealthWow60(health.toLowerCase().contains("first minute") || health.toLowerCase().contains("60 seconds"));
        }

        state.setLastEditedBy(user != null ? user.getId() : null);
        state.setUpdatedAt(Instant.now());
        mvpStateRepository.save(state);

        // 5. Core flow steps
        String flowSec = extractSection(mvpMd, "## Core flow");
        if (flowSec != null) {
            flowStepRepository.deleteByRoomId(roomId);
            int pos = 0;
            for (String line : flowSec.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.matches("^\\d+\\.\\s+.*")) {
                    String title = trimmed.replaceFirst("^\\d+\\.\\s+", "").trim();
                    if (!title.isEmpty()) {
                        if (title.length() > 120) title = title.substring(0, 117) + "...";
                        flowStepRepository.save(new MvpFlowStep(roomId, pos++, title, "PLANNED", null));
                    }
                }
            }
        }

        // 6. Reality ledger rows
        String ledgerSec = extractSection(mvpMd, "## Reality ledger");
        if (ledgerSec != null) {
            ledgerRowRepository.deleteByRoomId(roomId);
            int rowPos = 0;
            for (String line : ledgerSec.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.startsWith("|") && !trimmed.contains("---") && !trimmed.toLowerCase().contains("component")) {
                    String[] parts = trimmed.split("\\|");
                    if (parts.length >= 3) {
                        String comp = parts[1].trim();
                        String status = parts[2].trim();
                        String role = parts.length > 3 ? parts[3].trim() : "";
                        String notes = parts.length > 4 ? parts[4].trim() : "";
                        if (!comp.isEmpty()) {
                            ledgerRowRepository.save(new MvpLedgerRow(roomId, rowPos++, comp, normalizeLedgerStatus(status), null, null, notes));
                        }
                    }
                }
            }
        }

        // 7. Cut list
        String cutSec = extractSection(mvpMd, "## Cut list");
        if (cutSec != null) {
            cutItemRepository.deleteByRoomId(roomId);
            int cutPos = 0;
            for (String line : cutSec.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.matches("^\\d+\\.\\s+.*") || trimmed.startsWith("- ")) {
                    String text = trimmed.replaceFirst("^[\\d.-]+\\s+", "").trim();
                    if (!text.isEmpty()) {
                        cutItemRepository.save(new MvpCutItem(roomId, cutPos++, text, true));
                    }
                }
            }
        }
    }

    @Transactional
    public void reRenderMvpDocument(UUID roomId, User user) {
        MvpState state = mvpStateRepository.findById(roomId).orElse(null);
        if (state == null) return;

        Room room = roomRepository.findById(roomId).orElse(null);
        String projectName = room != null ? room.getName() : "Project";

        List<MvpFlowStep> flowSteps = flowStepRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<MvpLedgerRow> ledgerRows = ledgerRowRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<MvpCutItem> cutItems = cutItemRepository.findByRoomIdOrderByPositionAsc(roomId);

        StringBuilder sb = new StringBuilder();
        sb.append("# MVP: ").append(projectName).append("\n\n");

        sb.append("## Core flow\n");
        if (flowSteps.isEmpty()) {
            sb.append("1. Core application flow initialization\n");
        } else {
            for (int i = 0; i < flowSteps.size(); i++) {
                sb.append(i + 1).append(". ").append(flowSteps.get(i).getTitle()).append("\n");
            }
        }
        sb.append("\n");

        sb.append("## Wow moment\n");
        sb.append(state.getWow() != null && !state.getWow().isBlank() ? state.getWow() : "The primary wow demonstration moment.").append("\n\n");

        sb.append("## Reality ledger\n");
        sb.append("| Component | Status | Owner role | Notes |\n");
        sb.append("| --- | --- | --- | --- |\n");
        if (ledgerRows.isEmpty()) {
            sb.append("| Core Application | Built this weekend | Fullstack | Initial MVP build |\n");
        } else {
            for (MvpLedgerRow r : ledgerRows) {
                sb.append("| ").append(r.getPart()).append(" | ").append(r.getStatus()).append(" | Team | ").append(r.getNotes() != null ? r.getNotes() : "").append(" |\n");
            }
        }
        sb.append("\n");

        sb.append("## Scope\n");
        sb.append("### In\n- Core flow user journey and live demo data\n");
        sb.append("### Out\n- Extended backlog and non-essential third-party plugins\n\n");

        sb.append("## Cut list\n");
        if (cutItems.isEmpty()) {
            sb.append("1. Auxiliary analytics and secondary visual polish\n");
        } else {
            for (int i = 0; i < cutItems.size(); i++) {
                sb.append(i + 1).append(". ").append(cutItems.get(i).getText()).append("\n");
            }
        }
        sb.append("\n");

        sb.append("## Health checklist\n");
        sb.append("- [").append(state.isHealthRuns() ? "x" : " ").append("] Runs end to end\n");
        sb.append("- [").append(state.isHealthStable() ? "x" : " ").append("] Works with any external service failing\n");
        sb.append("- [").append(state.isHealthClear30() ? "x" : " ").append("] A judge understands it in 30 seconds\n");
        sb.append("- [").append(state.isHealthWow60() ? "x" : " ").append("] The wow moment lands inside the first minute\n\n");

        sb.append("## What breaks first\n");
        sb.append(state.getBreaksFirst() != null && !state.getBreaksFirst().isBlank() ? state.getBreaksFirst() : "Network latency during live API evaluation").append("\n\n");

        sb.append("## Differentiation\n");
        sb.append(state.getDifferentiation() != null && !state.getDifferentiation().isBlank() ? state.getDifferentiation() : "Purpose-built architecture tuned directly to event rubric criteria").append("\n");

        String content = sb.toString();

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, "MVP.md")
                .orElseGet(() -> new Doc(roomId, "MVP.md", "Minimum Viable Product", 1));
        doc.setLastEditedBy(user != null ? user.getId() : null);
        doc.setUpdatedAt(Instant.now());
        doc = docRepository.save(doc);

        List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        int nextVer = versions.isEmpty() ? 1 : versions.get(0).getVersion() + 1;
        doc.setCurrentVersion(nextVer);
        docRepository.save(doc);

        docVersionRepository.save(new DocVersion(doc.getId(), nextVer, content, "Updated via MVP Studio", user != null ? user.getId() : null));
    }

    @Transactional
    public void syncPhasesFromMarkdown(Room room, String phasesMd) {
        UUID roomId = room.getId();
        if (phasesMd == null || phasesMd.isBlank()) return;

        phaseRepository.deleteByRoomId(roomId);

        Pattern phaseHeader = Pattern.compile("###\\s+([A-Za-z0-9_-]+)\\s+-\\s+(.+)");
        Matcher matcher = phaseHeader.matcher(phasesMd);

        int pos = 0;
        int totalPhases = 0;
        while (matcher.find()) totalPhases++;

        matcher.reset();
        while (matcher.find()) {
            String phaseKey = matcher.group(1).trim();
            String phaseName = matcher.group(2).trim();

            int startPos = matcher.end();
            int endPos = phasesMd.length();
            // Next phase
            Matcher nextMatcher = phaseHeader.matcher(phasesMd);
            if (nextMatcher.find(startPos)) {
                endPos = nextMatcher.start();
            }
            String block = phasesMd.substring(startPos, endPos);

            String exitCp = "Phase completion verified";
            for (String line : block.split("\n")) {
                if (line.toLowerCase().contains("exit checkpoint:")) {
                    exitCp = line.substring(line.indexOf(":") + 1).trim();
                    break;
                }
            }

            double startPct = totalPhases > 0 ? (pos * 100.0) / totalPhases : 0.0;
            double endPct = totalPhases > 0 ? ((pos + 1) * 100.0) / totalPhases : 100.0;

            PlanPhase phase = new PlanPhase(
                    roomId,
                    phaseKey,
                    pos++,
                    phaseName,
                    BigDecimal.valueOf(startPct),
                    BigDecimal.valueOf(endPct),
                    exitCp,
                    "[]"
            );
            phaseRepository.save(phase);
        }

        // Checkpoint evaluation
        checkpointService.createForRoom(room);
    }

    @Transactional
    public void syncTasksFromMarkdown(Room room, String tasksMd, User user) {
        UUID roomId = room.getId();
        if (tasksMd == null || tasksMd.isBlank()) return;

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<String, UUID> handleToUserId = new HashMap<>();
        UUID leaderId = null;

        for (RoomMember m : members) {
            if ("leader".equalsIgnoreCase(m.getRole()) && leaderId == null) {
                leaderId = m.getUserId();
            }
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                if (u.getUsername() != null && !u.getUsername().isBlank()) {
                    handleToUserId.put("@" + u.getUsername().toLowerCase().trim(), u.getId());
                    handleToUserId.put(u.getUsername().toLowerCase().trim(), u.getId());
                }
                if (u.getLogin() != null && !u.getLogin().isBlank()) {
                    handleToUserId.put("@" + u.getLogin().toLowerCase().trim(), u.getId());
                    handleToUserId.put(u.getLogin().toLowerCase().trim(), u.getId());
                }
                if (u.getName() != null && !u.getName().isBlank()) {
                    handleToUserId.put("@" + u.getName().replaceAll("\\s+", "").toLowerCase().trim(), u.getId());
                }
            });
        }
        if (leaderId == null && !members.isEmpty()) {
            leaderId = members.get(0).getUserId();
        }

        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        Map<String, UUID> phaseKeyToId = new HashMap<>();
        for (PlanPhase p : phases) {
            phaseKeyToId.put(p.getPlanKey().toLowerCase(), p.getId());
        }

        // Only replace unstarted unconfirmed tasks if tasks already started
        List<Task> existingTasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
        boolean anyStarted = existingTasks.stream().anyMatch(t -> !"TODO".equalsIgnoreCase(t.getStatus()) || t.getConfirmedAt() != null || t.isConfirmedDone());

        if (anyStarted) {
            for (Task t : existingTasks) {
                if ("TODO".equalsIgnoreCase(t.getStatus()) && t.getConfirmedAt() == null && !t.isConfirmedDone()) {
                    dependencyRepository.deleteByTaskId(t.getId());
                    acceptanceRepository.deleteByTaskId(t.getId());
                    labelRepository.deleteByTaskId(t.getId());
                    historyRepository.deleteByTaskId(t.getId());
                    taskRepository.delete(t);
                }
            }
        } else {
            for (Task t : existingTasks) {
                dependencyRepository.deleteByTaskId(t.getId());
                acceptanceRepository.deleteByTaskId(t.getId());
                labelRepository.deleteByTaskId(t.getId());
                historyRepository.deleteByTaskId(t.getId());
                taskRepository.delete(t);
            }
        }

        // Parse TASKS.md
        Pattern taskHeader = Pattern.compile("###\\s+(T-\\d{3})\\s+-\\s+(.+)");
        Matcher m = taskHeader.matcher(tasksMd);

        Map<String, Task> createdTasksMap = new HashMap<>();
        Map<String, List<String>> taskDependenciesMap = new HashMap<>();
        int position = 0;

        Instant eventStart = room.getEventStart() != null ? room.getEventStart() : Instant.now();
        Instant eventEnd = room.getEventEnd() != null ? room.getEventEnd() : eventStart.plus(Duration.ofHours(36));

        while (m.find()) {
            String taskKeyFromDoc = m.group(1).trim();
            String taskTitle = m.group(2).trim();
            if (taskTitle.length() > 140) taskTitle = taskTitle.substring(0, 137) + "...";

            int start = m.end();
            int end = tasksMd.length();
            Matcher next = taskHeader.matcher(tasksMd);
            if (next.find(start)) {
                end = next.start();
            }
            String block = tasksMd.substring(start, end);

            String phaseIdStr = extractLineValue(block, "- Phase:");
            String type = extractLineValue(block, "- Type:");
            String role = extractLineValue(block, "- Role:");
            String assigneeStr = extractLineValue(block, "- Assignee:");
            String estStr = extractLineValue(block, "- Estimate:");
            String prioStr = extractLineValue(block, "- Priority:");
            String depsStr = extractLineValue(block, "- Depends on:");
            String desc = extractMultiLine(block, "- Description:", "- Acceptance:");
            List<String> acceptanceLines = extractAcceptanceLines(block);

            UUID phaseUuid = phaseIdStr != null ? phaseKeyToId.get(phaseIdStr.toLowerCase()) : null;
            UUID assigneeId = null;
            if (assigneeStr != null && !assigneeStr.equalsIgnoreCase("UNASSIGNED")) {
                assigneeId = handleToUserId.get(assigneeStr.toLowerCase().trim());
            }

            int estMin = 120;
            if (estStr != null) {
                try {
                    String num = estStr.replaceAll("[^0-9.]", "");
                    double hours = Double.parseDouble(num);
                    estMin = (int) (hours * 60);
                } catch (Exception ignored) {}
            }

            String prio = "MEDIUM";
            if (prioStr != null) {
                if (prioStr.contains("P0")) prio = "HIGH";
                else if (prioStr.contains("P2")) prio = "LOW";
            }

            TaskKeyService.TaskKeyResult keyResult = taskKeyService.nextKeyResult(room);
            Task task = new Task(
                    roomId,
                    keyResult.key(),
                    keyResult.number(),
                    taskTitle,
                    desc != null ? desc : "",
                    "TODO",
                    assigneeId,
                    leaderId,
                    prio,
                    phaseUuid,
                    role != null ? role : "Engineering",
                    estMin,
                    eventEnd,
                    position++,
                    "PLAN"
            );
            task = taskRepository.save(task);
            createdTasksMap.put(taskKeyFromDoc, task);

            if (role != null && !role.isBlank()) {
                labelRepository.save(new TaskLabel(task.getId(), role));
            }
            if (type != null && !type.isBlank()) {
                labelRepository.save(new TaskLabel(task.getId(), type));
            }

            int accPos = 0;
            for (String crit : acceptanceLines) {
                acceptanceRepository.save(new TaskAcceptanceItem(task.getId(), crit, false, accPos++));
            }

            historyRepository.save(new TaskHistory(task.getId(), user != null ? user.getId() : leaderId, "Created from validated TASKS.md"));

            if (depsStr != null && !depsStr.equalsIgnoreCase("none")) {
                List<String> depKeys = Arrays.stream(depsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && !s.equalsIgnoreCase("none"))
                        .toList();
                taskDependenciesMap.put(taskKeyFromDoc, depKeys);
            }
        }

        // Create Task Dependencies
        for (Map.Entry<String, List<String>> entry : taskDependenciesMap.entrySet()) {
            Task task = createdTasksMap.get(entry.getKey());
            if (task == null) continue;

            for (String depKey : entry.getValue()) {
                Task depTask = createdTasksMap.get(depKey);
                if (depTask != null && !depTask.getId().equals(task.getId())) {
                    dependencyRepository.save(new TaskDependency(task.getId(), depTask.getId(), roomId));
                }
            }
        }
    }

    @Transactional
    public void syncPitchKitFromMarkdown(Room room, String demoScriptMd, String qnaMd) {
        if (demoScriptMd != null && !demoScriptMd.isBlank()) {
            demoSeedService.seedFromPlan(room);
        }
        if (qnaMd != null && !qnaMd.isBlank()) {
            qaSeedService.seedFromPlan(room);
        }
    }

    private String extractSection(String md, String heading) {
        int start = md.indexOf(heading);
        if (start < 0) return null;
        int nextH2 = md.indexOf("## ", start + heading.length());
        if (nextH2 < 0) nextH2 = md.length();
        return md.substring(start + heading.length(), nextH2).trim();
    }

    private String extractLineValue(String block, String label) {
        for (String line : block.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith(label)) {
                return trimmed.substring(label.length()).trim();
            }
        }
        return null;
    }

    private String extractMultiLine(String block, String startLabel, String endLabel) {
        int start = block.indexOf(startLabel);
        if (start < 0) return "";
        int end = block.indexOf(endLabel, start + startLabel.length());
        if (end < 0) end = block.length();
        return block.substring(start + startLabel.length(), end).trim();
    }

    private List<String> extractAcceptanceLines(String block) {
        List<String> list = new ArrayList<>();
        int accIdx = block.indexOf("- Acceptance:");
        if (accIdx < 0) return list;

        String sub = block.substring(accIdx + "- Acceptance:".length());
        for (String line : sub.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("- ")) {
                list.add(trimmed.substring(2).trim());
            } else if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
                break;
            }
        }
        return list;
    }

    private String normalizeLedgerStatus(String status) {
        if (status == null) return "PLANNED";
        String s = status.toUpperCase();
        if (s.contains("BUILT")) return "BUILT";
        if (s.contains("MOCK")) return "MOCKED";
        if (s.contains("EXIST") || s.contains("LIB") || s.contains("API")) return "EXISTING";
        return "PLANNED";
    }
}
