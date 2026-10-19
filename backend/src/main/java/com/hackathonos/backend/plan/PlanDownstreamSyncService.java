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
        savePlanDoc(room, fileName, content, user, null);
    }

    @Transactional
    public void savePlanDoc(Room room, String fileName, String content, User user, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
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

        String safeContent = DefensiveParserUtils.defensivelyTrim(content, 400_000, fileName, warnConsumer);
        String safeTitle = DefensiveParserUtils.trimAtWordBoundary(title, 2000);

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, fileName)
                .orElseGet(() -> new Doc(roomId, fileName, safeTitle, 1));
        doc.setTitle(safeTitle);
        doc.setSource("PLAN");
        doc.setLastEditedBy(user != null ? user.getId() : null);
        doc.setUpdatedAt(Instant.now());
        doc = docRepository.save(doc);

        List<DocVersion> versions = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
        int nextVer = versions.isEmpty() ? 1 : versions.get(0).getVersion() + 1;
        doc.setCurrentVersion(nextVer);
        docRepository.save(doc);

        docVersionRepository.save(new DocVersion(doc.getId(), nextVer, safeContent, "Validated from plan step", user != null ? user.getId() : null));
    }

    @Transactional
    public void syncStep(Room room, String stepKey, Map<String, String> files, User user) {
        syncStep(room, stepKey, files, user, null);
    }

    @Transactional
    public void syncStep(Room room, String stepKey, Map<String, String> files, User user, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
        for (Map.Entry<String, String> entry : files.entrySet()) {
            savePlanDoc(room, entry.getKey(), entry.getValue(), user, warnConsumer);
        }
        switch (stepKey.toLowerCase()) {
            case "prd", "prd-mvp" -> {
                String mvpMd = files.get("MVP.md");
                if (mvpMd != null) {
                    syncMvpFromMarkdown(room, mvpMd, user, warnConsumer);
                }
            }
            case "phases", "phases-design" -> {
                String phasesMd = files.get("PHASES.md");
                if (phasesMd != null) {
                    syncPhasesFromMarkdown(room, phasesMd, warnConsumer);
                }
            }
            case "tasks" -> {
                String tasksMd = files.get("TASKS.md");
                if (tasksMd != null) {
                    syncTasksFromMarkdown(room, tasksMd, user, warnConsumer);
                }
            }
            case "demo", "demo-qna" -> {
                String demoMd = files.get("DEMO_SCRIPT.md");
                String qnaMd = files.get("QNA.md");
                syncPitchKitFromMarkdown(room, demoMd, qnaMd, warnConsumer);
            }
        }
    }

    @Transactional
    public void syncMvpFromMarkdown(Room room, String mvpMd, User user) {
        syncMvpFromMarkdown(room, mvpMd, user, null);
    }

    @Transactional
    public void syncMvpFromMarkdown(Room room, String mvpMd, User user, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
        UUID roomId = room.getId();
        if (mvpMd == null || mvpMd.isBlank()) return;

        MvpState state = mvpStateRepository.findById(roomId).orElseGet(() -> new MvpState(roomId, "", ""));

        // 1. Wow moment
        String wow = extractSection(mvpMd, "## Wow moment");
        if (wow != null && !wow.isBlank()) {
            wow = DefensiveParserUtils.defensivelyTrim(wow.trim(), 4000, "MVP.md", warnConsumer);
            state.setWow(wow);
        }

        // 2. What breaks first
        String breaks = extractSection(mvpMd, "## What breaks first");
        if (breaks != null && !breaks.isBlank()) {
            breaks = DefensiveParserUtils.defensivelyTrim(breaks.trim(), 4000, "MVP.md", warnConsumer);
            state.setBreaksFirst(breaks);
        }

        // 3. Differentiation
        String diff = extractSection(mvpMd, "## Differentiation");
        if (diff != null && !diff.isBlank()) {
            diff = DefensiveParserUtils.defensivelyTrim(diff.trim(), 4000, "MVP.md", warnConsumer);
            state.setDifferentiation(diff);
        }

        // 4. Health checklist
        String health = extractSection(mvpMd, "## Health checklist");
        if (health != null) {
            boolean runs = false;
            boolean stable = false;
            boolean clear30 = false;
            boolean wow60 = false;
            for (String line : health.split("\n")) {
                String trimmed = line.trim().toLowerCase();
                boolean isChecked = trimmed.contains("[x]");
                if (trimmed.contains("runs end to end") || trimmed.contains("walk the core flow")) {
                    runs = isChecked;
                } else if (trimmed.contains("external service") || trimmed.contains("flaky")) {
                    stable = isChecked;
                } else if (trimmed.contains("30 seconds") || trimmed.contains("30s")) {
                    clear30 = isChecked;
                } else if (trimmed.contains("first minute") || trimmed.contains("60 seconds") || trimmed.contains("wow moment")) {
                    wow60 = isChecked;
                }
            }
            state.setHealthRuns(runs);
            state.setHealthStable(stable);
            state.setHealthClear30(clear30);
            state.setHealthWow60(wow60);
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
                        title = DefensiveParserUtils.defensivelyTrim(title, 2000, "MVP.md", warnConsumer);
                        flowStepRepository.save(new MvpFlowStep(roomId, pos++, title, "NOT_YET", null));
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
                            comp = DefensiveParserUtils.defensivelyTrim(comp, 2000, "MVP.md", warnConsumer);
                            notes = DefensiveParserUtils.defensivelyTrim(notes, 2000, "MVP.md", warnConsumer);
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
                        text = DefensiveParserUtils.defensivelyTrim(text, 2000, "MVP.md", warnConsumer);
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
        syncPhasesFromMarkdown(room, phasesMd, null);
    }

    private record ParsedPhase(
            String phaseKey,
            String phaseName,
            Double sHour,
            Double eHour,
            String goal,
            String exitCp,
            String owners,
            String deliverables,
            String rawMarkdown
    ) {}

    @Transactional
    public void syncPhasesFromMarkdown(Room room, String phasesMd, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
        UUID roomId = room.getId();
        if (phasesMd == null || phasesMd.isBlank()) return;

        // 1. Parser: only read inside the "Phases" H2 section
        String phasesSection = "";
        Matcher sectionMatcher = Pattern.compile("(?im)^##\\s+.*Phases.*$").matcher(phasesMd);
        if (sectionMatcher.find()) {
            int start = sectionMatcher.end();
            Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(phasesMd);
            int end = phasesMd.length();
            if (nextH2.find(start)) {
                end = nextH2.start();
            }
            phasesSection = phasesMd.substring(start, end);
        } else {
            phasesSection = phasesMd;
        }

        // Only read H3 headings of the form "### P<number> - Name" (also "P1:" and "P1 -" with any dash)
        Pattern phaseHeader = Pattern.compile("(?im)^###\\s*(?:P|Phase\\s*)(\\d+)\\s*[-:—–.]?\\s*(.*)$");
        Matcher matcher = phaseHeader.matcher(phasesSection);

        List<ParsedPhase> parsedList = new ArrayList<>();
        while (matcher.find()) {
            int headerStart = matcher.start();
            String pNum = matcher.group(1).trim();
            String phaseKey = "P" + pNum;
            String phaseName = matcher.group(2).replaceAll("[*_]", "").trim();
            phaseName = DefensiveParserUtils.defensivelyTrim(phaseName, 2000, "PHASES.md", warnConsumer);

            int startPos = matcher.end();
            int endPos = phasesSection.length();
            Matcher nextMatcher = phaseHeader.matcher(phasesSection);
            if (nextMatcher.find(startPos)) {
                endPos = nextMatcher.start();
            }
            String block = phasesSection.substring(startPos, endPos);
            String rawMarkdown = phasesSection.substring(headerStart, endPos).trim();

            Double sHour = null;
            Double eHour = null;
            String goal = null;
            String exitCp = "Phase completion verified";
            String owners = "[]";

            String[] lines = block.split("\n");
            StringBuilder deliverablesBuilder = new StringBuilder();
            boolean inDeliverables = false;

            for (String rawLine : lines) {
                String line = rawLine.trim();
                String lower = line.toLowerCase();

                if (lower.startsWith("- hours:") || lower.startsWith("hours:")) {
                    inDeliverables = false;
                    String val = line.substring(line.indexOf(":") + 1).trim();
                    Matcher hm = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:h|hours?)?\\s*[-–—to]+\\s*(\\d+(?:\\.\\d+)?)\\s*(?:h|hours?)?", Pattern.CASE_INSENSITIVE).matcher(val);
                    if (hm.find()) {
                        try {
                            sHour = Double.parseDouble(hm.group(1));
                            eHour = Double.parseDouble(hm.group(2));
                        } catch (Exception ignored) {}
                    }
                } else if (lower.startsWith("- goal:") || lower.startsWith("goal:")) {
                    inDeliverables = false;
                    goal = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- exit checkpoint:") || lower.startsWith("exit checkpoint:")) {
                    inDeliverables = false;
                    exitCp = line.substring(line.indexOf(":") + 1).trim();
                } else if (lower.startsWith("- owners:") || lower.startsWith("owners:")) {
                    inDeliverables = false;
                    String rawOwners = line.substring(line.indexOf(":") + 1).trim();
                    List<String> ownerList = new ArrayList<>();
                    Matcher om = Pattern.compile("@[a-zA-Z0-9_.-]+").matcher(rawOwners);
                    while (om.find()) {
                        ownerList.add(om.group());
                    }
                    if (ownerList.isEmpty() && !rawOwners.isBlank()) {
                        for (String part : rawOwners.split("[,;]")) {
                            String p = part.trim();
                            if (!p.isBlank()) ownerList.add(p.startsWith("@") ? p : "@" + p);
                        }
                    }
                    try {
                        owners = objectMapper.writeValueAsString(ownerList);
                    } catch (Exception e) {
                        owners = "[]";
                    }
                } else if (lower.startsWith("- deliverables:") || lower.startsWith("deliverables:")) {
                    inDeliverables = true;
                    String rest = line.substring(line.indexOf(":") + 1).trim();
                    if (!rest.isBlank()) deliverablesBuilder.append(rest).append("\n");
                } else if (inDeliverables) {
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                        deliverablesBuilder.append(line).append("\n");
                    } else if (line.isBlank()) {
                        // ignore empty lines
                    } else {
                        inDeliverables = false;
                    }
                }
            }

            String deliverables = deliverablesBuilder.toString().trim();
            exitCp = DefensiveParserUtils.defensivelyTrim(exitCp, 2000, "PHASES.md", warnConsumer);
            if (goal != null) goal = DefensiveParserUtils.defensivelyTrim(goal, 4000, "PHASES.md", warnConsumer);

            parsedList.add(new ParsedPhase(phaseKey, phaseName, sHour, eHour, goal, exitCp, owners, deliverables, rawMarkdown));
        }

        // 2. Replace template-default phases in the same transaction, only if old ones have no tasks (otherwise map them by order)
        List<PlanPhase> existingPhases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<Task> allRoomTasks = taskRepository.findByRoomId(roomId);
        boolean oldPhasesHaveTasks = allRoomTasks.stream().anyMatch(t -> t.getPhaseId() != null || (t.getPhaseKey() != null && !t.getPhaseKey().isBlank()));

        if (!oldPhasesHaveTasks) {
            phaseRepository.deleteByRoomId(roomId);
            phaseRepository.flush();
            existingPhases = new ArrayList<>();
        }

        double duration = room.getDurationHours() > 0 ? room.getDurationHours() : 36.0;
        boolean hasInvalidHours = parsedList.stream().anyMatch(p -> p.sHour() == null || p.eHour() == null || p.eHour() <= p.sHour());
        int totalPhases = parsedList.size();
        double step = totalPhases > 0 ? duration / totalPhases : duration;

        boolean isBuildStage = "build".equalsIgnoreCase(room.getStage()) || "BUILD".equalsIgnoreCase(room.getWorkflowStage());

        for (int pos = 0; pos < totalPhases; pos++) {
            ParsedPhase pp = parsedList.get(pos);
            double sH = (!hasInvalidHours && pp.sHour() != null) ? pp.sHour() : (pos * step);
            double eH = (!hasInvalidHours && pp.eHour() != null) ? pp.eHour() : ((pos + 1) * step);

            double startPct = duration > 0 ? (sH / duration) * 100.0 : 0.0;
            double endPct = duration > 0 ? (eH / duration) * 100.0 : 100.0;

            PlanPhase phase;
            if (pos < existingPhases.size()) {
                phase = existingPhases.get(pos);
                phase.setPlanKey(pp.phaseKey());
                phase.setPosition(pos);
                phase.setName(pp.phaseName());
                phase.setStartPct(BigDecimal.valueOf(startPct));
                phase.setEndPct(BigDecimal.valueOf(endPct));
                phase.setExitCheckpoint(pp.exitCp());
                phase.setOwners(pp.owners());
            } else {
                phase = new PlanPhase(
                        roomId,
                        pp.phaseKey(),
                        pos,
                        pp.phaseName(),
                        BigDecimal.valueOf(startPct),
                        BigDecimal.valueOf(endPct),
                        pp.exitCp(),
                        pp.owners()
                );
            }
            phase.setStartHour(BigDecimal.valueOf(sH));
            phase.setEndHour(BigDecimal.valueOf(eH));
            phase.setGoal(pp.goal());
            phase.setOwners(pp.owners());
            phase.setDeliverables(pp.deliverables());
            phase.setRawMarkdown(pp.rawMarkdown());

            if (isBuildStage && pos == 0) {
                phase.setStatus("ACTIVE");
                if (phase.getActivatedAt() == null) {
                    phase.setActivatedAt(Instant.now());
                }
            } else if (phase.getStatus() == null || (!"ACTIVE".equals(phase.getStatus()) && !"COMPLETED".equals(phase.getStatus()))) {
                phase.setStatus("NOT_STARTED");
            }
            phaseRepository.save(phase);
        }

        // Delete any excess existing phases that have no tasks
        if (existingPhases.size() > totalPhases) {
            for (int i = totalPhases; i < existingPhases.size(); i++) {
                PlanPhase excess = existingPhases.get(i);
                boolean hasTasksForPhase = allRoomTasks.stream().anyMatch(t ->
                        (t.getPhaseId() != null && t.getPhaseId().equals(excess.getId())) ||
                        (excess.getPlanKey() != null && excess.getPlanKey().equalsIgnoreCase(t.getPhaseKey())));
                if (!hasTasksForPhase) {
                    phaseRepository.delete(excess);
                }
            }
        }

        // Checkpoint evaluation
        checkpointService.createForRoom(room);
    }

    @Transactional
    public void syncTasksFromMarkdown(Room room, String tasksMd, User user) {
        syncTasksFromMarkdown(room, tasksMd, user, null);
    }

    @Transactional
    public void syncTasksFromMarkdown(Room room, String tasksMd, User user, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
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
            phaseKeyToId.put(p.getPlanKey().toLowerCase().trim(), p.getId());
            String pk = p.getPlanKey().toLowerCase().trim();
            if (pk.startsWith("p")) {
                phaseKeyToId.put("phase " + pk.substring(1), p.getId());
                phaseKeyToId.put("phase" + pk.substring(1), p.getId());
                phaseKeyToId.put(pk.substring(1), p.getId());
            }
        }

        // Only replace unstarted unconfirmed tasks if tasks already started
        List<Task> existingTasks = taskRepository.findByRoomIdAndSource(roomId, "PLAN");
        boolean anyStarted = existingTasks.stream().anyMatch(t -> !"TODO".equalsIgnoreCase(t.getStatus()) || t.getConfirmedAt() != null || t.isConfirmedDone());

        if (anyStarted) {
            for (Task t : existingTasks) {
                if ("TODO".equalsIgnoreCase(t.getStatus()) && t.getConfirmedAt() == null && !t.isConfirmedDone()) {
                    dependencyRepository.deleteByTaskId(t.getId());
                    dependencyRepository.deleteByDependsOnTaskId(t.getId());
                    acceptanceRepository.deleteByTaskId(t.getId());
                    labelRepository.deleteByTaskId(t.getId());
                    historyRepository.deleteByTaskId(t.getId());
                    taskRepository.delete(t);
                }
            }
        } else {
            for (Task t : existingTasks) {
                dependencyRepository.deleteByTaskId(t.getId());
                dependencyRepository.deleteByDependsOnTaskId(t.getId());
                acceptanceRepository.deleteByTaskId(t.getId());
                labelRepository.deleteByTaskId(t.getId());
                historyRepository.deleteByTaskId(t.getId());
                taskRepository.delete(t);
            }
        }

        // Parse TASKS.md
        Pattern taskHeader = Pattern.compile("(?im)^###\\s*[*_]*(T-\\d{3})[*_]*\\s*[-:—–]?\\s*(.*)$");
        Matcher m = taskHeader.matcher(tasksMd);

        Map<String, Task> createdTasksMap = new HashMap<>();
        Map<String, List<String>> taskDependenciesMap = new HashMap<>();
        int position = 0;

        Instant eventStart = room.getEventStart() != null ? room.getEventStart() : Instant.now();
        Instant eventEnd = room.getEventEnd() != null ? room.getEventEnd() : eventStart.plus(Duration.ofHours(36));

        while (m.find()) {
            String taskKeyFromDoc = m.group(1).trim().toUpperCase();
            String rawTaskTitle = m.group(2).replaceAll("[*_]", "").trim();
            String taskTitle = DefensiveParserUtils.defensivelyTrim(rawTaskTitle, 200, "TASKS.md", warnConsumer);
            if (taskTitle.isBlank()) {
                taskTitle = "Task " + taskKeyFromDoc;
            }

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
            desc = DefensiveParserUtils.defensivelyTrim(desc != null ? desc : "", 4000, "TASKS.md", warnConsumer);
            List<String> acceptanceLines = extractAcceptanceLines(block);

            UUID phaseUuid = null;
            if (phaseIdStr != null) {
                String cleanPhase = phaseIdStr.replaceAll("[*_]", "").toLowerCase().trim();
                phaseUuid = phaseKeyToId.get(cleanPhase);
                if (phaseUuid == null) {
                    Matcher numM = Pattern.compile("\\d+").matcher(cleanPhase);
                    if (numM.find()) {
                        phaseUuid = phaseKeyToId.get("p" + numM.group());
                    }
                }
            }
            if (phaseUuid == null && !phases.isEmpty()) {
                phaseUuid = phases.get(0).getId();
            }

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
            while (taskRepository.findByRoomIdAndTaskKey(roomId, keyResult.key()).isPresent()) {
                keyResult = taskKeyService.nextKeyResult(room);
            }

            String safeRole = role != null && !role.isBlank()
                    ? DefensiveParserUtils.trimAtWordBoundary(role.trim(), 50)
                    : "Engineering";

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
                    safeRole,
                    estMin,
                    eventEnd,
                    position++,
                    "PLAN"
            );
            task = taskRepository.save(task);
            createdTasksMap.put(taskKeyFromDoc, task);

            Set<String> savedLabels = new HashSet<>();
            if (role != null && !role.isBlank()) {
                String cleanRole = DefensiveParserUtils.trimAtWordBoundary(role.trim(), 50);
                if (!cleanRole.isBlank() && savedLabels.add(cleanRole.toLowerCase())) {
                    labelRepository.save(new TaskLabel(task.getId(), cleanRole));
                }
            }
            if (type != null && !type.isBlank()) {
                String cleanType = DefensiveParserUtils.trimAtWordBoundary(type.trim(), 50);
                if (!cleanType.isBlank() && savedLabels.add(cleanType.toLowerCase())) {
                    labelRepository.save(new TaskLabel(task.getId(), cleanType));
                }
            }

            int accPos = 0;
            for (String crit : acceptanceLines) {
                crit = DefensiveParserUtils.defensivelyTrim(crit, 500, "TASKS.md", warnConsumer);
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
        Set<String> addedDepPairs = new HashSet<>();
        for (Map.Entry<String, List<String>> entry : taskDependenciesMap.entrySet()) {
            Task task = createdTasksMap.get(entry.getKey());
            if (task == null) continue;

            for (String depKey : entry.getValue()) {
                String cleanDep = depKey.trim().toUpperCase();
                Task depTask = createdTasksMap.get(cleanDep);
                if (depTask != null && !depTask.getId().equals(task.getId())) {
                    String pair = task.getId() + "->" + depTask.getId();
                    if (addedDepPairs.add(pair)) {
                        dependencyRepository.save(new TaskDependency(task.getId(), depTask.getId(), roomId));
                    }
                }
            }
        }
    }

    @Transactional
    public void syncPitchKitFromMarkdown(Room room, String demoScriptMd, String qnaMd) {
        syncPitchKitFromMarkdown(room, demoScriptMd, qnaMd, null);
    }

    @Transactional
    public void syncPitchKitFromMarkdown(Room room, String demoScriptMd, String qnaMd, java.util.function.Consumer<com.hackathonos.backend.plan.dto.ValidationIssueDto> warnConsumer) {
        if (demoScriptMd != null && !demoScriptMd.isBlank()) {
            demoSeedService.seedFromPlan(room, warnConsumer);
        }
        if (qnaMd != null && !qnaMd.isBlank()) {
            qaSeedService.seedFromPlan(room, warnConsumer);
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
        String cleanLabel = label.replaceAll("[-*\\s:]", "").toLowerCase();
        for (String line : block.split("\n")) {
            String trimmed = line.trim();
            String normLine = trimmed.replaceAll("[-*\\s]", "").toLowerCase();
            if (normLine.startsWith(cleanLabel + ":")) {
                int colon = trimmed.indexOf(":");
                if (colon >= 0) {
                    return trimmed.substring(colon + 1).replaceAll("[*_]", "").trim();
                }
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
        Pattern p = Pattern.compile("(?im)^[-*\\s]*[*_]*acceptance[*_]*:\\s*(.*)$");
        Matcher m = p.matcher(block);
        if (!m.find()) return list;

        int accIdx = m.end();
        String inline = m.group(1).trim();
        if (!inline.isBlank() && !inline.startsWith("-") && !inline.startsWith("*")) {
            list.add(inline.replaceAll("[*_]", "").trim());
        }

        String sub = block.substring(accIdx);
        for (String line : sub.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.matches("^\\d+\\.\\s+.*")) {
                String clean = trimmed.replaceAll("^[-*\\d.]+\\s+", "").replaceAll("[*_]", "").trim();
                if (!clean.isBlank()) list.add(clean);
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
