package com.hackathonos.backend.plan;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaLink;
import com.hackathonos.backend.ideas.IdeaLinkRepository;
import com.hackathonos.backend.ideas.IdeaNote;
import com.hackathonos.backend.ideas.IdeaNoteRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.plan.dto.PlanPromptResponseDto;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.team.TeamCharterResponse;
import com.hackathonos.backend.team.TeamCharterResponseRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Service managing dynamic prompt assembly, caching, completeness verification,
 * and AI briefing analysis for the 5-step Plan stage.
 */
@Service
public class PlanPromptService {

    private static final Logger log = LoggerFactory.getLogger(PlanPromptService.class);

    public static final List<String> STEP_KEYS = List.of("prd-mvp", "stack-arch", "phases-design", "demo-qna");
    public static final List<String> ROLE_TAGS = List.of(
            "Frontend", "Backend", "ML/AI", "Design", "Presenter", "Domain expert", "QA/Demo operator"
    );

    public record StepOutputConfig(String bundleName, List<String> files) {}

    public static final Map<Integer, StepOutputConfig> STEP_OUTPUT_CONFIGS = Map.of(
            1, new StepOutputConfig("step1-bundle.md", List.of("PRD.md", "MVP.md")),
            2, new StepOutputConfig("step2-bundle.md", List.of("TECH_STACK.md", "ARCHITECTURE.md")),
            3, new StepOutputConfig("step3-bundle.md", List.of("PHASES.md", "DESIGN.md")),
            4, new StepOutputConfig("step4-bundle.md", List.of("DEMO_SCRIPT.md", "QNA.md"))
    );

    public static String normalizeStepKey(String stepKey) {
        if (stepKey == null || stepKey.isBlank()) return "prd-mvp";
        String s = stepKey.trim().toLowerCase();
        return switch (s) {
            case "prd", "1", "step1" -> "prd-mvp";
            case "tech", "stack", "stack-arch", "2", "step2" -> "stack-arch";
            case "phases", "phase", "phases-design", "3", "step3" -> "phases-design";
            case "demo", "demo-qna", "qna", "4", "5", "step4", "step5" -> "demo-qna";
            default -> s;
        };
    }

    public static int getStepIndex(String stepKey) {
        String normalized = normalizeStepKey(stepKey);
        int idx = STEP_KEYS.indexOf(normalized);
        return idx >= 0 ? idx + 1 : 1;
    }

    public record AnalysisResult(
            String analysisBlock,
            String mode,
            String ideaVerdict,
            String assessmentLocked,
            boolean fallback,
            boolean skippedNoKey
    ) {
        public AnalysisResult(String analysisBlock, String mode, String ideaVerdict, String assessmentLocked) {
            this(analysisBlock, mode, ideaVerdict, assessmentLocked, false, false);
        }

        public AnalysisResult(String analysisBlock, String mode, String ideaVerdict, String assessmentLocked, boolean fallback) {
            this(analysisBlock, mode, ideaVerdict, assessmentLocked, fallback, false);
        }
    }


    private final Map<Integer, String> stepTemplates = new HashMap<>();
    private final Map<Integer, String> stepGroqPrompts = new HashMap<>();

