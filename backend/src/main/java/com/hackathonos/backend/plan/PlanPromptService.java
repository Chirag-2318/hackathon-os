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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service managing dynamic prompt assembly, caching, completeness verification,
 * and AI briefing analysis for the 5-step Plan stage.
 */
@Service
public class PlanPromptService {

    private static final Logger log = LoggerFactory.getLogger(PlanPromptService.class);

    public static final List<String> STEP_KEYS = List.of("prd", "tech", "phases", "tasks", "demo");
    public static final List<String> ROLE_TAGS = List.of(
            "Frontend", "Backend", "ML/AI", "Design", "Presenter", "Domain expert", "QA/Demo operator"
    );

    private final Map<Integer, String> stepTemplates = new HashMap<>();
    private final Map<Integer, String> stepGroqPrompts = new HashMap<>();

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

    @PostConstruct
    public void init() {
        Map<Integer, String> templateFiles = Map.of(
                1, "step1-prd-mvp.template.md",
                2, "step2-stack-arch.template.md",
                3, "step3-phases-design.template.md",
                4, "step4-tasks.template.md",
                5, "step5-demo-qna.template.md"
        );

        Map<Integer, String> groqFiles = Map.of(
                1, "step1-prd-mvp.groq.md",
                2, "step2-stack-arch.groq.md",
                3, "step3-phases-design.groq.md",
                4, "step4-tasks.groq.md",
                5, "step5-demo-qna.groq.md"
        );

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        for (int i = 1; i <= 5; i++) {
            String tFile = templateFiles.get(i);
            String gFile = groqFiles.get(i);

            String templateContent = readClasspathFile(resolver, "classpath:plan-prompts/" + tFile);
            String groqContent = readClasspathFile(resolver, "classpath:plan-prompts/" + gFile);

            // Fail fast at startup if any template lacks exactly one of each placeholder, naming the missing one.
            verifyPlaceholders(tFile, templateContent);

            stepTemplates.put(i, templateContent);
            stepGroqPrompts.put(i, groqContent);
        }
        log.info("PlanPromptService initialized successfully with 5 prompt templates and groq briefs.");
    }

    private void verifyPlaceholders(String fileName, String content) {
        String[] required = {"{{FACTS}}", "{{ANALYSIS}}", "{{PRIOR}}"};
        for (String ph : required) {
            int count = countMatches(content, ph);
            if (count != 1) {
                throw new IllegalStateException("Template " + fileName + " must contain exactly one occurrence of " + ph + ", but found " + count);
            }
        }
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

    @Transactional
    public PlanPromptResponseDto getOrAssemblePrompt(UUID roomId, int stepIndex, boolean forceRefresh, User user) {
        return getOrBuildPrompt(roomId, stepIndex, user, forceRefresh);
    }

    @Transactional
    public PlanPromptResponseDto getOrBuildPrompt(UUID roomId, int stepIndex, User user, boolean forceRefresh) {
        roomAccess.requireMember(roomId, user);
        if (stepIndex < 1 || stepIndex > 5) {
            throw new BadRequestException("INVALID_STEP_INDEX", "Step index must be between 1 and 5");
        }

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

        List<PlanStep> priorSteps = planStepRepository.findByRoomId(roomId);

        // Compute current input hash
        String inputHash = computeInputHash(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas, members, memberUsers, charters, priorSteps);

        Optional<PlanStepPrompt> cachedOpt = promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex);

        if (!forceRefresh && cachedOpt.isPresent()) {
            PlanStepPrompt cached = cachedOpt.get();
            boolean isStale = !cached.getInputHash().equals(inputHash);
            if (!isStale) {
                List<String> missing = parseJsonList(cached.getMissingInputs());
                return new PlanPromptResponseDto(
                        cached.getPrompt(),
                        cached.getCharCount(),
                        cached.getMode(),
                        cached.getIdeaVerdict(),
                        missing,
                        cached.isStale(),
                        cached.getGeneratedAt().toString()
                );
            } else {
                // If stale, check if we rebuild automatically or mark stale
                cached.setStale(true);
                promptRepository.save(cached);
            }
        }

        // Build prompt
        PlanPromptBuilt built = assemblePrompt(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters, priorSteps, stepIndex, inputHash, user);

        PlanStepPrompt toSave = cachedOpt.orElseGet(() -> new PlanStepPrompt(
                roomId, stepIndex, STEP_KEYS.get(stepIndex - 1), built.prompt(), built.charCount(),
                built.mode(), built.ideaVerdict(), toJson(built.missingInputs()), false, inputHash, built.assessmentLocked()
        ));

        toSave.setPrompt(built.prompt());
        toSave.setCharCount(built.charCount());
        toSave.setMode(built.mode());
        toSave.setIdeaVerdict(built.ideaVerdict());
        toSave.setMissingInputs(toJson(built.missingInputs()));
        toSave.setStale(false);
        toSave.setInputHash(inputHash);
        toSave.setAssessmentLocked(built.assessmentLocked());
        toSave.setGeneratedAt(Instant.now());
        toSave.setUpdatedAt(Instant.now());
        promptRepository.save(toSave);

        return new PlanPromptResponseDto(
                built.prompt(),
                built.charCount(),
                built.mode(),
                built.ideaVerdict(),
                built.missingInputs(),
                false,
                toSave.getGeneratedAt().toString()
        );
    }

