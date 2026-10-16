package com.hackathonos.backend.plan;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.files.FileTextExtractor;
import com.hackathonos.backend.plan.dto.PlanCompletionSummaryDto;
import com.hackathonos.backend.plan.dto.ValidatePlanResponse;
import com.hackathonos.backend.plan.dto.ValidatedFileDto;
import com.hackathonos.backend.plan.dto.ValidationDiagnosticsDto;
import com.hackathonos.backend.plan.dto.ValidationIssueDto;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PlanValidationService {

    private static final Logger log = LoggerFactory.getLogger(PlanValidationService.class);

    public static final Map<String, List<String>> STEP_EXPECTED_FILES = Map.of(
            "prd-mvp", List.of("PRD.md", "MVP.md"),
            "prd", List.of("PRD.md", "MVP.md"),
            "stack-arch", List.of("TECH_STACK.md", "ARCHITECTURE.md"),
            "tech", List.of("TECH_STACK.md", "ARCHITECTURE.md"),
            "phases-design", List.of("PHASES.md", "DESIGN.md"),
            "phases", List.of("PHASES.md", "DESIGN.md"),
            "demo-qna", List.of("DEMO_SCRIPT.md", "QNA.md"),
            "demo", List.of("DEMO_SCRIPT.md", "QNA.md")
    );

    public static final Map<String, Set<String>> CRITICAL_HEADINGS = Map.of(
            "PRD.md", Set.of("functional requirements"),
            "MVP.md", Set.of("core flow", "reality ledger"),
            "TECH_STACK.md", Set.of("decision summary"),
            "ARCHITECTURE.md", Set.of("core flow sequence", "api contract"),
            "PHASES.md", Set.of("phases"),
            "DESIGN.md", Set.of("design tokens", "key screens"),
            "TASKS.md", Set.of("tasks"),
            "DEMO_SCRIPT.md", Set.of("script"),
            "QNA.md", Set.of("questions")
    );

    private static final Map<String, List<String>> HEADING_SYNONYMS = Map.ofEntries(
            Map.entry("functional requirements", List.of("requirements", "functional specs", "features", "requirements fr", "core requirements")),
            Map.entry("core flow", List.of("core user flow", "main flow", "primary flow", "user flow")),
            Map.entry("reality ledger", List.of("ledger", "feasibility ledger", "build vs mock ledger")),
            Map.entry("decision summary", List.of("tech decisions", "stack decisions", "technology choices")),
            Map.entry("core flow sequence", List.of("sequence diagram", "flow sequence", "architecture flow")),
            Map.entry("api contract", List.of("api endpoints", "api spec", "endpoints", "api design")),
            Map.entry("phases", List.of("project phases", "phase breakdown", "timeline phases")),
            Map.entry("design tokens", List.of("tokens", "design system tokens", "theme tokens")),
            Map.entry("key screens", List.of("screens", "core screens", "ui screens")),
            Map.entry("tasks", List.of("task list", "board tasks", "work items")),
            Map.entry("script", List.of("demo script", "demo flow", "pitch script", "presentation script")),
            Map.entry("questions", List.of("q&a", "judge questions", "questions and answers", "q and a"))
    );

    private static final Pattern FILE_MARKER = Pattern.compile("(?im)^[#*=\\s]*FILE:\\s*([A-Za-z0-9_.-]+)[#*=\\s]*$");
    private static final Pattern END_MARKER = Pattern.compile("(?im)^[#*=\\s]*END(?: FILE)?[#*=\\s]*$");
    private static final Pattern H2_PATTERN = Pattern.compile("(?m)^##\\s+(.+)$");

    private final ObjectMapper objectMapper;
    private final RoomAccess roomAccess;
    private final PlanStepRepository planStepRepository;
    private final PlanDownstreamSyncService planDownstreamSyncService;
    private final PlanCompletionService planCompletionService;
    private final PlanPromptService planPromptService;
    private final ObjectProvider<PlanPrepareService> planPrepareServiceProvider;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final RoomEventService roomEventService;
    private final ActivityLogger activityLogger;

    private final com.hackathonos.backend.files.FileTextExtractor fileTextExtractor;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final Map<String, PlanDocumentParser.HeadingConfig> headingConfigs = new HashMap<>();

    public PlanValidationService(
            ObjectMapper objectMapper,
            RoomAccess roomAccess,
            PlanStepRepository planStepRepository,
            PlanDownstreamSyncService planDownstreamSyncService,
            PlanCompletionService planCompletionService,
            PlanPromptService planPromptService,
            ObjectProvider<PlanPrepareService> planPrepareServiceProvider,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            RoomEventService roomEventService,
            ActivityLogger activityLogger,
            com.hackathonos.backend.files.FileTextExtractor fileTextExtractor) {
        this(objectMapper, roomAccess, planStepRepository, planDownstreamSyncService, planCompletionService,
                planPromptService, planPrepareServiceProvider, briefRepository, rubricRepository, ideaRepository,
                memberRepository, skillRepository, userRepository, roomEventService, activityLogger,
                fileTextExtractor, (ObjectProvider<org.springframework.transaction.PlatformTransactionManager>) null);
    }

    @Autowired
    public PlanValidationService(
            ObjectMapper objectMapper,
            RoomAccess roomAccess,
            PlanStepRepository planStepRepository,
            PlanDownstreamSyncService planDownstreamSyncService,
            PlanCompletionService planCompletionService,
            PlanPromptService planPromptService,
            ObjectProvider<PlanPrepareService> planPrepareServiceProvider,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            RoomEventService roomEventService,
            ActivityLogger activityLogger,
            com.hackathonos.backend.files.FileTextExtractor fileTextExtractor,
            ObjectProvider<org.springframework.transaction.PlatformTransactionManager> transactionManagerProvider) {
        this.objectMapper = objectMapper;
        this.roomAccess = roomAccess;
        this.planStepRepository = planStepRepository;
        this.planDownstreamSyncService = planDownstreamSyncService;
        this.planCompletionService = planCompletionService;
        this.planPromptService = planPromptService;
        this.planPrepareServiceProvider = planPrepareServiceProvider;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.roomEventService = roomEventService;
        this.activityLogger = activityLogger;
        this.fileTextExtractor = fileTextExtractor;
        org.springframework.transaction.PlatformTransactionManager tm = transactionManagerProvider != null ? transactionManagerProvider.getIfAvailable() : null;
        this.transactionTemplate = tm != null ? new org.springframework.transaction.support.TransactionTemplate(tm) : null;
    }

    @PostConstruct
    public void init() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource res = resolver.getResource("classpath:plan-prompts/plan-headings.json");
            try (InputStream is = res.getInputStream()) {
                String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, PlanDocumentParser.HeadingConfig> map = objectMapper.readValue(json, new TypeReference<>() {});
                headingConfigs.putAll(map);
            }
        } catch (Exception e) {
            log.warn("Failed to load plan-headings.json in PlanValidationService: {}", e.getMessage());
        }
    }

    public ValidatePlanResponse validateStepMultipart(
            UUID roomId,
            String stepIdentifier,
            List<MultipartFile> files,
            boolean confirm,
            User user
    ) {
        return validateStepMultipart(roomId, stepIdentifier, files, confirm, false, user);
    }

    public ValidatePlanResponse validateStepMultipart(
            UUID roomId,
            String stepIdentifier,
            List<MultipartFile> files,
            boolean confirm,
            boolean override,
            User user
    ) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("NO_FILES", "At least one file must be uploaded");
        }
        if (files.size() > 4) {
            throw new BadRequestException("TOO_MANY_FILES", "At most 4 files may be uploaded");
        }

        StringBuilder sb = new StringBuilder();
        List<ValidationDiagnosticsDto.FileDiagnosticsDto> fileDiags = new ArrayList<>();
        List<String> stepsTaken = new ArrayList<>(List.of("decode_files", "normalize", "split_markers"));

        for (MultipartFile f : files) {
            String name = f.getOriginalFilename() != null ? f.getOriginalFilename() : "uploaded.md";
            if (f.getSize() > 12 * 1024 * 1024L) {
                throw new BadRequestException("FILE_TOO_LARGE", "File " + name + " exceeds 12 MB limit");
            }
            String lower = name.toLowerCase();
            int dotIdx = lower.lastIndexOf('.');
            if (dotIdx > 0) {
                boolean validExt = lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".mdx")
                        || lower.endsWith(".txt") || lower.endsWith(".md.txt");
                if (!validExt) {
                    throw new BadRequestException("INVALID_FILE_TYPE", "File " + name + " must be .md, .markdown, .mdx, or .txt");
                }
            }

            byte[] bytes;
            try {
                bytes = f.getBytes();
            } catch (Exception e) {
                throw new BadRequestException("READ_ERROR", "Failed to read file " + name + ": " + e.getMessage());
            }

            FileTextExtractor.DecodedText decoded = FileTextExtractor.decodeText(bytes);
            if (decoded.text().contains("\0")) {
                throw new BadRequestException("FILE_NOT_TEXT", "The file " + name + " appears to be a binary file, not text.");
            }

            String content = decoded.text();
            String first80 = content.length() > 80 ? content.substring(0, 80) : content;

            List<String> markersFound = new ArrayList<>();
            Matcher fm = FILE_MARKER.matcher(content);
            while (fm.find()) {
                markersFound.add(fm.group(1).trim());
            }

            List<String> h1s = new ArrayList<>();
            Matcher h1m = Pattern.compile("(?m)^#\\s+(.+)$").matcher(content);
            while (h1m.find()) {
                h1s.add(h1m.group(1).trim());
            }

            Map<String, List<String>> h2s = new LinkedHashMap<>();
            Matcher h2m = Pattern.compile("(?m)^##\\s+(.+)$").matcher(content);
            List<String> h2List = new ArrayList<>();
            while (h2m.find()) {
                h2List.add(h2m.group(1).trim());
            }
            h2s.put(name, h2List);

            fileDiags.add(new ValidationDiagnosticsDto.FileDiagnosticsDto(
                    name, f.getSize(), decoded.encoding(), content.length(), first80, markersFound, h1s, h2s
            ));

            if (!content.contains("FILE:")) {
                sb.append("=====FILE: ").append(name).append("=====\n");
                sb.append(content).append("\n");
                sb.append("=====END FILE=====\n\n");
            } else {
                sb.append(content).append("\n");
            }
        }

        String reqId = org.slf4j.MDC.get(com.hackathonos.backend.common.http.RequestIdFilter.MDC_KEY);
        if (reqId == null || reqId.isBlank()) reqId = UUID.randomUUID().toString();
        ValidationDiagnosticsDto diagnostics = new ValidationDiagnosticsDto(reqId, fileDiags, stepsTaken);

        return validateStep(roomId, stepIdentifier, sb.toString(), confirm, override, user, diagnostics);
    }

    public ValidatePlanResponse validateStepText(
            UUID roomId,
            String stepIdentifier,
            String text,
            boolean confirm,
            User user
    ) {
        return validateStepText(roomId, stepIdentifier, text, confirm, false, user);
    }

    public ValidatePlanResponse validateStepText(
            UUID roomId,
            String stepIdentifier,
            String text,
            boolean confirm,
            boolean override,
            User user
    ) {
        if (text == null || text.isBlank()) {
            throw new BadRequestException("EMPTY_INPUT", "Step answer text cannot be empty");
        }
        String reqId = org.slf4j.MDC.get(com.hackathonos.backend.common.http.RequestIdFilter.MDC_KEY);
        if (reqId == null || reqId.isBlank()) reqId = UUID.randomUUID().toString();

        String first80 = text.length() > 80 ? text.substring(0, 80) : text;
        List<String> markersFound = new ArrayList<>();
        Matcher fm = FILE_MARKER.matcher(text);
        while (fm.find()) {
            markersFound.add(fm.group(1).trim());
        }
        List<String> h1s = new ArrayList<>();
        Matcher h1m = Pattern.compile("(?m)^#\\s+(.+)$").matcher(text);
        while (h1m.find()) {
            h1s.add(h1m.group(1).trim());
        }
        Map<String, List<String>> h2s = new LinkedHashMap<>();
        Matcher h2m = Pattern.compile("(?m)^##\\s+(.+)$").matcher(text);
        List<String> h2List = new ArrayList<>();
        while (h2m.find()) {
            h2List.add(h2m.group(1).trim());
        }
        h2s.put("text", h2List);

        ValidationDiagnosticsDto diagnostics = new ValidationDiagnosticsDto(
                reqId,
                List.of(new ValidationDiagnosticsDto.FileDiagnosticsDto("text", text.length(), "text", text.length(), first80, markersFound, h1s, h2s)),
                List.of("normalize", "split_markers")
        );
        return validateStep(roomId, stepIdentifier, text, confirm, override, user, diagnostics);
    }

    @Transactional
    public ValidatePlanResponse validateStep(
            UUID roomId,
            String stepIdentifier,
            String rawContent,
            boolean confirm,
            User user
    ) {
        return validateStep(roomId, stepIdentifier, rawContent, confirm, false, user, null);
    }

    public ValidatePlanResponse validateStep(
            UUID roomId,
            String stepIdentifier,
            String rawContent,
            boolean confirm,
            boolean override,
            User user,
            ValidationDiagnosticsDto diagnostics
    ) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (room.getPlanStartedAt() == null) {
            throw new ConflictException("PLAN_NOT_STARTED", "Planning has not started yet. Complete the 'Before we plan' setup first.");
        }
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("PLAN_LOCKED", "Plan is locked");
        }

        int stepNumber = resolveStepNumber(stepIdentifier);
        String stepKey = PlanPromptService.STEP_KEYS.get(stepNumber - 1);

        // Enforce step ordering
        if (stepNumber > 1) {
            String prevKey = PlanPromptService.STEP_KEYS.get(stepNumber - 2);
            PlanStep prev = planStepRepository.findByRoomIdAndStepKey(roomId, prevKey).orElse(null);
            if (prev == null || !prev.isValidated()) {
                throw new ConflictException("STEP_ORDER", "Previous step (" + prevKey + ") must be validated first");
            }
        }

        List<ValidationIssueDto> issues = new ArrayList<>();

        // a) Normalise
        String normalized = normalizeInput(rawContent);
        if (normalized.trim().startsWith("[")) {
            normalized = convertJsonArrayToMarkdown(stepKey, normalized);
        }

        // b) Split into documents by markers
        Map<String, DocumentSnippet> parsedDocs = splitByMarkers(normalized, issues);

        // c) Fallback splitting by H1 prefix if no markers
        if (parsedDocs.isEmpty()) {
            parsedDocs = splitByH1Fallback(stepKey, normalized);
        }

        List<String> expectedFiles = STEP_EXPECTED_FILES.getOrDefault(stepKey, Collections.emptyList());

        // Match case-insensitively and ignore "_" vs "-"
        Map<String, DocumentSnippet> canonicalDocs = new LinkedHashMap<>();
        for (String exp : expectedFiles) {
            DocumentSnippet found = findMatchingDoc(parsedDocs, exp);
            if (found != null) {
                canonicalDocs.put(exp, found);
            }
        }
        for (Map.Entry<String, DocumentSnippet> entry : parsedDocs.entrySet()) {
            boolean matchedExp = expectedFiles.stream().anyMatch(e -> isNameMatch(e, entry.getKey()));
            if (!matchedExp) {
                canonicalDocs.put(entry.getKey(), entry.getValue());
            }
        }

        List<String> foundNames = new ArrayList<>(canonicalDocs.keySet());

        // e) File presence: BLOCK only when expected document absent or under 300 characters
        for (String exp : expectedFiles) {
            DocumentSnippet doc = canonicalDocs.get(exp);
            if (doc == null) {
                issues.add(new ValidationIssueDto(
                        "BLOCK",
                        "MISSING_FILE",
                        exp,
                        1,
                        "Missing required document: " + exp + ". Documents found: " + (foundNames.isEmpty() ? "none" : String.join(", ", foundNames)),
                        exp,
                        foundNames.isEmpty() ? "none" : String.join(", ", foundNames)
                ));
            } else if (doc.content().length() < 300) {
                issues.add(new ValidationIssueDto(
                        "BLOCK",
                        "FILE_TOO_SHORT",
                        exp,
                        1,
                        exp + " is under 300 characters (" + doc.content().length() + " chars). Documents found: " + String.join(", ", foundNames),
                        ">= 300 characters",
                        doc.content().length() + " characters"
                ));
            }
        }

        // d) Section matching for each canonical document
        List<ValidatedFileDto> validatedFiles = new ArrayList<>();
        for (String expFile : expectedFiles) {
            DocumentSnippet doc = canonicalDocs.get(expFile);
            if (doc == null || doc.content().length() < 300) continue;

            List<String> sectionsFound = validateSections(expFile, doc, issues);
            validatedFiles.add(new ValidatedFileDto(expFile, doc.content().length(), expFile, sectionsFound));
        }

        // f) Format checks, lenient parsing
        runLenientFormatChecks(stepKey, canonicalDocs, room, issues);

        // g) Risk warnings for needsConfirmation
        boolean needsConfirmation = checkRiskWarnings(stepKey, canonicalDocs, room, issues);

        // Determine if ok
        boolean hasBlock = issues.stream().anyMatch(i -> "BLOCK".equalsIgnoreCase(i.severity()));
        boolean ok = !hasBlock && (!needsConfirmation || confirm);
        boolean isOverrideApplied = false;

        if (!ok && override) {
            roomAccess.requireLeader(roomId, user);
            if (stepNumber != 4) {
                boolean onlyStructure = issues.stream()
                        .filter(i -> "BLOCK".equalsIgnoreCase(i.severity()))
                        .allMatch(this::isStructureBlockIssue);
                if (onlyStructure) {
                    ok = true;
                    isOverrideApplied = true;
                }
            } else {
                // Step 4 (TASKS) allows it only if at least one task parsed
                DocumentSnippet tasksDoc = canonicalDocs.get("TASKS.md");
                if (tasksDoc != null && countTasksParsed(tasksDoc.content()) >= 1) {
                    ok = true;
                    isOverrideApplied = true;
                }
            }
        }

        // h) Repair prompt
        String repairPrompt = null;
        if (!ok) {
            repairPrompt = buildRepairPrompt(stepNumber, issues, needsConfirmation && !confirm);
        }

        // j) Logging issue codes (one INFO line per validation: step, ok, counts by severity, issue codes, never contents)
        long blockCount = issues.stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).count();
        long warnCount = issues.stream().filter(i -> "WARN".equalsIgnoreCase(i.severity())).count();
        List<String> codes = issues.stream().map(ValidationIssueDto::code).distinct().toList();
        log.info("validation step={} ok={} blockCount={} warnCount={} issueCodes={}", stepKey, ok, blockCount, warnCount, codes);

        // i) On ok: save each document separately, run downstream creation, mark step validated
        String nextStepKey = stepNumber < PlanPromptService.STEP_KEYS.size() ? PlanPromptService.STEP_KEYS.get(stepNumber) : null;
        boolean isDemo = stepNumber == PlanPromptService.STEP_KEYS.size() || "demo".equalsIgnoreCase(stepKey) || "demo-qna".equalsIgnoreCase(stepKey);
        boolean planComplete = false;
        PlanCompletionSummaryDto completion = null;

        if (ok) {
            PlanCompletionSummaryDto[] completionHolder = new PlanCompletionSummaryDto[1];
            final boolean overrideFinal = isOverrideApplied;
            try {
                if (transactionTemplate != null) {
                    transactionTemplate.executeWithoutResult(status -> {
                        executeSaveStep(room, stepKey, rawContent, expectedFiles, canonicalDocs, user, overrideFinal, issues, completionHolder);
                    });
                } else {
                    executeSaveStep(room, stepKey, rawContent, expectedFiles, canonicalDocs, user, overrideFinal, issues, completionHolder);
                }
            } catch (Exception ex) {
                logPersistenceError(log, stepKey, roomId, ex);
                String reqId = org.slf4j.MDC.get(com.hackathonos.backend.common.http.RequestIdFilter.MDC_KEY);
                if (reqId == null || reqId.isBlank()) {
                    reqId = UUID.randomUUID().toString();
                }
                String userMessage = "We could not save your documents. Nothing was changed. Try again, or send us the diagnostics. (Request ID: " + reqId + ")";
                issues.add(new ValidationIssueDto("BLOCK", "SAVE_FAILED", null, null, userMessage, null, null));
                return new ValidatePlanResponse(
                        false,
                        false,
                        validatedFiles,
                        issues,
                        userMessage,
                        nextStepKey,
                        false,
                        null,
                        diagnostics,
                        false
                );
            }

            completion = completionHolder[0];
            if (completion != null) {
                planComplete = true;
            }

            // Trigger prepare for step n+1 if n < 5
            if (stepNumber < 5) {
                planPrepareServiceProvider.ifAvailable(svc -> {
                    svc.triggerPrepareAsync(roomId, stepNumber + 1);
                });
                // Fuse step n+1 prompt immediately
                try {
                    planPromptService.getOrBuildPrompt(roomId, stepNumber + 1, user, false);
                } catch (Exception ex) {
                    log.debug("Step {} prompt will be fused once analysis is complete", stepNumber + 1);
                }
            }
        }

        boolean effectiveNeedsConfirmation = needsConfirmation && !confirm && !isOverrideApplied;

        return new ValidatePlanResponse(
                ok,
                effectiveNeedsConfirmation,
                validatedFiles,
                issues,
                repairPrompt,
                nextStepKey,
                planComplete,
                completion,
                diagnostics,
                isOverrideApplied
        );
    }

    private void executeSaveStep(
            Room room,
            String stepKey,
            String rawContent,
            List<String> expectedFiles,
            Map<String, DocumentSnippet> canonicalDocs,
            User user,
            boolean isOverrideApplied,
            List<ValidationIssueDto> issues,
            PlanCompletionSummaryDto[] completionHolder
    ) {
        UUID roomId = room.getId();
        Map<String, String> filesToSync = new LinkedHashMap<>();
        for (String exp : expectedFiles) {
            DocumentSnippet doc = canonicalDocs.get(exp);
            if (doc != null) {
                filesToSync.put(exp, doc.content());
            }
        }

        planDownstreamSyncService.syncStep(room, stepKey, filesToSync, user, issues::add);

        PlanStep step = planStepRepository.findByRoomIdAndStepKey(roomId, stepKey)
                .orElseGet(() -> new PlanStep(roomId, stepKey));
        step.setAnswer(rawContent);
        step.setValidated(true);
        step.setValidatedWithOverrides(isOverrideApplied);
        step.setValidatedAt(Instant.now());
        if (isOverrideApplied) {
            List<String> blockList = issues.stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList();
            step.setErrors(toJson(blockList));
        } else {
            step.setErrors(null);
        }
        List<String> warnList = issues.stream().filter(i -> "WARN".equalsIgnoreCase(i.severity())).map(ValidationIssueDto::message).toList();
        step.setWarnings(toJson(warnList));
        step.setParsed(toJson(filesToSync));
        step.setUpdatedAt(Instant.now());
        planStepRepository.save(step);

        roomEventService.recordEvent(roomId, isOverrideApplied ? "plan_step.override" : "plan_step.validated", "plan_step", stepKey, user != null ? user.getId() : null);
        activityLogger.log(room, user, isOverrideApplied ? "PLAN_STEP_OVERRIDE" : "PLAN_STEP_VALIDATED",
                (isOverrideApplied ? "Imported plan step " : "Validated plan step ") + stepKey.toUpperCase() + (isOverrideApplied ? " with overrides" : ""));

        // Check completion on step 4 (demo-qna)
        if ("demo".equalsIgnoreCase(stepKey) || "demo-qna".equalsIgnoreCase(stepKey)) {
            boolean allValidated = true;
            for (String k : PlanPromptService.STEP_KEYS) {
                PlanStep s = planStepRepository.findByRoomIdAndStepKey(roomId, k).orElse(null);
                if (s == null || !s.isValidated()) {
                    String alias = switch (k) {
                        case "prd-mvp" -> "prd";
                        case "stack-arch" -> "tech";
                        case "phases-design" -> "phases";
                        case "demo-qna" -> "demo";
                        default -> null;
                    };
                    if (alias != null) {
                        PlanStep as = planStepRepository.findByRoomIdAndStepKey(roomId, alias).orElse(null);
                        if (as != null && as.isValidated()) {
                            continue;
                        }
                    }
                    allValidated = false;
                    break;
                }
            }
            if (allValidated) {
                completionHolder[0] = planCompletionService.complete(room);
            }
        }
    }

    private void logPersistenceError(Logger logger, String stepKey, UUID roomId, Throwable ex) {
        String table = "unknown";
        String column = "unknown";
        String constraint = "unknown";

        Throwable curr = ex;
        while (curr != null) {
            if (curr instanceof org.hibernate.exception.ConstraintViolationException cve) {
                if (cve.getConstraintName() != null) {
                    constraint = cve.getConstraintName();
                }
            }
            try {
                java.lang.reflect.Method getServerError = curr.getClass().getMethod("getServerErrorMessage");
                Object serverError = getServerError.invoke(curr);
                if (serverError != null) {
                    java.lang.reflect.Method getTable = serverError.getClass().getMethod("getTable");
                    java.lang.reflect.Method getColumn = serverError.getClass().getMethod("getColumn");
                    java.lang.reflect.Method getConstraint = serverError.getClass().getMethod("getConstraint");
                    Object t = getTable.invoke(serverError);
                    Object c = getColumn.invoke(serverError);
                    Object cs = getConstraint.invoke(serverError);
                    if (t != null && !t.toString().isBlank()) table = t.toString();
                    if (c != null && !c.toString().isBlank()) column = c.toString();
                    if (cs != null && !cs.toString().isBlank()) constraint = cs.toString();
                }
            } catch (Exception ignored) {}

            String msg = curr.getMessage();
            if (msg != null) {
                if ("unknown".equals(table)) {
                    Matcher tm = Pattern.compile("insert into\\s+([a-zA-Z0-9_]+)", Pattern.CASE_INSENSITIVE).matcher(msg);
                    if (tm.find()) table = tm.group(1);
                    else {
                        Matcher tm2 = Pattern.compile("table\\s+\"([a-zA-Z0-9_]+)\"", Pattern.CASE_INSENSITIVE).matcher(msg);
                        if (tm2.find()) table = tm2.group(1);
                    }
                }
                if ("unknown".equals(column)) {
                    Matcher cm = Pattern.compile("column\\s+\"([a-zA-Z0-9_]+)\"", Pattern.CASE_INSENSITIVE).matcher(msg);
                    if (cm.find()) column = cm.group(1);
                }
                if ("unknown".equals(constraint)) {
                    Matcher csm = Pattern.compile("constraint\\s+\"([a-zA-Z0-9_]+)\"", Pattern.CASE_INSENSITIVE).matcher(msg);
                    if (csm.find()) constraint = csm.group(1);
                }
            }
            curr = curr.getCause();
        }

        logger.error("Save failed for plan step={} room={} table={} column={} constraint={}",
                stepKey, roomId, table, column, constraint, ex);
    }

    private boolean isStructureBlockIssue(ValidationIssueDto issue) {
        if (!"BLOCK".equalsIgnoreCase(issue.severity())) return false;
        String code = issue.code();
        return "MISSING_FILE".equals(code)
                || "FILE_TOO_SHORT".equals(code)
                || "MISSING_CRITICAL_SECTION".equals(code)
                || "NO_PRD_REQUIREMENTS".equals(code)
                || "NO_CORE_FLOW".equals(code)
                || "NO_REALITY_LEDGER".equals(code)
                || "NO_DECISION_SUMMARY".equals(code)
                || "NO_CORE_FLOW_SEQUENCE".equals(code)
                || "NO_API_CONTRACT".equals(code)
                || "NO_PHASES".equals(code)
                || "NO_DESIGN_TOKENS".equals(code)
                || "NO_KEY_SCREENS".equals(code)
                || "TOO_FEW_BEATS".equals(code)
                || "TOO_FEW_QUESTIONS".equals(code)
                || "ZERO_TASKS".equals(code)
                || "TASK_MISSING_TITLE".equals(code)
                || "DUPLICATE_TASK_KEYS".equals(code)
                || "DEPENDENCY_CYCLE".equals(code);
    }

    private int countTasksParsed(String content) {
        if (content == null) return 0;
        Pattern pattern = Pattern.compile("(?m)^###\\s+(?:T-)?([0-9A-Za-z_-]+)(?:\\s*[-:–—]\\s*(.+))?$");
        Matcher m = pattern.matcher(content);
        int count = 0;
        while (m.find()) count++;
        return count;
    }

    private int resolveStepNumber(String stepIdentifier) {
        if (stepIdentifier == null || stepIdentifier.isBlank()) {
            throw new BadRequestException("INVALID_STEP", "Step identifier is required");
        }
        String s = stepIdentifier.trim().toLowerCase();
        if (Character.isDigit(s.charAt(0))) {
            try {
                int n = Integer.parseInt(s);
                if (n >= 1 && n <= 4) return n;
                if (n == 5) return 4;
            } catch (Exception ignored) {}
        }
        String normalized = PlanPromptService.normalizeStepKey(s);
        int idx = PlanPromptService.STEP_KEYS.indexOf(normalized);
        if (idx >= 0) return idx + 1;
        throw new BadRequestException("INVALID_STEP", "Unknown step: " + stepIdentifier);
    }

    private String normalizeInput(String content) {
        if (content == null) return "";
        String s = content;
        if (s.startsWith("\uFEFF")) {
            s = s.substring(1);
        }
        s = s.replace("\r\n", "\n").replace("\r", "\n");
        s = s.replace('\u00A0', ' ');
        // Unwrap outer code fence
        String trimmed = s.trim();
        if (trimmed.startsWith("````") || trimmed.startsWith("```")) {
            int firstNl = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNl != -1 && lastFence > firstNl) {
                s = trimmed.substring(firstNl + 1, lastFence).trim();
            }
        }
        return s;
    }

    private Map<String, DocumentSnippet> splitByMarkers(String content, List<ValidationIssueDto> issues) {
        Map<String, DocumentSnippet> docs = new LinkedHashMap<>();
        Matcher fileMatcher = FILE_MARKER.matcher(content);

        List<int[]> matches = new ArrayList<>();
        List<String> names = new ArrayList<>();
        while (fileMatcher.find()) {
            matches.add(new int[]{fileMatcher.start(), fileMatcher.end()});
            names.add(fileMatcher.group(1).trim());
        }

        if (matches.isEmpty()) {
            return docs;
        }

        // Check text before first marker
        String preamble = content.substring(0, matches.get(0)[0]).trim();
        if (!preamble.isEmpty()) {
            issues.add(new ValidationIssueDto(
                    "WARN",
                    "EXTRANEOUS_PREAMBLE",
                    null,
                    1,
                    "Text before first FILE marker was ignored",
                    null,
                    preamble.length() > 50 ? preamble.substring(0, 47) + "..." : preamble
            ));
        }

        for (int i = 0; i < matches.size(); i++) {
            String name = names.get(i);
            int start = matches.get(i)[1];
            int nextMarkerStart = (i + 1 < matches.size()) ? matches.get(i + 1)[0] : content.length();

            String rawSegment = content.substring(start, nextMarkerStart);
            Matcher endMatcher = END_MARKER.matcher(rawSegment);
            String docText;
            if (endMatcher.find()) {
                docText = rawSegment.substring(0, endMatcher.start()).trim();
                if (i == matches.size() - 1) {
                    String postamble = rawSegment.substring(endMatcher.end()).trim();
                    if (!postamble.isEmpty()) {
                        issues.add(new ValidationIssueDto(
                                "WARN",
                                "EXTRANEOUS_POSTAMBLE",
                                null,
                                countLines(content.substring(0, start + endMatcher.end())),
                                "Text after final END FILE marker was ignored",
                                null,
                                postamble.length() > 50 ? postamble.substring(0, 47) + "..." : postamble
                        ));
                    }
                }
            } else {
                docText = rawSegment.trim();
            }

            int line = countLines(content.substring(0, matches.get(i)[0])) + 1;
            docs.put(name, new DocumentSnippet(name, docText, line));
        }

        return docs;
    }

    private Map<String, DocumentSnippet> splitByH1Fallback(String stepKey, String content) {
        Map<String, DocumentSnippet> docs = new LinkedHashMap<>();
        Pattern h1Pattern = Pattern.compile("(?m)^#\\s+(.+)$");
        Matcher m = h1Pattern.matcher(content);

        List<int[]> h1Matches = new ArrayList<>();
        List<String> titles = new ArrayList<>();
        while (m.find()) {
            h1Matches.add(new int[]{m.start(), m.end()});
            titles.add(m.group(1).trim());
        }

        if (h1Matches.isEmpty()) {
            // If single file step like TASKS
            List<String> expected = STEP_EXPECTED_FILES.getOrDefault(stepKey, Collections.emptyList());
            if (expected.size() == 1) {
                docs.put(expected.get(0), new DocumentSnippet(expected.get(0), content.trim(), 1));
            }
            return docs;
        }

        for (int i = 0; i < h1Matches.size(); i++) {
            String title = titles.get(i);
            int start = h1Matches.get(i)[0];
            int end = (i + 1 < h1Matches.size()) ? h1Matches.get(i + 1)[0] : content.length();
            String docContent = content.substring(start, end).trim();

            String detectedName = mapH1ToFilename(title);
            if (detectedName != null) {
                docs.put(detectedName, new DocumentSnippet(detectedName, docContent, countLines(content.substring(0, start)) + 1));
            }
        }

        return docs;
    }

    private String mapH1ToFilename(String h1Title) {
        String lower = h1Title.toLowerCase();
        if (lower.startsWith("prd")) return "PRD.md";
        if (lower.startsWith("mvp")) return "MVP.md";
        if (lower.startsWith("tech stack")) return "TECH_STACK.md";
        if (lower.startsWith("architecture")) return "ARCHITECTURE.md";
        if (lower.startsWith("phases")) return "PHASES.md";
        if (lower.startsWith("design")) return "DESIGN.md";
        if (lower.startsWith("tasks")) return "TASKS.md";
        if (lower.startsWith("demo script")) return "DEMO_SCRIPT.md";
        if (lower.startsWith("judge q&a") || lower.startsWith("judge qna") || lower.startsWith("q&a")) return "QNA.md";
        return null;
    }

    private boolean isNameMatch(String expected, String actual) {
        if (expected == null || actual == null) return false;
        String e = expected.toLowerCase().replace("_", "-").replace(" ", "");
        String a = actual.toLowerCase().replace("_", "-").replace(" ", "");
        return e.equals(a) || e.replace(".md", "").equals(a.replace(".md", ""));
    }

    private DocumentSnippet findMatchingDoc(Map<String, DocumentSnippet> docs, String expected) {
        for (Map.Entry<String, DocumentSnippet> entry : docs.entrySet()) {
            if (isNameMatch(expected, entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private List<String> validateSections(String fileName, DocumentSnippet doc, List<ValidationIssueDto> issues) {
        List<String> sectionsFound = new ArrayList<>();
        PlanDocumentParser.HeadingConfig cfg = headingConfigs.get(fileName);
        List<String> expectedH2 = cfg != null ? cfg.h2Headings() : Collections.emptyList();
        Set<String> criticalH2 = CRITICAL_HEADINGS.getOrDefault(fileName, Collections.emptySet());

        String[] lines = doc.content().split("\n");
        List<HeadingOccurrence> actualHeadings = new ArrayList<>();
        for (int i = 0; i < lines.length; i++) {
            String l = lines[i].trim();
            if (l.startsWith("## ")) {
                String headingText = l.substring(3).trim();
                actualHeadings.add(new HeadingOccurrence(headingText, i + 1));
                sectionsFound.add(headingText);
            }
        }

        for (String exp : expectedH2) {
            String normExp = normalizeHeading(exp);
            boolean isCritical = criticalH2.contains(normExp);
            boolean matched = false;

            for (HeadingOccurrence act : actualHeadings) {
                String normAct = normalizeHeading(act.text);
                if (matchesHeading(normExp, normAct)) {
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                if (isCritical) {
                    issues.add(new ValidationIssueDto(
                            "BLOCK",
                            "MISSING_CRITICAL_SECTION",
                            fileName,
                            1,
                            fileName + " is missing critical section: " + exp,
                            "## " + exp,
                            null
                    ));
                } else {
                    issues.add(new ValidationIssueDto(
                            "WARN",
                            "MISSING_RECOMMENDED_SECTION",
                            fileName,
                            1,
                            fileName + " is missing recommended section: " + exp,
                            "## " + exp,
                            null
                    ));
                }
            }
        }

        return sectionsFound;
    }

    private boolean matchesHeading(String expNorm, String actNorm) {
        if (expNorm.equals(actNorm)) return true;
        if (actNorm.startsWith(expNorm) || expNorm.startsWith(actNorm)) return true;
        if (levenshtein(expNorm, actNorm) <= 2) return true;

        List<String> synonyms = HEADING_SYNONYMS.getOrDefault(expNorm, Collections.emptyList());
        for (String syn : synonyms) {
            String synNorm = normalizeHeading(syn);
            if (actNorm.equals(synNorm) || actNorm.startsWith(synNorm) || levenshtein(actNorm, synNorm) <= 2) {
                return true;
            }
        }
        return false;
    }

    private String normalizeHeading(String text) {
        if (text == null) return "";
        String s = text.toLowerCase();
        // Replace smart quotes and dashes with plain ones
        s = s.replace('“', '"').replace('”', '"').replace('‘', '\'').replace('’', '\'')
                .replace('–', '-').replace('—', '-');
        // Strip numbering e.g. 1., 1.1, (1)
        s = s.replaceAll("^\\s*(\\d+(\\.\\d+)*[.)\\-:]*|\\([0-9]+\\))\\s*", "");
        // Strip emoji and symbol characters
        s = s.replaceAll("[\\p{So}\\p{Sk}\\p{Sm}]", "");
        // Strip emphasis markers *, _
        s = s.replace("*", "").replace("_", "");
        // Strip trailing colon
        s = s.replaceAll(":\\s*$", "");
        // & equals and
        s = s.replace("&", "and");
        // Collapse spaces
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    private void runLenientFormatChecks(
            String stepKey,
            Map<String, DocumentSnippet> docs,
            Room room,
            List<ValidationIssueDto> issues
    ) {
        switch (stepKey.toLowerCase()) {
            case "prd" -> {
                DocumentSnippet prd = docs.get("PRD.md");
                DocumentSnippet mvp = docs.get("MVP.md");

                if (prd != null) {
                    Pattern frPattern = Pattern.compile("(?i)(?:^|[\\s|*`-])FR-\\d{3}[*`\\s]*[\\[(](MUST|SHOULD|COULD)[\\])]");
                    Matcher frMatcher = frPattern.matcher(prd.content());
                    int frCount = 0;
                    while (frMatcher.find()) frCount++;

                    if (frCount == 0) {
                        issues.add(new ValidationIssueDto(
                                "BLOCK",
                                "NO_PRD_REQUIREMENTS",
                                "PRD.md",
                                1,
                                "PRD.md must contain functional requirements matching format 'FR-001 [MUST|SHOULD|COULD]'",
                                "FR-001 [MUST]",
                                "0 requirements found"
                        ));
                    }

                    // Check for odd requirement lines
                    String[] prdLines = prd.content().split("\n");
                    for (int i = 0; i < prdLines.length; i++) {
                        String line = prdLines[i].trim();
                        if (line.matches("(?i).*\\bFR-\\d{3}\\b.*") && !frPattern.matcher(line).find()) {
                            issues.add(new ValidationIssueDto(
                                    "WARN",
                                    "ODD_REQUIREMENT_LINE",
                                    "PRD.md",
                                    i + 1,
                                    "Line references an FR code but lacks standard [MUST|SHOULD|COULD] priority marker",
                                    "FR-001 [MUST]",
                                    line
                            ));
                        }
                    }
                }

                if (mvp != null) {
                    // Reality ledger table status synonyms
                    String[] lines = mvp.content().split("\n");
                    boolean inLedger = false;
                    for (int i = 0; i < lines.length; i++) {
                        String line = lines[i].trim();
                        if (line.toLowerCase().startsWith("## reality ledger")) {
                            inLedger = true;
                            continue;
                        }
                        if (inLedger && line.startsWith("## ")) {
                            inLedger = false;
                            break;
                        }
                        if (inLedger && line.startsWith("|") && !line.contains("---") && !line.toLowerCase().contains("component")) {
                            String[] cells = line.split("\\|");
                            if (cells.length >= 3) {
                                String status = cells[2].trim().toLowerCase();
                                boolean allowed = status.contains("built this weekend") || status.contains("existing library")
                                        || status.contains("existing api") || status.contains("mock") || status.contains("planned");
                                if (!allowed && !status.isBlank()) {
                                    issues.add(new ValidationIssueDto(
                                            "WARN",
                                            "UNKNOWN_LEDGER_STATUS",
                                            "MVP.md",
                                            i + 1,
                                            "Reality ledger row uses non-standard status '" + cells[2].trim() + "', defaulted to Planned",
                                            "Built this weekend | Existing library or API | Mocked | Planned",
                                            cells[2].trim()
                                    ));
                                }
                            }
                        }
                    }

                    // Core flow numbered or bulleted steps
                    int coreSteps = countCoreFlowSteps(mvp.content());
                    if (coreSteps < 3 || coreSteps > 5) {
                        issues.add(new ValidationIssueDto(
                                "WARN",
                                "CORE_FLOW_STEP_COUNT",
                                "MVP.md",
                                1,
                                "MVP Core flow contains " + coreSteps + " steps (recommended 3 to 5)",
                                "3 to 5 steps",
                                coreSteps + " steps"
                        ));
                    }
                }
            }
            case "phases" -> {
                DocumentSnippet phases = docs.get("PHASES.md");
                if (phases != null) {
                    long roomDuration = 36;
                    if (room.getEventStart() != null && room.getEventEnd() != null) {
                        roomDuration = Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
                    }

                    Pattern hourPattern = Pattern.compile("(?i)hours:\\s*(\\d+)\\s*[-:—–]\\s*(\\d+)\\s*h?");
                    Matcher m = hourPattern.matcher(phases.content());
                    int maxHour = 0;
                    while (m.find()) {
                        try {
                            int endH = Integer.parseInt(m.group(2));
                            if (endH > maxHour) maxHour = endH;
                        } catch (Exception ignored) {}
                    }
                    if (maxHour > 0 && maxHour != roomDuration) {
                        issues.add(new ValidationIssueDto(
                                "WARN",
                                "PHASE_HOURS_MISMATCH",
                                "PHASES.md",
                                1,
                                "Phase hours total " + maxHour + "h does not match event duration of " + roomDuration + "h",
                                roomDuration + "h",
                                maxHour + "h"
                        ));
                    }
                }
            }
            case "tasks" -> {
                DocumentSnippet tasks = docs.get("TASKS.md");
                if (tasks != null) {
                    validateTasksLenient(tasks, issues);
                }
            }
            case "demo" -> {
                DocumentSnippet script = docs.get("DEMO_SCRIPT.md");
                DocumentSnippet qna = docs.get("QNA.md");

                if (script != null) {
                    int beats = countBeats(script.content());
                    if (beats < 6) {
                        issues.add(new ValidationIssueDto(
                                "BLOCK",
                                "TOO_FEW_BEATS",
                                "DEMO_SCRIPT.md",
                                1,
                                "Demo script contains only " + beats + " beats (minimum 6 required)",
                                ">= 6 beats",
                                beats + " beats"
                        ));
                    } else if (beats < 10) {
                        issues.add(new ValidationIssueDto(
                                "WARN",
                                "BEATS_BELOW_TARGET",
                                "DEMO_SCRIPT.md",
                                1,
                                "Demo script contains " + beats + " beats (recommended 10 beats)",
                                "10 beats",
                                beats + " beats"
                        ));
                    }
                }

                if (qna != null) {
                    int questions = countQuestions(qna.content());
                    if (questions < 8) {
                        issues.add(new ValidationIssueDto(
                                "BLOCK",
                                "TOO_FEW_QUESTIONS",
                                "QNA.md",
                                1,
                                "Judge Q&A contains only " + questions + " questions (minimum 8 required)",
                                ">= 8 questions",
                                questions + " questions"
                        ));
                    } else if (questions < 18) {
                        issues.add(new ValidationIssueDto(
                                "WARN",
                                "QUESTIONS_BELOW_TARGET",
                                "QNA.md",
                                1,
                                "Judge Q&A contains " + questions + " questions (recommended 18 questions)",
                                "18 questions",
                                questions + " questions"
                        ));
                    }
                }
            }
        }

        // Placeholder leftovers (WARN, never BLOCK)
        for (DocumentSnippet doc : docs.values()) {
            if (doc.content().contains("<project name>") || doc.content().contains("<project_name>")
                    || doc.content().contains("{{") || doc.content().contains("<your project>")) {
                issues.add(new ValidationIssueDto(
                        "WARN",
                        "PLACEHOLDER_LEFTOVER",
                        doc.name(),
                        1,
                        doc.name() + " contains unresolved placeholder text (e.g. <project name> or {{)",
                        "Clean text",
                        "Placeholder present"
                ));
            }
        }
    }

    private int countCoreFlowSteps(String mvpContent) {
        String[] lines = mvpContent.split("\n");
        boolean inFlow = false;
        int count = 0;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith("## core flow")) {
                inFlow = true;
                continue;
            }
            if (inFlow && trimmed.startsWith("## ")) {
                break;
            }
            if (inFlow && (trimmed.matches("^\\d+[.)]\\s+.*") || trimmed.matches("^[-*+]\\s+.*"))) {
                count++;
            }
        }
        return count;
    }

    private void validateTasksLenient(DocumentSnippet tasksDoc, List<ValidationIssueDto> issues) {
        Pattern taskHeader = Pattern.compile("(?im)^###\\s*[*_]*(T-\\d{3})[*_]*\\s*[-:—–]?\\s*(.*)$");
        Matcher m = taskHeader.matcher(tasksDoc.content());

        List<String> keys = new ArrayList<>();
        Map<String, String> titles = new HashMap<>();
        Map<String, List<String>> dependencies = new HashMap<>();
        Map<String, Double> estimates = new HashMap<>();
        Map<String, String> assignees = new HashMap<>();

        Set<String> seenKeys = new HashSet<>();
        List<String> dupKeys = new ArrayList<>();

        while (m.find()) {
            String key = m.group(1).toUpperCase();
            String title = m.group(2).replaceAll("[*_]", "").trim();

            if (seenKeys.contains(key)) {
                dupKeys.add(key);
            } else {
                seenKeys.add(key);
                keys.add(key);
            }

            titles.put(key, title);

            int start = m.end();
            int end = tasksDoc.content().length();
            Matcher next = taskHeader.matcher(tasksDoc.content());
            if (next.find(start)) {
                end = next.start();
            }
            String block = tasksDoc.content().substring(start, end);

            // Estimate
            double est = parseEstimate(block, issues, key);
            estimates.put(key, est);

            // Assignee
            String assignee = parseAssignee(block, issues, key);
            assignees.put(key, assignee);

            // Depends on
            List<String> deps = parseDependsOn(block, issues, key);
            dependencies.put(key, deps);
        }

        if (keys.isEmpty()) {
            issues.add(new ValidationIssueDto(
                    "BLOCK",
                    "ZERO_TASKS",
                    "TASKS.md",
                    1,
                    "TASKS.md must contain at least one task matching format '### T-001 - Title'",
                    "### T-001 - Task title",
                    "0 tasks found"
            ));
            return;
        }

        // BLOCK: task without title
        for (String k : keys) {
            String t = titles.get(k);
            if (t == null || t.isBlank()) {
                issues.add(new ValidationIssueDto(
                        "BLOCK",
                        "TASK_MISSING_TITLE",
                        "TASKS.md",
                        1,
                        "Task " + k + " is missing a title",
                        "### " + k + " - Title",
                        "No title"
                ));
            }
        }

        // BLOCK: duplicate keys
        if (!dupKeys.isEmpty()) {
            issues.add(new ValidationIssueDto(
                    "BLOCK",
                    "DUPLICATE_TASK_KEYS",
                    "TASKS.md",
                    1,
                    "Duplicate task keys found: " + String.join(", ", dupKeys),
                    "Unique keys",
                    String.join(", ", dupKeys)
            ));
        }

        // Validate dependencies against known keys
        for (Map.Entry<String, List<String>> entry : dependencies.entrySet()) {
            String k = entry.getKey();
            List<String> validDeps = new ArrayList<>();
            for (String dep : entry.getValue()) {
                if (keys.contains(dep)) {
                    validDeps.add(dep);
                } else {
                    issues.add(new ValidationIssueDto(
                            "WARN",
                            "MISSING_DEPENDENCY_KEY",
                            "TASKS.md",
                            1,
                            "Task " + k + " depends on non-existent key " + dep + ", dropped dependency",
                            "Valid task key",
                            dep
                    ));
                }
            }
            dependencies.put(k, validDeps);
        }

        // Check for dependency cycle
        String cyclePath = detectCycle(keys, dependencies);
        if (cyclePath != null) {
            issues.add(new ValidationIssueDto(
                    "BLOCK",
                    "DEPENDENCY_CYCLE",
                    "TASKS.md",
                    1,
                    "Dependency cycle detected: " + cyclePath,
                    "Acyclic dependency graph",
                    cyclePath
            ));
        }
    }

    private double parseEstimate(String block, List<ValidationIssueDto> issues, String key) {
        Pattern estPattern = Pattern.compile("(?im)^[-*\\s]*[*_]*estimate[*_]*:\\s*([0-9.]+)\\s*(?:h|hours)?");
        Matcher m = estPattern.matcher(block);
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1));
                if (val < 0.5 || val > 6.0) {
                    double clamped = Math.max(0.5, Math.min(6.0, val));
                    issues.add(new ValidationIssueDto(
                            "WARN",
                            "ESTIMATE_CLAMPED",
                            "TASKS.md",
                            1,
                            "Task " + key + " estimate " + val + "h clamped to " + clamped + "h (allowed 0.5-6h)",
                            "0.5 - 6.0",
                            String.valueOf(val)
                    ));
                    return clamped;
                }
                return val;
            } catch (Exception ignored) {}
        }
        return 2.0;
    }

    private String parseAssignee(String block, List<ValidationIssueDto> issues, String key) {
        Pattern p = Pattern.compile("(?im)^[-*\\s]*[*_]*assignee[*_]*:\\s*([^\r\n]+)");
        Matcher m = p.matcher(block);
        if (m.find()) {
            String raw = m.group(1).replaceAll("[*_]", "").trim();
            if (raw.isBlank() || raw.equalsIgnoreCase("unassigned") || raw.equals("-")) {
                return "UNASSIGNED";
            }
            return raw;
        }
        return "UNASSIGNED";
    }

    private List<String> parseDependsOn(String block, List<ValidationIssueDto> issues, String key) {
        Pattern p = Pattern.compile("(?im)^[-*\\s]*[*_]*depends on[*_]*:\\s*([^\r\n]+)");
        Matcher m = p.matcher(block);
        if (m.find()) {
            String raw = m.group(1).replaceAll("[*_]", "").trim();
            if (raw.equalsIgnoreCase("none") || raw.equals("-") || raw.equalsIgnoreCase("n/a")) {
                return Collections.emptyList();
            }
            String[] tokens = raw.split("[,\\s+and]+");
            List<String> list = new ArrayList<>();
            for (String tok : tokens) {
                String clean = tok.trim().toUpperCase();
                if (clean.startsWith("T-") || clean.matches("\\d{3}")) {
                    String fullKey = clean.startsWith("T-") ? clean : "T-" + clean;
                    if (!fullKey.equals(key)) {
                        list.add(fullKey);
                    }
                }
            }
            return list;
        }
        return Collections.emptyList();
    }

    private String detectCycle(List<String> keys, Map<String, List<String>> deps) {
        Set<String> visited = new HashSet<>();
        Set<String> recStack = new HashSet<>();
        List<String> path = new ArrayList<>();

        for (String k : keys) {
            if (!visited.contains(k)) {
                if (dfsCycle(k, deps, visited, recStack, path)) {
                    return String.join(" -> ", path);
                }
            }
        }
        return null;
    }

    private boolean dfsCycle(String curr, Map<String, List<String>> deps, Set<String> visited, Set<String> recStack, List<String> path) {
        visited.add(curr);
        recStack.add(curr);
        path.add(curr);

        List<String> neighbours = deps.getOrDefault(curr, Collections.emptyList());
        for (String next : neighbours) {
            if (!visited.contains(next)) {
                if (dfsCycle(next, deps, visited, recStack, path)) {
                    return true;
                }
            } else if (recStack.contains(next)) {
                path.add(next);
                return true;
            }
        }

        recStack.remove(curr);
        path.remove(path.size() - 1);
        return false;
    }

    private int countBeats(String content) {
        Pattern p = Pattern.compile("(?im)^#{3,4}\\s+(?:beat\\s*\\d+|\\d+\\.)");
        Matcher m = p.matcher(content);
        int c = 0;
        while (m.find()) c++;
        return c;
    }

    private int countQuestions(String content) {
        Pattern p = Pattern.compile("(?im)^#{3,4}\\s+(?:q:|question|q\\d+:)");
        Matcher m = p.matcher(content);
        int c = 0;
        while (m.find()) c++;
        return c;
    }

    private boolean checkRiskWarnings(String stepKey, Map<String, DocumentSnippet> docs, Room room, List<ValidationIssueDto> issues) {
        boolean riskFound = false;

        Brief brief = briefRepository.findByRoomId(room.getId()).orElse(null);

        // 1. Forbidden-tech mention outside Rejected options
        if ("tech".equalsIgnoreCase(stepKey) && brief != null && brief.getTechRules() != null) {
            String rules = brief.getTechRules().toLowerCase();
            List<String> forbiddenTerms = extractForbiddenTerms(rules);
            for (String term : forbiddenTerms) {
                for (String fName : List.of("TECH_STACK.md", "ARCHITECTURE.md")) {
                    DocumentSnippet doc = docs.get(fName);
                    if (doc != null) {
                        String outsideRejected = stripSection(doc.content(), "Rejected options");
                        if (outsideRejected.toLowerCase().contains(term)) {
                            riskFound = true;
                            issues.add(new ValidationIssueDto(
                                    "WARN",
                                    "RISK_FORBIDDEN_TECH",
                                    fName,
                                    1,
                                    "Forbidden technology '" + term + "' mentioned outside Rejected options",
                                    "No forbidden technologies",
                                    term
                            ));
                        }
                    }
                }
            }
        }

        // 2. More than one NEW technology in TECH_STACK.md
        if ("tech".equalsIgnoreCase(stepKey)) {
            DocumentSnippet stack = docs.get("TECH_STACK.md");
            if (stack != null) {
                String budget = extractSection(stack.content(), "New-tech budget");
                int newTechCount = countBullets(budget);
                if (newTechCount > 1) {
                    riskFound = true;
                    issues.add(new ValidationIssueDto(
                            "WARN",
                            "RISK_MULTIPLE_NEW_TECH",
                            "TECH_STACK.md",
                            1,
                            "More than one NEW technology listed in New-tech budget (" + newTechCount + " found)",
                            "<= 1 new technology",
                            newTechCount + " new technologies"
                    ));
                }
            }
        }

        // 3. Over 35% of hours on one person in TASKS.md
        if ("tasks".equalsIgnoreCase(stepKey)) {
            DocumentSnippet tasks = docs.get("TASKS.md");
            if (tasks != null) {
                Map<String, Double> hoursPerPerson = new HashMap<>();
                double total = 0.0;
                Pattern taskH = Pattern.compile("(?im)^###\\s*[*_]*(T-\\d{3})[*_]*");
                Matcher tm = taskH.matcher(tasks.content());
                while (tm.find()) {
                    int start = tm.end();
                    int end = tasks.content().length();
                    Matcher next = taskH.matcher(tasks.content());
                    if (next.find(start)) end = next.start();
                    String blk = tasks.content().substring(start, end);

                    String person = parseAssignee(blk, List.of(), tm.group(1));
                    double h = parseEstimate(blk, List.of(), tm.group(1));
                    if (!"UNASSIGNED".equalsIgnoreCase(person)) {
                        hoursPerPerson.put(person, hoursPerPerson.getOrDefault(person, 0.0) + h);
                        total += h;
                    }
                }

                if (total > 0) {
                    for (Map.Entry<String, Double> entry : hoursPerPerson.entrySet()) {
                        double pct = (entry.getValue() / total) * 100.0;
                        if (pct > 35.0) {
                            riskFound = true;
                            issues.add(new ValidationIssueDto(
                                    "WARN",
                                    "RISK_WORKLOAD_UNBALANCED",
                                    "TASKS.md",
                                    1,
                                    "Assignee " + entry.getKey() + " has " + String.format("%.1f", pct) + "% of total hours (> 35%)",
                                    "<= 35% per member",
                                    String.format("%.1f%%", pct)
                            ));
                        }
                    }
                }
            }
        }

        return riskFound;
    }

    private List<String> extractForbiddenTerms(String rules) {
        List<String> list = new ArrayList<>();
        Pattern p = Pattern.compile("(?:no|forbidden|prohibited|disallowed|banned)\\s+([a-zA-Z0-9+#.-]+)");
        Matcher m = p.matcher(rules);
        while (m.find()) {
            list.add(m.group(1).trim().toLowerCase());
        }
        return list;
    }

    private String stripSection(String content, String sectionName) {
        int idx = content.toLowerCase().indexOf("## " + sectionName.toLowerCase());
        if (idx < 0) return content;
        int nextSection = content.indexOf("\n## ", idx + 3);
        if (nextSection < 0) return content.substring(0, idx);
        return content.substring(0, idx) + content.substring(nextSection);
    }

    private String extractSection(String content, String sectionName) {
        int idx = content.toLowerCase().indexOf("## " + sectionName.toLowerCase());
        if (idx < 0) return "";
        int start = content.indexOf("\n", idx);
        if (start < 0) return "";
        int nextSection = content.indexOf("\n## ", start);
        if (nextSection < 0) return content.substring(start).trim();
        return content.substring(start, nextSection).trim();
    }

    private int countBullets(String text) {
        if (text == null || text.isBlank()) return 0;
        int c = 0;
        for (String line : text.split("\n")) {
            String t = line.trim();
            if (t.startsWith("- ") || t.startsWith("* ") || t.matches("^\\d+\\.\\s+.*")) {
                c++;
            }
        }
        return c;
    }

    private String buildRepairPrompt(int stepIndex, List<ValidationIssueDto> issues, boolean confirmRequired) {
        StringBuilder sb = new StringBuilder();
        sb.append("Your previous submission has issues that must be fixed before proceeding:\n\n");
        for (ValidationIssueDto issue : issues) {
            if ("BLOCK".equalsIgnoreCase(issue.severity()) || (confirmRequired && issue.code().startsWith("RISK_"))) {
                sb.append("- [").append(issue.file() != null ? issue.file() : "General")
                        .append("] ").append(issue.message()).append("\n");
            }
        }
        sb.append("\nPlease fix ONLY these issues and deliver the complete answer again adhering strictly to the OUTPUT DELIVERY format:\n");
        sb.append(planPromptService.buildOutputDeliveryBlock(stepIndex));
        return sb.toString();
    }

    private int countLines(String text) {
        if (text == null || text.isEmpty()) return 0;
        int lines = 1;
        for (int i = 0; i < text.length(); i++) {
            if (text.charAt(i) == '\n') lines++;
        }
        return lines;
    }

    private int levenshtein(String a, String b) {
        if (a == null || b == null) return Integer.MAX_VALUE;
        int[] costs = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) costs[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= b.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]),
                        a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[b.length()];
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }

    private String convertJsonArrayToMarkdown(String stepKey, String json) {
        try {
            if ("phases".equalsIgnoreCase(stepKey)) {
                com.fasterxml.jackson.databind.JsonNode arr = objectMapper.readTree(json);
                if (arr.isArray()) {
                    StringBuilder sb = new StringBuilder();
                    sb.append("=====FILE: PHASES.md=====\n");
                    sb.append("# Phases: Project Phases\n\n");
                    sb.append("## Clock model\nStandard clock\n\n");
                    sb.append("## Phases\n");
                    int h = 0;
                    for (int i = 0; i < arr.size(); i++) {
                        com.fasterxml.jackson.databind.JsonNode p = arr.get(i);
                        String name = p.has("name") ? p.get("name").asText() : "Phase " + (i + 1);
                        String id = p.has("id") ? p.get("id").asText() : "P" + (i + 1);
                        int startH = h;
                        int endH = h + 7;
                        h = endH;
                        sb.append("### ").append(id.toUpperCase()).append(" - ").append(name).append("\n");
                        sb.append("Hours: ").append(startH).append("-").append(endH).append("h\n");
                        if (p.has("exitCheckpoint")) {
                            sb.append("Exit checkpoint: ").append(p.get("exitCheckpoint").asText()).append("\n");
                        }
                        sb.append("\n");
                    }
                    sb.append("## Checkpoints\nKey checkpoints established\n\n");
                    sb.append("## Feature freeze rules\nStrict feature freeze\n\n");
                    sb.append("## Workload and energy plan\nBalanced workload\n\n");
                    sb.append("## Risk windows\nBuffer allocated\n\n");
                    sb.append("## Buffer and submission plan\nTwo hour buffer\n\n");
                    sb.append("## Reality check\nPhases verified against schedule.\n\n");
                    sb.append("=====END FILE=====\n\n");

                    sb.append("=====FILE: DESIGN.md=====\n");
                    sb.append("# Design: Design System\n\n");
                    sb.append("## Design intent\nClean and focused hackathon demo UI.\n\n");
                    sb.append("## Feel and anti-patterns\nFast, reactive, no clutter.\n\n");
                    sb.append("## Design tokens\nPrimary brand color and typography.\n\n");
                    sb.append("## Screen inventory\nMain dashboard, settings, summary.\n\n");
                    sb.append("## Key screens\nInteractive presentation screens.\n\n");
                    sb.append("## Component list\nCards, tables, modals.\n\n");
                    sb.append("## Interaction and motion\nSubtle transitions.\n\n");
                    sb.append("## Accessibility and responsive\nMobile responsive and readable.\n\n");
                    sb.append("## Demo polish\nHigh contrast demo presentation.\n\n");
                    sb.append("## Build instructions for the coding agent\nUse shadcn/ui components.\n\n");
                    sb.append("## Reality check\nDesign verified against time budget.\n\n");
                    sb.append("=====END FILE=====\n");
                    return sb.toString();
                }
            } else if ("tasks".equalsIgnoreCase(stepKey)) {
                com.fasterxml.jackson.databind.JsonNode arr = objectMapper.readTree(json);
                if (arr.isArray()) {
                    StringBuilder sb = new StringBuilder();
                    sb.append("=====FILE: TASKS.md=====\n");
                    sb.append("# Tasks: Sprint Tasks\n\n");
                    sb.append("## Tasks\n");
                    for (int i = 0; i < arr.size(); i++) {
                        com.fasterxml.jackson.databind.JsonNode t = arr.get(i);
                        String key = String.format("T-%03d", i + 1);
                        String title = t.has("title") ? t.get("title").asText() : "Task " + key;
                        String role = t.has("role") ? t.get("role").asText() : "Backend";
                        String phase = t.has("phaseId") ? t.get("phaseId").asText().toUpperCase() : "P1";
                        int est = t.has("estimateMin") ? t.get("estimateMin").asInt() / 60 : 2;
                        if (est == 0) est = 1;
                        sb.append("### ").append(key).append(" - ").append(title).append("\n");
                        sb.append("- Phase: ").append(phase).append("\n");
                        sb.append("- Role: ").append(role).append("\n");
                        sb.append("- Estimate: ").append(est).append("h\n");
                        sb.append("- Assignee: UNASSIGNED\n");
                        sb.append("- Depends on: none\n");
                        sb.append("- Acceptance:\n");
                        sb.append("  - ").append(t.has("acceptance") ? t.get("acceptance").asText() : "Verified operational").append("\n\n");
                    }
                    sb.append("## Critical path\nLinear sequence through core tasks.\n\n");
                    sb.append("## Workload summary\nDistributed across engineering team.\n\n");
                    sb.append("## Assignment notes\nTasks prioritized for parallel execution.\n\n");
                    sb.append("## Reality check\nTask scope realistic for event timeframe.\n\n");
                    sb.append("=====END FILE=====\n");
                    return sb.toString();
                }
            }
        } catch (Exception ignored) {}
        return json;
    }

    private record DocumentSnippet(String name, String content, int startLine) {}
    private record HeadingOccurrence(String text, int line) {}
}