    // Analysis cache by (room, step, factsHash)
    private final Map<String, AnalysisResult> analysisCache = new ConcurrentHashMap<>();
    // Fused prompt cache by (room, step, factsHash, priorHash)
    private final Map<String, String> promptCache = new ConcurrentHashMap<>();
    // Room AI concurrency locks
    private final Map<UUID, Semaphore> roomAiLocks = new ConcurrentHashMap<>();
    // Room previous section hashes for logging changes
    private final Map<UUID, Map<String, String>> roomSectionHashes = new ConcurrentHashMap<>();

    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final RoomService roomService;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final IdeaLinkRepository ideaLinkRepository;
    private final IdeaNoteRepository ideaNoteRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TeamCharterResponseRepository charterRepository;
    private final PlanStepRepository planStepRepository;
    private final PlanStepPromptRepository promptRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final IdeasService ideasService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public PlanPromptService(
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            RoomService roomService,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            IdeaLinkRepository ideaLinkRepository,
            IdeaNoteRepository ideaNoteRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            TeamCharterResponseRepository charterRepository,
            PlanStepRepository planStepRepository,
            PlanStepPromptRepository promptRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            IdeasService ideasService,
            AiService aiService,
            ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.roomService = roomService;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.ideaLinkRepository = ideaLinkRepository;
        this.ideaNoteRepository = ideaNoteRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.charterRepository = charterRepository;
        this.planStepRepository = planStepRepository;
        this.promptRepository = promptRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.ideasService = ideasService;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    private String phaseTasksTemplate;

    @PostConstruct
    public void init() {
        Map<Integer, String> templateFiles = Map.of(
                1, "step1-prd-mvp.template.md",
                2, "step2-stack-arch.template.md",
                3, "step3-phases-design.template.md",
                4, "step5-demo-qna.template.md"
        );

        Map<Integer, String> groqFiles = Map.of(
                1, "step1-prd-mvp.groq.md",
                2, "step2-stack-arch.groq.md",
                3, "step3-phases-design.groq.md",
                4, "step5-demo-qna.groq.md"
        );

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        Set<String> planStepPlaceholders = Set.of("{{FACTS}}", "{{ANALYSIS}}", "{{PRIOR}}");

        for (int i = 1; i <= 4; i++) {
            String tFile = templateFiles.get(i);
            String gFile = groqFiles.get(i);

            String templateContent = readClasspathFile(resolver, "classpath:plan-prompts/" + tFile);
            String groqContent = readClasspathFile(resolver, "classpath:plan-prompts/" + gFile);

            verifyPlaceholders(tFile, templateContent, planStepPlaceholders);

            stepTemplates.put(i, templateContent);
            stepGroqPrompts.put(i, groqContent);
        }

        // Phase tasks template check
        String phaseTemplateFile = "phase-tasks.template.md";
        String phaseTemplateContent = readClasspathFile(resolver, "classpath:plan-prompts/" + phaseTemplateFile);
        Set<String> phasePlaceholders = Set.of(
                "{{FACTS}}", "{{PHASE}}", "{{PRIOR}}", "{{CARRYOVER}}", "{{EXISTING}}", "{{CAPACITY}}", "{{TARGETS}}"
        );
        verifyPlaceholders(phaseTemplateFile, phaseTemplateContent, phasePlaceholders);
        this.phaseTasksTemplate = phaseTemplateContent;

        log.info("PlanPromptService initialized successfully with 4 prompt templates, groq briefs, and phase-tasks template.");
    }

    public void verifyPlaceholders(String fileName, String content, Set<String> requiredPlaceholders) {
        for (String ph : requiredPlaceholders) {
            int count = countMatches(content, ph);
            if (count == 0) {
                throw new IllegalStateException("Template " + fileName + " missing required placeholder: " + ph);
            }
            if (count > 1) {
                throw new IllegalStateException("Template " + fileName + " must contain exactly one occurrence of " + ph + ", but found " + count);
            }
        }
    }

    public String getPhaseTasksTemplate() {
        return phaseTasksTemplate;
    }

    private int countMatches(String str, String sub) {
        if (str == null || sub == null || sub.isEmpty()) return 0;
        int count = 0;
        int idx = 0;
        while ((idx = str.indexOf(sub, idx)) != -1) {
            count++;
            idx += sub.length();
        }
        return count;
    }

    private String readClasspathFile(PathMatchingResourcePatternResolver resolver, String location) {
        try {
            Resource res = resolver.getResource(location);
            try (InputStream is = res.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load prompt asset: " + location, e);
        }
    }

    public StepOutputConfig getStepOutputConfig(int stepIndex) {
        return STEP_OUTPUT_CONFIGS.getOrDefault(stepIndex, new StepOutputConfig("bundle.md", List.of()));
    }

    public String buildOutputDeliveryBlock(String bundleName, List<String> files) {
        int n = files.size();
        String fileOrder = String.join(", ", files);

        StringBuilder sb = new StringBuilder();
        sb.append("\n\n=== OUTPUT DELIVERY (this section overrides every earlier output instruction) ===\n");
        sb.append("Deliver your answer as ONE downloadable Markdown file named ").append(bundleName).append(". ");
        sb.append("Use your interface's file, artifact or canvas feature so the user can download it as a .md file. ");
        sb.append("If your interface cannot create a downloadable file, print the complete file content once inside a single fenced block opened with four backticks and the word markdown, and write nothing outside it.\n");
        sb.append("The file contains ").append(n).append(" document(s) in this order: ").append(fileOrder).append(". ");
        sb.append("Separate them with these exact marker lines, each on its own line:\n");
        for (String file : files) {
            sb.append("=====FILE: ").append(file).append("=====\n");
            sb.append("(the full document)\n");
            sb.append("=====END FILE=====\n");
        }
        sb.append("======================================================================\n");
        return sb.toString();
    }

    public String buildOutputDeliveryBlock(int stepIndex) {
        StepOutputConfig cfg = getStepOutputConfig(stepIndex);
        return buildOutputDeliveryBlock(cfg.bundleName(), cfg.files());
    }

    public boolean isStepUnlocked(UUID roomId, int stepIndex) {
        if (stepIndex <= 1) return true;
        String prevKey = STEP_KEYS.get(stepIndex - 2);
        return planStepRepository.findByRoomIdAndStepKey(roomId, prevKey)
                .map(PlanStep::isValidated)
                .orElse(false);
    }

    @Transactional
    public PlanPromptResponseDto getOrBuildPrompt(UUID roomId, int stepIndex, User user, boolean forceRefresh) {
        roomAccess.requireMember(roomId, user);
        if (stepIndex < 1 || stepIndex > 4) {
            throw new BadRequestException("INVALID_STEP_INDEX", "Step index must be between 1 and 5");
        }

        StepOutputConfig outputConfig = getStepOutputConfig(stepIndex);
        boolean unlocked = isStepUnlocked(roomId, stepIndex);

        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        List<BriefRubricItem> rubric = brief != null ? rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId()) : Collections.emptyList();
        List<Idea> approvedIdeas = ideaRepository.findByRoomIdAndStatus(roomId, "APPROVED");
        List<Idea> pendingIdeas = ideaRepository.findByRoomIdAndStatus(roomId, "PENDING");
        List<Idea> rejectedIdeas = ideaRepository.findByRoomIdAndStatus(roomId, "REJECTED");
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<TeamCharterResponse> charters = charterRepository.findByRoomId(roomId);
        Map<UUID, User> memberUsers = userRepository.findAllById(members.stream().map(RoomMember::getUserId).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<UUID, List<String>> memberSkills = new HashMap<>();
        for (RoomMember m : members) {
            List<String> s = skillRepository.findByMemberId(m.getId()).stream().map(RoomMemberSkill::getSkill).toList();
            memberSkills.put(m.getId(), s);
        }

        String factsHash = computeFactsHash(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas, members, memberUsers, memberSkills, charters);
        String priorText = buildPrior(roomId, stepIndex);
        String priorHash = hashString(priorText);

        Optional<PlanStepPrompt> cachedDbOpt = promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex);
        AnalysisResult analysis = getOrComputeAnalysis(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters, stepIndex, factsHash, user, forceRefresh);

        String analysisState = analysis != null
                ? (analysis.skippedNoKey() ? "SKIPPED_NO_KEY" : (analysis.fallback() ? "FALLBACK" : "READY"))
                : "PENDING";

        String mode = analysis != null ? analysis.mode() : "BALANCED";
        String verdict = analysis != null ? analysis.ideaVerdict() : "Standard concept requiring concrete execution.";
        List<String> missingInputs = computeMissingInputs(brief, rubric, approvedIdeas, members, memberUsers, room);

        if (!unlocked) {
            return new PlanPromptResponseDto(
                    null,
                    0,
                    mode,
                    verdict,
                    missingInputs,
                    false,
                    cachedDbOpt.map(p -> p.getGeneratedAt().toString()).orElse(null),
                    analysisState,
                    false,
                    outputConfig.files(),
                    outputConfig.bundleName()
            );
        }

        String promptKey = roomId + ":" + stepIndex + ":" + factsHash + ":" + priorHash;
        String fusedPrompt = promptCache.get(promptKey);

        if (fusedPrompt == null || forceRefresh) {
            if (cachedDbOpt.isPresent() && !forceRefresh && factsHash.equals(cachedDbOpt.get().getInputHash()) && !cachedDbOpt.get().isStale()) {
                fusedPrompt = cachedDbOpt.get().getPrompt();
                promptCache.put(promptKey, fusedPrompt);
            } else {
                long fuseStart = System.currentTimeMillis();
                String factsText = buildFacts(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                        members, memberUsers, memberSkills, charters, missingInputs, false);
                fusedPrompt = fusePrompt(roomId, stepIndex, factsText, analysis, priorText, factsHash);
                long fuseMs = System.currentTimeMillis() - fuseStart;
                log.info("stage_complete room={} step={} stage=FUSION ms={} outcome=SUCCESS", roomId, stepIndex, fuseMs);
            }
        }

        return new PlanPromptResponseDto(
                fusedPrompt,
                fusedPrompt.length(),
                mode,
                verdict,
                missingInputs,
                false,
                Instant.now().toString(),
                analysisState,
                true,
                outputConfig.files(),
                outputConfig.bundleName()
        );
    }

    public PlanPromptResponseDto getOrAssemblePrompt(UUID roomId, int stepIndex, boolean forceRefresh, User user) {
        return getOrBuildPrompt(roomId, stepIndex, user, forceRefresh);
    }

    public String fusePrompt(UUID roomId, int stepIndex, String factsText, AnalysisResult analysis, String priorText, String factsHash) {
        String template = stepTemplates.get(stepIndex);
        String analysisBlock = analysis != null ? analysis.analysisBlock() : "MODE: BALANCED\nDETAIL_LEVEL: MODERATE\nIDEA_VERDICT: 5/10. Standard concept.\n";
        if (analysisBlock.length() > 3500) {
            analysisBlock = analysisBlock.substring(0, 3500);
        }

        String fused = template.replace("{{FACTS}}", factsText)
                .replace("{{ANALYSIS}}", analysisBlock)
                .replace("{{PRIOR}}", priorText != null ? priorText : "");

        int durationVal = 36;
        try {
            Room r = roomRepository.findById(roomId).orElse(null);
            if (r != null && r.getDurationHours() > 0) durationVal = r.getDurationHours();
        } catch (Exception ignored) {}
        if (!fused.contains(durationVal + " hours") && !fused.contains(durationVal + "h") && !fused.contains(String.valueOf(durationVal))) {
            fused = "## EVENT\n- Duration: " + durationVal + " hours\n\n" + fused;
        }

        if (!fused.contains("=== OUTPUT DELIVERY")) {
            fused = fused + buildOutputDeliveryBlock(stepIndex);
        }
        if (fused.length() > 16000) {
            fused = fused.substring(0, 16000);
        }

        String priorHash = hashString(priorText != null ? priorText : "");
        String promptKey = roomId + ":" + stepIndex + ":" + factsHash + ":" + priorHash;
        promptCache.put(promptKey, fused);

        final String finalFused = fused;
        // Persist to DB
        Optional<PlanStepPrompt> existingOpt = promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex);
        PlanStepPrompt toSave = existingOpt.orElseGet(() -> new PlanStepPrompt(
                roomId, stepIndex, STEP_KEYS.get(stepIndex - 1), finalFused, finalFused.length(),
                analysis != null ? analysis.mode() : "BALANCED",
                analysis != null ? analysis.ideaVerdict() : "5/10. Standard concept.",
                "[]", false, factsHash, analysis != null ? analysis.assessmentLocked() : null
        ));
        toSave.setPrompt(fused);
        toSave.setCharCount(fused.length());
        if (analysis != null) {
            toSave.setMode(analysis.mode());
            toSave.setIdeaVerdict(analysis.ideaVerdict());
            toSave.setAssessmentLocked(analysis.assessmentLocked());
        }
        toSave.setInputHash(factsHash);
        toSave.setStale(false);
        toSave.setUpdatedAt(Instant.now());
        try {
            promptRepository.save(toSave);
        } catch (org.springframework.dao.DataIntegrityViolationException dive) {
            promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex).ifPresent(p -> {
                p.setPrompt(finalFused);
                p.setCharCount(finalFused.length());
                if (analysis != null) {
                    p.setMode(analysis.mode());
                    p.setIdeaVerdict(analysis.ideaVerdict());
                    p.setAssessmentLocked(analysis.assessmentLocked());
                }
                p.setInputHash(factsHash);
                p.setStale(false);
                p.setUpdatedAt(Instant.now());
                promptRepository.save(p);
            });
        }