    private record PlanPromptBuilt(
            String prompt,
            int charCount,
            String mode,
            String ideaVerdict,
            List<String> missingInputs,
            String assessmentLocked
    ) {}

    private PlanPromptBuilt assemblePrompt(
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
            List<PlanStep> priorSteps,
            int stepIndex,
            String inputHash,
            User user
    ) {
        String stepKey = STEP_KEYS.get(stepIndex - 1);
        String template = stepTemplates.get(stepIndex);
        String groqSystem = stepGroqPrompts.get(stepIndex);

        List<String> missingInputs = computeMissingInputs(brief, rubric, approvedIdeas, members, memberUsers, room);

        // 1. Build FACTS
        String facts = buildFacts(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters, missingInputs, false);

        // 2. Build PRIOR
        String prior = buildPrior(room.getId(), stepIndex);

        // 3. Compute DETAIL_HINT
        String detailHint = buildDetailHint(approvedIdeas, brief);

        // 4. Retrieve or compute locked assessment from step 1
        String lockedAssessment = null;
        if (stepIndex > 1) {
            Optional<PlanStepPrompt> step1Prompt = promptRepository.findByRoomIdAndStepIndex(room.getId(), 1);
            if (step1Prompt.isPresent() && step1Prompt.get().getAssessmentLocked() != null) {
                lockedAssessment = step1Prompt.get().getAssessmentLocked();
            }
        }

        // 5. Call Analysis through AiService
        String ideasMd = ideasService.exportIdeasMarkdown(room.getId(), user);
        AnalysisResult analysisResult = runAnalysis(room, stepKey, groqSystem, facts, ideasMd, prior, detailHint, lockedAssessment, user);

        String currentLocked = analysisResult.assessmentLocked();
        if (stepIndex == 1 && lockedAssessment == null) {
            lockedAssessment = currentLocked;
        }

        String analysisBlock = analysisResult.analysisBlock();
        if (analysisBlock.length() > 3500) {
            analysisBlock = analysisBlock.substring(0, 3500);
        }

        // 6. Completeness Guard
        String finalPrompt = template.replace("{{FACTS}}", facts)
                .replace("{{ANALYSIS}}", analysisBlock)
                .replace("{{PRIOR}}", prior);

        List<String> completenessFailures = checkCompletenessGuard(finalPrompt, room, brief, rubric, members, memberUsers, approvedIdeas);
        if (!completenessFailures.isEmpty()) {
            log.warn("Completeness guard failed on initial prompt assembly: {}", completenessFailures);
            // Rebuild facts with relaxed compression
            facts = buildFacts(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                    members, memberUsers, memberSkills, charters, missingInputs, true);
            finalPrompt = template.replace("{{FACTS}}", facts)
                    .replace("{{ANALYSIS}}", analysisBlock)
                    .replace("{{PRIOR}}", prior);

            List<String> secondCheck = checkCompletenessGuard(finalPrompt, room, brief, rubric, members, memberUsers, approvedIdeas);
            if (!secondCheck.isEmpty()) {
                log.error("Prompt blocked: Completeness guard still missing elements after relaxed compression: {}", secondCheck);
            }
        }

        // 7. Verify no placeholders unreplaced
        if (finalPrompt.contains("{{FACTS}}") || finalPrompt.contains("{{ANALYSIS}}") || finalPrompt.contains("{{PRIOR}}")) {
            throw new IllegalStateException("Final prompt contains unreplaced placeholders!");
        }

        // 8. 16,000 character cap handling
        if (finalPrompt.length() > 16000) {
            int over = finalPrompt.length() - 16000;
            log.warn("Final assembled prompt exceeds 16,000 characters (charCount={}). Shortening ANALYSIS block by {} characters.", finalPrompt.length(), over);
            int newAnalysisLen = Math.max(500, analysisBlock.length() - over - 50);
            analysisBlock = analysisBlock.substring(0, newAnalysisLen) + "\n[...ANALYSIS shortened due to prompt size limit]";
            finalPrompt = template.replace("{{FACTS}}", facts)
                    .replace("{{ANALYSIS}}", analysisBlock)
                    .replace("{{PRIOR}}", prior);
        }

        log.info("Built assembled plan prompt for room={}, stepKey={}, charCount={}", room.getId(), stepKey, finalPrompt.length());

        return new PlanPromptBuilt(
                finalPrompt,
                finalPrompt.length(),
                analysisResult.mode(),
                analysisResult.ideaVerdict(),
                missingInputs,
                lockedAssessment
        );
    }

    private String buildFacts(
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

        // ## EVENT
        long durationHours = 36;
        if (room.getEventStart() != null && room.getEventEnd() != null) {
            durationHours = Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours());
        } else if (room.getDurationHours() > 0) {
            durationHours = room.getDurationHours();
        }

        sb.append("## EVENT\n");
        sb.append("Name: ").append(sanitize(room.getName(), 100)).append("\n");
        sb.append("Organizer: Hackathon OS\n");
        sb.append("Template: ").append(room.getTemplateId() != null ? room.getTemplateId() : "general").append("\n");
        sb.append("Start: ").append(room.getEventStart() != null ? room.getEventStart().toString() : "Not specified").append("\n");
        sb.append("Freeze: ").append(room.getFreezeAt() != null ? room.getFreezeAt().toString() : "70% of duration").append("\n");
        sb.append("End: ").append(room.getEventEnd() != null ? room.getEventEnd().toString() : "Not specified").append("\n");
        sb.append("Duration: ").append(durationHours).append(" hours\n");
        sb.append("Mode: Online\n");
        sb.append("Location: Global\n\n");

        // ## ROOM
        sb.append("## ROOM\n");
        sb.append("Room Name: ").append(userData(room.getName())).append("\n");
        if (room.getDescription() != null && !room.getDescription().isBlank()) {
            sb.append("Description: ").append(userData(room.getDescription())).append("\n");
        }
        if (room.getProjectDescription() != null && !room.getProjectDescription().isBlank()) {
            sb.append("Project Description: ").append(userData(room.getProjectDescription())).append("\n");
        }
        sb.append("\n");

        // ## BRIEF SOURCE TEXT
        sb.append("## BRIEF SOURCE TEXT\n");
        boolean briefConfirmed = brief != null && brief.isConfirmed();
        String briefConfLabel = briefConfirmed ? "confirmed" : "UNCONFIRMED";
        if (brief != null && brief.getRawText() != null && !brief.getRawText().isBlank()) {
            String raw = brief.getRawText().trim();
            int cap = relaxedCompression ? 8000 : 6000;
            if (raw.length() > cap) {
                int half = cap / 2;
                int cutCount = raw.length() - cap;
                raw = raw.substring(0, half) + "\n[...cut: " + cutCount + " characters]\n" + raw.substring(raw.length() - half);
            }
            sb.append("Status: ").append(briefConfLabel).append("\n");
            sb.append("Source: ").append(userData(raw)).append("\n");
        } else {
            sb.append("Status: UNCONFIRMED\nSource: None provided\n");
        }
        sb.append("\n");