        return fused;
    }

    public AnalysisResult getOrComputeAnalysis(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<Idea> pendingIdeas,
            List<Idea> rejectedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            Map<UUID, List<String>> memberSkills,
            List<TeamCharterResponse> charters,
            int stepIndex,
            String factsHash,
            User user,
            boolean forceRefresh
    ) {
        String cacheKey = room.getId() + ":" + stepIndex + ":" + factsHash;
        if (!forceRefresh && analysisCache.containsKey(cacheKey)) {
            return analysisCache.get(cacheKey);
        }

        // Check if DB prompt has matching factsHash
        Optional<PlanStepPrompt> promptOpt = promptRepository.findByRoomIdAndStepIndex(room.getId(), stepIndex);
        if (!forceRefresh && promptOpt.isPresent() && factsHash.equals(promptOpt.get().getInputHash()) && !promptOpt.get().isStale()) {
            PlanStepPrompt dbPrompt = promptOpt.get();
            AnalysisResult fromDb = new AnalysisResult(
                    "MODE: " + dbPrompt.getMode() + "\nIDEA_VERDICT: " + dbPrompt.getIdeaVerdict() + "\n" + (dbPrompt.getAssessmentLocked() != null ? dbPrompt.getAssessmentLocked() : ""),
                    dbPrompt.getMode() != null ? dbPrompt.getMode() : "BALANCED",
                    dbPrompt.getIdeaVerdict() != null ? dbPrompt.getIdeaVerdict() : "Standard concept requiring concrete execution.",
                    dbPrompt.getAssessmentLocked(),
                    false
            );
            analysisCache.put(cacheKey, fromDb);
            return fromDb;
        }

        List<String> missingInputs = computeMissingInputs(brief, rubric, approvedIdeas, members, memberUsers, room);
        String factsText = buildFacts(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters, missingInputs, false);
        String detailHint = buildDetailHint(approvedIdeas, brief);
        String ideasMd = ideasService.exportIdeasMarkdown(room.getId(), user);
        String priorText = buildPrior(room.getId(), stepIndex);

        String lockedAssessment = null;
        if (stepIndex > 1) {
            Optional<PlanStepPrompt> step1Prompt = promptRepository.findByRoomIdAndStepIndex(room.getId(), 1);
            if (step1Prompt.isPresent() && step1Prompt.get().getAssessmentLocked() != null) {
                lockedAssessment = step1Prompt.get().getAssessmentLocked();
            } else if (analysisCache.containsKey(room.getId() + ":1:" + factsHash)) {
                lockedAssessment = analysisCache.get(room.getId() + ":1:" + factsHash).assessmentLocked();
            }
        }

        AnalysisResult result = runAnalysis(room, STEP_KEYS.get(stepIndex - 1), stepGroqPrompts.get(stepIndex),
                factsText, ideasMd, priorText, detailHint, lockedAssessment, user);

        analysisCache.put(cacheKey, result);
        return result;
    }

    public AnalysisResult runAnalysis(
            Room room,
            String stepKey,
            String groqSystem,
            String facts,
            String ideasMd,
            String prior,
            String detailHint,
            String lockedAssessment,
            User user
    ) {
        int stepIdx = STEP_KEYS.indexOf(stepKey) + 1;
        long startTime = System.currentTimeMillis();

        boolean aiAllowed = roomService.isAiAllowed(room.getId());
        if (!aiAllowed) {
            log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=SKIPPED", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
            return buildFallbackAnalysis(detailHint, lockedAssessment);
        }

        boolean userHasKey = user != null ? aiService.isConfigured(user.getId()) : aiService.isConfigured();
        if (!userHasKey) {
            log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=SKIPPED_NO_KEY", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
            AnalysisResult fb = buildFallbackAnalysis(detailHint, lockedAssessment);
            return new AnalysisResult(fb.analysisBlock(), fb.mode(), fb.ideaVerdict(), fb.assessmentLocked(), true, true);
        }


        // Capped inputs per budget: facts <= 7000, ideas.md <= 5000, prior <= 3000
        String cappedFacts = facts != null && facts.length() > 7000 ? facts.substring(0, 7000) : facts;
        String cappedIdeas = ideasMd != null && ideasMd.length() > 5000 ? ideasMd.substring(0, 5000) : (ideasMd != null ? ideasMd : "");
        String cappedPrior = prior != null && prior.length() > 3000 ? prior.substring(0, 3000) : (prior != null ? prior : "");

        String rawUserMsg = cappedFacts + "\n\n=== CONTEXT.MD ===\n" + cappedIdeas + "\n\n=== PRIOR ===\n" + cappedPrior + "\n\n" + detailHint;
        if (lockedAssessment != null && !lockedAssessment.isBlank()) {
            rawUserMsg += "\n\nASSESSMENT_LOCKED:\n" + lockedAssessment;
        }
        final String userMsg = rawUserMsg;

        String featureTag = "plan.analysis." + stepKey;
        Semaphore roomLock = roomAiLocks.computeIfAbsent(room.getId(), k -> new Semaphore(1));

        boolean lockAcquired = false;
        try {
            lockAcquired = roomLock.tryAcquire(3, TimeUnit.SECONDS);
            if (!lockAcquired) {
                log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=FALLBACK", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
                return buildFallbackAnalysis(detailHint, lockedAssessment);
            }

            long elapsedSoFar = System.currentTimeMillis() - startTime;
            long remainingMs = Math.min(11000, Math.max(1000, 12000 - elapsedSoFar));

            CompletableFuture<String> callFuture = CompletableFuture.supplyAsync(() ->
                    aiService.chat(featureTag, room.getId(), user != null ? user.getId() : null, groqSystem, List.of(), userMsg, 700)
            );

            String reply = callFuture.get(remainingMs, TimeUnit.MILLISECONDS);

            if (isValidAnalysisReply(reply)) {
                log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=SUCCESS", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
                return parseAnalysisReply(reply, false);
            }

            // Exactly one Groq call: no repair retry, fallback immediately
            log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=FALLBACK", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
            return buildFallbackAnalysis(detailHint, lockedAssessment);
        } catch (Exception e) {
            log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome=FALLBACK", room.getId(), stepIdx, System.currentTimeMillis() - startTime);
            return buildFallbackAnalysis(detailHint, lockedAssessment);
        } finally {
            if (lockAcquired) {
                roomLock.release();
            }
        }
    }

    public AnalysisResult getCachedAnalysis(UUID roomId, int stepIndex, String factsHash) {
        return analysisCache.get(roomId + ":" + stepIndex + ":" + factsHash);
    }

    public boolean hasCachedOrPersistedPrompt(UUID roomId, int stepIndex) {
        return promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex).isPresent();
    }

    public void storeAnalysis(UUID roomId, int stepIndex, String factsHash, AnalysisResult result) {
        analysisCache.put(roomId + ":" + stepIndex + ":" + factsHash, result);
    }

    private boolean isValidAnalysisReply(String reply) {
        if (reply == null || !reply.trim().startsWith("MODE:")) return false;
        String[] requiredKeys = {"MODE:", "DETAIL_LEVEL:", "IDEA_VERDICT:", "BLUNT_ASSESSMENT:", "MUST_EMPHASISE:", "GAPS_TO_FILL:", "RULE_TRAPS:", "RISKS_FOR_THIS_PHASE:"};
        for (String k : requiredKeys) {
            if (!reply.contains(k)) return false;
        }
        return true;
    }

    private AnalysisResult parseAnalysisReply(String reply, boolean fallback) {
        String clean = reply.trim();
        String mode = extractKeyValue(clean, "MODE:");
        if (mode == null || (!mode.contains("BUILD_OUT") && !mode.contains("BALANCED"))) {
            mode = clean.contains("BUILD_OUT") ? "BUILD_OUT" : "BALANCED";
        } else {
            mode = mode.contains("BUILD_OUT") ? "BUILD_OUT" : "BALANCED";
        }

        String verdict = extractKeyValue(clean, "IDEA_VERDICT:");
        if (verdict == null) verdict = "5/10. Standard concept requiring concrete execution.";

        String locked = extractLockedFromReply(clean);
        return new AnalysisResult(clean, mode, verdict, locked, fallback);
    }

    private String extractLockedFromReply(String reply) {
        StringBuilder sb = new StringBuilder();
        String[] keys = {"MODE:", "DETAIL_LEVEL:", "IDEA_VERDICT:", "BLUNT_ASSESSMENT:"};
        for (String k : keys) {
            int start = reply.indexOf(k);
            if (start >= 0) {
                int end = reply.length();
                for (String nextK : List.of("DETAIL_LEVEL:", "IDEA_VERDICT:", "BLUNT_ASSESSMENT:", "MUST_EMPHASISE:")) {
                    if (nextK.equals(k)) continue;
                    int nIdx = reply.indexOf(nextK, start + k.length());
                    if (nIdx > start && nIdx < end) {
                        end = nIdx;
                    }
                }
                sb.append(reply.substring(start, end).trim()).append("\n");
            }
        }
        return sb.toString().trim();
    }

    public AnalysisResult buildFallbackAnalysis(String detailHint, String lockedAssessment) {
        boolean thin = detailHint.contains("filled_idea_fields=0") || detailHint.contains("filled_idea_fields=1") || detailHint.contains("idea_char_count=0");
        String mode = thin ? "BUILD_OUT" : "BALANCED";

        if (lockedAssessment != null && lockedAssessment.contains("MODE: BUILD_OUT")) {
            mode = "BUILD_OUT";
        } else if (lockedAssessment != null && lockedAssessment.contains("MODE: BALANCED")) {
            mode = "BALANCED";
        }

        String verdict = "6/10. Functional premise with execution risk.";
        if (lockedAssessment != null && lockedAssessment.contains("IDEA_VERDICT:")) {
            verdict = extractKeyValue(lockedAssessment, "IDEA_VERDICT:");
            if (verdict == null) verdict = "6/10. Functional premise with execution risk.";
        }

        String block = "MODE: " + mode + "\n" +
                "DETAIL_LEVEL: " + (thin ? "EXTENSIVE" : "MODERATE") + "\n" +
                "IDEA_VERDICT: " + verdict + "\n" +
                "BLUNT_ASSESSMENT: Concept is viable for a hackathon timeframe; maintain strict MVP scope.\n" +
                "MUST_EMPHASISE: Demonstrate clear core journey within the first minute.\n" +
                "GAPS_TO_FILL: Concrete task assignments and fallback handling for key integrations.\n" +
                "RULE_TRAPS: Avoid out-of-scope third-party dependencies not permitted by rubric.\n" +
                "RISKS_FOR_THIS_PHASE: Feature creep and unverified external API stability.\n";

        String locked = "MODE: " + mode + "\n" +
                "DETAIL_LEVEL: " + (thin ? "EXTENSIVE" : "MODERATE") + "\n" +
                "IDEA_VERDICT: " + verdict + "\n" +
                "BLUNT_ASSESSMENT: Concept is viable for a hackathon timeframe; maintain strict MVP scope.\n";

        return new AnalysisResult(block, mode, verdict, locked, true);
    }

    public String computeFactsHash(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<Idea> pendingIdeas,
            List<Idea> rejectedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            Map<UUID, List<String>> memberSkills,
            List<TeamCharterResponse> charters
    ) {
        Map<String, String> sectionHashes = new LinkedHashMap<>();

        // 1. Room fields (name, templateId, description)
        Map<String, Object> roomData = new LinkedHashMap<>();
        roomData.put("name", normalizeWs(room.getName()));
        roomData.put("templateId", normalizeWs(room.getTemplateId()));
        roomData.put("description", normalizeWs(room.getDescription()));
        sectionHashes.put("room", hashCanonical(roomData));

        // 2. Notes
        sectionHashes.put("notes", hashString(normalizeWs(room.getPlanNotes())));

        // 3. Brief fields and sorted rubric
        Map<String, Object> briefData = new LinkedHashMap<>();
        if (brief != null) {
            briefData.put("aiPolicy", normalizeWs(brief.getAiPolicy()));
            briefData.put("confirmed", brief.isConfirmed());
            briefData.put("problemStatement", normalizeWs(brief.getProblemStatement()));
            briefData.put("targetAudience", normalizeWs(brief.getTargetAudience()));
            briefData.put("techRules", normalizeWs(brief.getTechRules()));
            List<Map<String, Object>> rubricList = rubric.stream()
                    .sorted(Comparator.comparing(BriefRubricItem::getPosition).thenComparing(r -> normalizeWs(r.getCriterion())))
                    .map(r -> {
                        Map<String, Object> rm = new LinkedHashMap<>();
                        rm.put("criterion", normalizeWs(r.getCriterion()));
                        rm.put("weight", r.getWeight());
                        return rm;
                    }).toList();
            briefData.put("rubric", rubricList);
        }
        sectionHashes.put("brief", hashCanonical(briefData));

        // 4. Approved ideas (id + text + title) sorted by ID
        List<Map<String, Object>> approvedList = approvedIdeas.stream()
                .sorted(Comparator.comparing(Idea::getId))
                .map(i -> {
                    Map<String, Object> im = new LinkedHashMap<>();
                    im.put("id", i.getId().toString());
                    im.put("text", normalizeWs(i.getText()));
                    im.put("title", normalizeWs(getIdeaTitle(i)));
                    return im;
                }).toList();
        sectionHashes.put("approvedIdeas", hashCanonical(approvedList));

        // 5. Pending and rejected summaries
        Map<String, Object> summaries = new LinkedHashMap<>();
        List<String> pendingIds = pendingIdeas.stream().map(i -> i.getId().toString()).sorted().toList();
        List<String> rejectedIds = rejectedIdeas.stream().map(i -> i.getId().toString()).sorted().toList();
        summaries.put("pendingCount", pendingIdeas.size());
        summaries.put("pendingIds", pendingIds);
        summaries.put("rejectedCount", rejectedIdeas.size());
        summaries.put("rejectedIds", rejectedIds);
        sectionHashes.put("pendingRejectedSummaries", hashCanonical(summaries));

        // 6. Member handles + roles + skills
        List<Map<String, Object>> memberList = members.stream()
                .map(m -> {
                    User u = memberUsers.get(m.getUserId());
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("handle", getHandle(u));
                    mm.put("role", normalizeWs(m.getRole()));
                    List<String> roles = parseJsonList(u != null ? u.getRoleTags() : "[]").stream().sorted().toList();
                    mm.put("roleTags", roles);
                    List<String> skills = memberSkills.getOrDefault(m.getId(), Collections.emptyList()).stream().sorted().toList();
                    mm.put("skills", skills);
                    return mm;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("handle")))
                .toList();
        sectionHashes.put("members", hashCanonical(memberList));

        // 7. Charters sorted by userId
        List<Map<String, Object>> charterList = charters.stream()
                .sorted(Comparator.comparing(c -> c.getUserId().toString()))
                .map(c -> {
                    Map<String, Object> cm = new LinkedHashMap<>();
                    cm.put("userId", c.getUserId().toString());
                    cm.put("goal", normalizeWs(c.getGoal()));
                    cm.put("hoursAvailable", c.getHoursAvailable());
                    cm.put("normsAcknowledged", c.isNormsAcknowledged());
                    return cm;
                }).toList();
        sectionHashes.put("charters", hashCanonical(charterList));

        // Track and log section changes
        Map<String, String> prevSections = roomSectionHashes.get(room.getId());
        if (prevSections != null) {
            List<String> changed = new ArrayList<>();
            for (Map.Entry<String, String> entry : sectionHashes.entrySet()) {
                if (!entry.getValue().equals(prevSections.get(entry.getKey()))) {
                    changed.add(entry.getKey());
                }
            }
            if (!changed.isEmpty()) {
                log.info("factsHash changed for room {}: changed sections: {}", room.getId(), changed);
            }
        }
        roomSectionHashes.put(room.getId(), sectionHashes);

        StringBuilder combined = new StringBuilder();
        for (Map.Entry<String, String> entry : sectionHashes.entrySet()) {
            combined.append(entry.getKey()).append(":").append(entry.getValue()).append(";");
        }
        return hashString(combined.toString());
    }

    private String normalizeWs(String str) {
        if (str == null) return "";
        return str.replaceAll("\\s+", " ").trim();
    }

    private String hashCanonical(Object obj) {
        try {
            String json = objectMapper.writeValueAsString(obj);
            return hashString(json);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private String hashString(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    public String buildFactsText(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            Map<UUID, List<String>> memberSkills,
            List<TeamCharterResponse> charters
    ) {
        return buildFacts(room, brief, rubric, approvedIdeas, List.of(), List.of(), members, memberUsers, memberSkills, charters, List.of(), false);
    }

    public String buildFacts(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<Idea> pendingIdeas,
            List<Idea> rejectedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            Map<UUID, List<String>> memberSkills,
            List<TeamCharterResponse> charters,
            List<String> missingInputs,
            boolean relaxedCompression
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("## EVENT\n");
        int durationHours = room != null && room.getDurationHours() > 0 ? room.getDurationHours() : 36;
        Instant startsAt = room != null && room.getStartsAt() != null ? room.getStartsAt()
                : (room != null && room.getCreatedAt() != null ? room.getCreatedAt() : Instant.now());
        Instant endsAt = room != null && room.getEndsAt() != null ? room.getEndsAt()
                : startsAt.plus(Duration.ofHours(durationHours));
        Instant freezeAt = room != null && room.getFreezeAt() != null ? room.getFreezeAt()
                : startsAt.plus(Duration.ofMillis((long) (durationHours * 3600_000L * 0.70)));

        sb.append("- Duration: ").append(durationHours).append(" hours\n");
        sb.append("- Start: ").append(startsAt).append("\n");
        sb.append("- Freeze: ").append(freezeAt).append("\n");
        sb.append("- End: ").append(endsAt).append("\n");
        sb.append("- Event Track/Template: ").append(brief != null && brief.getTracksAndPrizes() != null ? sanitize(brief.getTracksAndPrizes(), 100) : (room != null && room.getTemplateId() != null ? room.getTemplateId() : "General")).append("\n");
        sb.append("- Event Rules & Constraints: ").append(brief != null ? sanitize(brief.getTechRules(), 500) : "Standard hackathon rules apply").append("\n");
        sb.append("- AI Usage Policy: ").append(brief != null && brief.getAiPolicy() != null ? sanitize(brief.getAiPolicy(), 300) : "Standard AI policy").append("\n");
        sb.append("- Rubric Criteria:\n");
        if (rubric == null || rubric.isEmpty()) {
            sb.append("  * General Hackathon Scoring (Default 100%)\n");
        } else {
            for (BriefRubricItem r : rubric) {
                sb.append("  * ").append(sanitize(r.getCriterion(), 150))
                        .append(" (Weight: ").append(r.getWeight()).append("%)\n");
            }
        }
        sb.append("\n");

        sb.append("## APPROVED IDEA\n");
        if (approvedIdeas == null || approvedIdeas.isEmpty()) {
            sb.append("No idea approved yet.\n\n");
        } else {
            for (Idea idea : approvedIdeas) {
                sb.append("Title: ").append(sanitize(getIdeaTitle(idea), 120)).append("\n");
                sb.append("Description: ").append(userData(idea.getText())).append("\n\n");
            }
        }

        sb.append("## TEAM\n");
        for (RoomMember m : members) {
            if (m.getStatus() == null || "ACTIVE".equalsIgnoreCase(m.getStatus())) {
                User u = memberUsers != null ? memberUsers.get(m.getUserId()) : null;
                String handle = getHandleWithRole(m, u);
                sb.append("- ").append(handle).append(" (Role: ").append(m.getRole()).append(")\n");
            }
        }
        sb.append("\n");

        sb.append("## TEAM CHARTER & NOTES\n");
        if (charters != null && !charters.isEmpty()) {
            for (TeamCharterResponse c : charters) {
                User u = memberUsers != null ? memberUsers.get(c.getUserId()) : null;
                String handle = u != null ? getHandle(u) : c.getUserId().toString();
                sb.append("- @").append(handle).append(": Goal=").append(c.getGoal())
                        .append(", Hours=").append(c.getHoursAvailable())
                        .append(", Norms=").append(c.isNormsAcknowledged()).append("\n");
            }
        }
        if (room != null && room.getPlanNotes() != null && !room.getPlanNotes().isBlank()) {
            sb.append("- Room Plan Notes: ").append(userData(room.getPlanNotes())).append("\n");
        }
        sb.append("\n");

        return sb.toString();
    }

    public String getIdeaTitle(Idea idea) {
        if (idea == null || idea.getText() == null) return "";
        String firstLine = idea.getText().split("\\R", 2)[0].trim();
        if (firstLine.length() > 60) {
            return firstLine.substring(0, 60).trim();
        }
        return firstLine;
    }

    public String buildPrior(UUID roomId, int stepIndex) {
        if (stepIndex <= 1) return "None (Step 1 is the foundational document).";

        StringBuilder sb = new StringBuilder();
        for (int i = 1; i < stepIndex; i++) {
            String prevKey = STEP_KEYS.get(i - 1);
            Optional<PlanStep> stepOpt = planStepRepository.findByRoomIdAndStepKey(roomId, prevKey);
            if (stepOpt.isPresent() && stepOpt.get().isValidated() && stepOpt.get().getAnswer() != null) {
                sb.append("--- STEP ").append(i).append(" (").append(prevKey.toUpperCase()).append(") DIGEST ---\n");
                String ans = stepOpt.get().getAnswer();
                if (ans.length() > 1500) {
                    ans = ans.substring(0, 1500) + "... [truncated for brevity]";
                }
                sb.append(ans).append("\n\n");
            }
        }
        return sb.length() > 0 ? sb.toString() : "No preceding validated documents yet.";
    }

    public String buildDetailHint(List<Idea> approvedIdeas, Brief brief) {
        int filledFields = 0;
        int ideaCharCount = 0;
        if (approvedIdeas != null && !approvedIdeas.isEmpty()) {
            for (Idea i : approvedIdeas) {
                if (i.getText() != null) {
                    ideaCharCount += i.getText().length();
                    if (!i.getText().isBlank()) filledFields++;
                }
            }
        }
        int emptyBriefFields = 0;
        if (brief == null || brief.getProblemStatement() == null || brief.getProblemStatement().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getTargetAudience() == null || brief.getTargetAudience().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getTechRules() == null || brief.getTechRules().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getAiPolicy() == null || brief.getAiPolicy().isBlank()) emptyBriefFields++;

        return "DETAIL_HINT: filled_idea_fields=" + filledFields + ", idea_char_count=" + ideaCharCount + ", empty_brief_fields=" + emptyBriefFields;
    }

    public List<String> computeMissingInputs(
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            Room room
    ) {
        List<String> list = new ArrayList<>();
        if (approvedIdeas == null || approvedIdeas.isEmpty()) list.add("approved_ideas");
        if (brief == null || brief.getProblemStatement() == null || brief.getProblemStatement().isBlank()) list.add("problem_statement");
        if (rubric == null || rubric.isEmpty()) list.add("rubric_criteria");
        if (brief == null || brief.getDeadlines() == null || brief.getDeadlines().isBlank()) list.add("deadlines");
        if (brief == null || brief.getTechRules() == null || brief.getTechRules().isBlank()) list.add("tech_rules");

        boolean anyMissingRole = false;
        for (RoomMember m : members) {
            User u = memberUsers.get(m.getUserId());
            List<String> roles = parseJsonList(u != null ? u.getRoleTags() : "[]");
            if (roles.isEmpty()) anyMissingRole = true;
        }
        if (anyMissingRole) list.add("member_role_tags");
        if (room == null || room.getDurationHours() <= 0) list.add("duration");
        if (room != null && (room.getPlanNotes() == null || room.getPlanNotes().isBlank())) list.add("plan_notes");

        return list;
    }

    public String getStepTemplate(int stepIndex) {
        return stepTemplates.get(stepIndex);
    }

    public String getStepGroqPrompt(int stepIndex) {
        return stepGroqPrompts.get(stepIndex);
    }

    public String getHandle(User u) {
        if (u == null) return "@member";
        if (u.getUsername() != null && !u.getUsername().isBlank()) {
            return "@" + u.getUsername().trim();
        }
        if (u.getLogin() != null && !u.getLogin().isBlank()) {
            return "@" + u.getLogin().trim();
        }
        return "@" + (u.getName() != null ? u.getName().replaceAll("\\s+", "").toLowerCase() : "member");
    }

    public String getHandleWithRole(RoomMember m, User u) {
        String handle = getHandle(u);
        String role = m != null && m.getRole() != null ? m.getRole() : "Member";
        List<String> roles = parseJsonList(u != null ? u.getRoleTags() : "[]");
        String roleStr = !roles.isEmpty() ? String.join(", ", roles) : role;
        return handle + " (" + roleStr + ")";
    }

    private String sanitize(String text, int maxLen) {
        if (text == null) return "";
        String clean = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
        return clean.length() > maxLen ? clean.substring(0, maxLen) : clean;
    }

    private String userData(String text) {
        if (text == null || text.isBlank()) return "<<<USER_DATA (empty) >>>";
        String sanitized = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
        return "<<<USER_DATA " + sanitized + " >>>";
    }

    private String extractKeyValue(String text, String key) {
        int idx = text.indexOf(key);
        if (idx < 0) return null;
        int nextLine = text.indexOf("\n", idx);
        if (nextLine < 0) nextLine = text.length();
        return text.substring(idx + key.length(), nextLine).trim();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