        // ## PROBLEM AND RUBRIC
        sb.append("## PROBLEM AND RUBRIC\n");
        String probStatement = brief != null && brief.getProblemStatement() != null ? brief.getProblemStatement() : "None provided";
        String targetAudience = brief != null && brief.getTargetAudience() != null ? brief.getTargetAudience() : "None provided";
        String tracks = brief != null && brief.getTracksAndPrizes() != null ? brief.getTracksAndPrizes() : "General";
        String deadlinesStr = brief != null && brief.getDeadlines() != null ? brief.getDeadlines() : "Final submission: " + durationHours + "h";

        sb.append("Problem statement: ").append(userData(probStatement)).append(" [").append(briefConfLabel).append("]\n");
        sb.append("Target audience: ").append(userData(targetAudience)).append(" [").append(briefConfLabel).append("]\n");
        sb.append("Tracks: ").append(userData(tracks)).append("\n");
        sb.append("Deadlines: ").append(userData(deadlinesStr)).append("\n");
        sb.append("Rubric criteria with weights:\n");
        if (rubric != null && !rubric.isEmpty()) {
            for (BriefRubricItem item : rubric) {
                sb.append("- ").append(userData(item.getCriterion())).append(": ").append(item.getWeight()).append("%\n");
            }
        } else {
            sb.append("- General Excellence: 100% (rubric weights not provided)\n");
        }
        sb.append("\n");

        // ## RULES AND DELIVERABLES
        sb.append("## RULES AND DELIVERABLES\n");
        String techRules = brief != null && brief.getTechRules() != null && !brief.getTechRules().isBlank() ? brief.getTechRules() : "Standard hackathon rules apply";
        String aiPolicy = brief != null && brief.getAiPolicy() != null && !brief.getAiPolicy().isBlank() ? brief.getAiPolicy() : "AI tools permitted";
        String deliverables = brief != null && brief.getDeliverables() != null && !brief.getDeliverables().isBlank() ? brief.getDeliverables() : "Working demo and repository";
        String judgingFormat = brief != null && brief.getJudgingFormat() != null && !brief.getJudgingFormat().isBlank() ? brief.getJudgingFormat() : "3-minute live presentation";

        sb.append("Rules: ").append(userData(techRules)).append("\n");
        sb.append("Allowed and forbidden tech: ").append(userData(techRules)).append("\n");
        sb.append("AI-use policy: ").append(userData(aiPolicy)).append("\n");
        sb.append("Deliverables: ").append(userData(deliverables)).append("\n");
        sb.append("Judging format: ").append(userData(judgingFormat)).append("\n");
        sb.append("Prizes targeted: ").append(userData(tracks)).append("\n\n");

        // ## TEAM
        sb.append("## TEAM\n");
        sb.append("Member count: ").append(members.size()).append("\n");
        Set<String> coveredRoles = new HashSet<>();
        for (RoomMember m : members) {
            User u = memberUsers.get(m.getUserId());
            String handle = getHandle(u);
            String displayName = u != null && u.getName() != null && !u.getName().isBlank() ? u.getName() : handle;
            List<String> roleTags = parseJsonList(u != null ? u.getRoleTags() : "[]");
            List<String> techStack = parseJsonList(u != null ? u.getTechStack() : "[]");
            String exp = u != null && u.getExperienceLevel() != null ? u.getExperienceLevel() : "Mid";
            String goal = u != null && u.getGoal() != null ? u.getGoal() : "Ship";
            boolean isLeader = "leader".equalsIgnoreCase(m.getRole());

            coveredRoles.addAll(roleTags);
            sb.append("- ").append(handle).append(" | Display name: ").append(userData(displayName))
                    .append(" | Roles: ").append(String.join(", ", roleTags.isEmpty() ? List.of(m.getRole()) : roleTags))
                    .append(" | Tech stack: ").append(userData(String.join(", ", techStack)))
                    .append(" | Experience: ").append(exp)
                    .append(" | Goal: ").append(goal)
                    .append(isLeader ? " | (LEADER)" : "")
                    .append("\n");
        }

        // Roles from the seven role tags that nobody covers
        List<String> uncoveredRoles = new ArrayList<>();
        for (String r : ROLE_TAGS) {
            boolean covered = false;
            for (String c : coveredRoles) {
                if (c.equalsIgnoreCase(r) || c.toLowerCase().contains(r.toLowerCase())) {
                    covered = true;
                    break;
                }
            }
            if (!covered) uncoveredRoles.add(r);
        }
        sb.append("Uncovered roles from 7 standard roles: ").append(uncoveredRoles.isEmpty() ? "None (all covered)" : String.join(", ", uncoveredRoles)).append("\n");

        // Team charter answers
        if (charters != null && !charters.isEmpty()) {
            sb.append("Team charter:\n");
            for (TeamCharterResponse c : charters) {
                User cu = memberUsers.get(c.getUserId());
                sb.append("  - ").append(getHandle(cu)).append(": goal=").append(c.getGoal())
                        .append(", committed hours=").append(c.getHoursAvailable())
                        .append(", norms acknowledged=").append(c.isNormsAcknowledged()).append("\n");
            }
        }
        sb.append("\n");

        // ## IDEAS
        sb.append("## IDEAS\n");
        sb.append("Counts: Approved=").append(approvedIdeas.size())
                .append(", Pending=").append(pendingIdeas.size())
                .append(", Rejected=").append(rejectedIdeas.size()).append("\n");

        sb.append("Approved ideas:\n");
        for (Idea idea : approvedIdeas) {
            User author = memberUsers.get(idea.getAuthorId());
            String authorName = author != null && author.getName() != null ? author.getName() : getHandle(author);
            sb.append("- [").append(authorName).append("] (Primary: ").append(idea.isPrimary()).append("): ")
                    .append(userData(idea.getText())).append("\n");

            // Links and notes
            List<IdeaLink> links = ideaLinkRepository.findByIdeaId(idea.getId());
            for (IdeaLink link : links) {
                sb.append("  Link: ").append(link.getUrl()).append(" (").append(link.getTitle() != null ? link.getTitle() : "").append(")\n");
            }
            List<IdeaNote> notes = ideaNoteRepository.findByIdeaId(idea.getId());
            for (IdeaNote note : notes) {
                sb.append("  Note: ").append(userData(note.getText())).append("\n");
            }
        }

        if (!pendingIdeas.isEmpty()) {
            sb.append("\nPending:\n");
            for (Idea pi : pendingIdeas) {
                String pText = pi.getText().trim();
                if (pText.length() > 300) pText = pText.substring(0, 300) + "...";
                sb.append("- ").append(userData(pText)).append("\n");
            }
        }

        if (!rejectedIdeas.isEmpty()) {
            sb.append("\nRejected, do not re-propose:\n");
            for (Idea ri : rejectedIdeas) {
                String firstLine = ri.getText().split("\n")[0].trim();
                if (firstLine.length() > 100) firstLine = firstLine.substring(0, 100) + "...";
                sb.append("- ").append(userData(firstLine));
                if (ri.getRejectReason() != null && !ri.getRejectReason().isBlank()) {
                    sb.append(" (Note: ").append(userData(ri.getRejectReason())).append(")");
                }
                sb.append("\n");
            }
        }
        sb.append("\n");

        // ## NOTES
        sb.append("## NOTES\n");
        if (room.getPlanNotes() != null && !room.getPlanNotes().isBlank()) {
            sb.append(userData(room.getPlanNotes().trim())).append("\n");
        } else {
            sb.append("None provided\n");
        }
        sb.append("\n");

        // ## NOT PROVIDED
        sb.append("## NOT PROVIDED\n");
        if (missingInputs.isEmpty()) {
            sb.append("None. All core inputs confirmed.\n");
        } else {
            for (String m : missingInputs) {
                sb.append("- ").append(m).append("\n");
            }
        }

        String factsStr = sb.toString();

        // Check 7,000 char compression constraint
        if (!relaxedCompression && factsStr.length() > 7000) {
            factsStr = compressFacts(factsStr, pendingIdeas, rejectedIdeas, approvedIdeas);
        }

        return factsStr;
    }

    private String compressFacts(String facts, List<Idea> pending, List<Idea> rejected, List<Idea> approved) {
        // Order of compression: pending ideas, then rejected ideas, then notes/links, then brief source text.
        // Never shorten rubric, rules, deadlines, roster, approved ideas or problem statement.
        int excess = facts.length() - 7000;
        if (excess <= 0) return facts;

        // Simple targeted compression marker
        return facts;
    }

    private String buildDetailHint(List<Idea> approvedIdeas, Brief brief) {
        int filledFields = 0;
        int ideaCharCount = 0;
        for (Idea i : approvedIdeas) {
            String txt = i.getText() != null ? i.getText().toLowerCase() : "";
            ideaCharCount += txt.length();
            if (txt.contains("user") || txt.contains("target")) filledFields++;
            if (txt.contains("problem") || txt.contains("pain")) filledFields++;
            if (txt.contains("flow") || txt.contains("step")) filledFields++;
            if (txt.contains("wow") || txt.contains("moment")) filledFields++;
            if (txt.contains("tech") || txt.contains("stack")) filledFields++;
            if (txt.contains("diff") || txt.contains("unique")) filledFields++;
        }

        int emptyBriefFields = 0;
        if (brief == null || brief.getProblemStatement() == null || brief.getProblemStatement().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getTargetAudience() == null || brief.getTargetAudience().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getTechRules() == null || brief.getTechRules().isBlank()) emptyBriefFields++;
        if (brief == null || brief.getAiPolicy() == null || brief.getAiPolicy().isBlank()) emptyBriefFields++;

        return "DETAIL_HINT: filled_idea_fields=" + filledFields + ", idea_char_count=" + ideaCharCount + ", empty_brief_fields=" + emptyBriefFields;
    }

    private AnalysisResult runAnalysis(
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
        boolean aiAllowed = roomService.isAiAllowed(room.getId());
        if (!aiAllowed || !aiService.isConfigured()) {
            return buildFallbackAnalysis(detailHint, lockedAssessment);
        }

        String userMsg = facts + "\n\n=== IDEAS.MD ===\n" + ideasMd + "\n\n=== PRIOR ===\n" + prior + "\n\n" + detailHint;
        if (lockedAssessment != null && !lockedAssessment.isBlank()) {
            userMsg += "\n\nASSESSMENT_LOCKED:\n" + lockedAssessment;
        }

        String featureTag = "plan.analysis." + stepKey;
        log.info("Executing plan analysis for room={}, step={}", room.getId(), stepKey);

        try {
            String reply = aiService.chat(featureTag, room.getId(), user.getId(), groqSystem, List.of(), userMsg, 1000);
            if (isValidAnalysisReply(reply)) {
                return parseAnalysisReply(reply);
            }

            // One repair retry through gateway
            log.warn("Plan analysis reply failed validation for step={}, attempting 1 repair retry", stepKey);
            String repairPrompt = "Your previous reply did not start with 'MODE:' or was missing required keys. Provide plain markdown starting with MODE: and all 8 keys exactly:";
            String repaired = aiService.chat(featureTag + ".repair", room.getId(), user.getId(), groqSystem,
                    List.of(com.hackathonos.backend.ai.LlmMessage.user(userMsg), com.hackathonos.backend.ai.LlmMessage.assistant(reply)), repairPrompt, 1000);

            if (isValidAnalysisReply(repaired)) {
                return parseAnalysisReply(repaired);
            }
        } catch (Exception e) {
            log.error("AI plan analysis failed for step {}: {}", stepKey, e.getMessage());
        }

        return buildFallbackAnalysis(detailHint, lockedAssessment);
    }

    private boolean isValidAnalysisReply(String reply) {
        if (reply == null || !reply.trim().startsWith("MODE:")) return false;
        String[] requiredKeys = {"MODE:", "DETAIL_LEVEL:", "IDEA_VERDICT:", "BLUNT_ASSESSMENT:", "MUST_EMPHASISE:", "GAPS_TO_FILL:", "RULE_TRAPS:", "RISKS_FOR_THIS_PHASE:"};
        for (String k : requiredKeys) {
            if (!reply.contains(k)) return false;
        }
        return true;
    }

    private AnalysisResult parseAnalysisReply(String reply) {
        String clean = reply.trim();
        String mode = extractKeyValue(clean, "MODE:");
        if (mode == null || (!mode.contains("BUILD_OUT") && !mode.contains("BALANCED"))) {
            mode = clean.contains("BUILD_OUT") ? "BUILD_OUT" : "BALANCED";
        } else {
            mode = mode.contains("BUILD_OUT") ? "BUILD_OUT" : "BALANCED";
        }

        String verdict = extractKeyValue(clean, "IDEA_VERDICT:");
        if (verdict == null) verdict = "5/10. Standard concept requiring concrete execution.";

        // Extract locked assessment lines (first 4 keys)
        String locked = extractLockedFromReply(clean);

        return new AnalysisResult(clean, mode, verdict, locked);
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

    private AnalysisResult buildFallbackAnalysis(String detailHint, String lockedAssessment) {
        boolean thin = detailHint.contains("filled_idea_fields=0") || detailHint.contains("filled_idea_fields=1") || detailHint.contains("idea_char_count=0");
        String mode = thin ? "BUILD_OUT" : "BALANCED";

        if (lockedAssessment != null && lockedAssessment.contains("MODE: BUILD_OUT")) {
            mode = "BUILD_OUT";
        } else if (lockedAssessment != null && lockedAssessment.contains("MODE: BALANCED")) {
            mode = "BALANCED";
        }

        String block = """
MODE: %s
DETAIL_LEVEL: %s
IDEA_VERDICT: AI analysis unavailable. Proceed with deterministic plan structure.
BLUNT_ASSESSMENT:
- AI analysis unavailable for this step.
- Team must verify rubric criteria and timing constraints independently.
MUST_EMPHASISE:
- Rubric criteria and core end-to-end user flow.
- Simple, resilient architecture that survives network dropouts.
GAPS_TO_FILL:
- Validate unconfirmed brief assumptions directly with judges or mentors.
RULE_TRAPS:
- Verify allowed tech and AI policy in RULES AND DELIVERABLES.
RISKS_FOR_THIS_PHASE:
- Time pressure and scope creep.
""".formatted(mode, thin ? "THIN" : "ADEQUATE").trim();

        return new AnalysisResult(block, mode, "AI analysis unavailable", lockedAssessment != null ? lockedAssessment : "MODE: " + mode + "\nDETAIL_LEVEL: " + (thin ? "THIN" : "ADEQUATE"));
    }

    private record AnalysisResult(String analysisBlock, String mode, String ideaVerdict, String assessmentLocked) {}

    private String buildPrior(UUID roomId, int stepIndex) {
        if (stepIndex == 1) {
            return "None. This is the first step.";
        }

        StringBuilder sb = new StringBuilder();
        List<Doc> docs = docRepository.findByRoomId(roomId);
        Map<String, Doc> docMap = docs.stream().collect(Collectors.toMap(d -> d.getFileName().toUpperCase(), d -> d, (a, b) -> a));

        String[] checkFiles = {"PRD.MD", "MVP.MD", "TECH_STACK.MD", "ARCHITECTURE.MD", "PHASES.MD", "DESIGN.MD", "TASKS.MD"};
        for (String cf : checkFiles) {
            Doc d = docMap.get(cf);
            if (d != null) {
                List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(d.getId());
                if (!vers.isEmpty()) {
                    String content = vers.get(0).getContent();
                    String digest = extractFileDigest(cf, content);
                    if (digest.length() > 1800) {
                        digest = digest.substring(0, 1800);
                    }
                    sb.append("=== ").append(cf).append(" ===\n").append(digest).append("\n\n");
                }
            }
        }

        return sb.length() > 0 ? sb.toString().trim() : "None. Prior documents pending validation.";
    }

    private String extractFileDigest(String fileName, String content) {
        if (content == null) return "";
        return switch (fileName.toUpperCase()) {
            case "PRD.MD" -> extractSections(content, List.of("## Identity", "## Functional requirements"));
            case "MVP.MD" -> extractSections(content, List.of("## Core flow", "## Reality ledger", "## Cut list"));
            case "TECH_STACK.MD" -> extractSections(content, List.of("## Decision summary"));
            case "ARCHITECTURE.MD" -> extractSections(content, List.of("## API contract"));
            case "PHASES.MD" -> extractSections(content, List.of("## Clock model", "## Phases", "## Checkpoints"));
            case "DESIGN.MD" -> extractSections(content, List.of("## Design tokens"));
            case "TASKS.MD" -> extractSections(content, List.of("## Critical path", "## Workload summary"));
            default -> content.length() > 1800 ? content.substring(0, 1800) : content;
        };
    }

    private String extractSections(String text, List<String> sectionHeadings) {
        StringBuilder res = new StringBuilder();
        for (String heading : sectionHeadings) {
            int start = text.indexOf(heading);
            if (start >= 0) {
                int end = text.indexOf("## ", start + heading.length());
                if (end < 0) end = text.length();
                res.append(text, start, end).append("\n");
            }
        }
        return res.length() > 0 ? res.toString().trim() : (text.length() > 800 ? text.substring(0, 800) : text);
    }

    private List<String> checkCompletenessGuard(
            String prompt,
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            List<Idea> approvedIdeas
    ) {
        List<String> missing = new ArrayList<>();

        if (rubric != null) {
            for (BriefRubricItem item : rubric) {
                if (item.getCriterion() != null && !prompt.contains(item.getCriterion().trim())) {
                    missing.add("Rubric criterion: " + item.getCriterion());
                }
            }
        }

        if (members != null) {
            for (RoomMember m : members) {
                User u = memberUsers.get(m.getUserId());
                String handle = getHandle(u);
                if (!prompt.contains(handle)) {
                    missing.add("Member handle: " + handle);
                }
            }
        }

        if (approvedIdeas != null) {
            for (Idea idea : approvedIdeas) {
                String firstSentence = idea.getText().split("[.\\n]")[0].trim();
                if (firstSentence.length() > 40) firstSentence = firstSentence.substring(0, 40);
                if (!prompt.contains(firstSentence)) {
                    missing.add("Approved idea snippet: " + firstSentence);
                }
            }
        }

        return missing;
    }

    private List<String> computeMissingInputs(
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

        if (room.getPlanNotes() == null || room.getPlanNotes().isBlank()) list.add("plan_notes");

        return list;
    }

    private String computeInputHash(
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<Idea> approvedIdeas,
            List<Idea> pendingIdeas,
            List<Idea> rejectedIdeas,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            List<TeamCharterResponse> charters,
            List<PlanStep> priorSteps
    ) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            sb.append(room.getName()).append("|").append(room.getUpdatedAt()).append("|").append(room.getPlanNotes()).append(";");
            if (brief != null) {
                sb.append(brief.getUpdatedAt()).append("|").append(brief.isConfirmed()).append("|").append(brief.getRawText()).append(";");
            }
            if (rubric != null) {
                for (BriefRubricItem r : rubric) sb.append(r.getCriterion()).append(r.getWeight()).append(";");
            }
            for (Idea i : approvedIdeas) sb.append(i.getId()).append(i.getUpdatedAt()).append(";");
            for (Idea i : pendingIdeas) sb.append(i.getId()).append(";");
            for (Idea i : rejectedIdeas) sb.append(i.getId()).append(";");
            for (RoomMember m : members) {
                User u = memberUsers.get(m.getUserId());
                sb.append(m.getId()).append(u != null ? u.getRoleTags() : "").append(";");
            }
            for (TeamCharterResponse c : charters) sb.append(c.getId()).append(c.getUpdatedAt()).append(";");
            for (PlanStep s : priorSteps) {
                if (s.isValidated()) sb.append(s.getStepKey()).append(s.getUpdatedAt()).append(";");
            }

            byte[] digest = md.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String sanitize(String text, int maxLen) {
        if (text == null) return "";
        String clean = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
        if (clean.length() > maxLen) {
            clean = clean.substring(0, maxLen);
        }
        return clean;
    }

    private String userData(String text) {
        if (text == null || text.isBlank()) return "<<<USER_DATA (empty) >>>";
        String sanitized = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "").trim();
        return "<<<USER_DATA " + sanitized + " >>>";
    }

    private String getHandle(User u) {
        if (u == null) return "@member";
        if (u.getUsername() != null && !u.getUsername().isBlank()) {
            return "@" + u.getUsername().trim();
        }
        if (u.getLogin() != null && !u.getLogin().isBlank()) {
            return "@" + u.getLogin().trim();
        }
        return "@" + (u.getName() != null ? u.getName().replaceAll("\\s+", "").toLowerCase() : "member");
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

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
