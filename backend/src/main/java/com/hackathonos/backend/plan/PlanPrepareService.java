package com.hackathonos.backend.plan;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.plan.dto.PlanPrepareStatusDto;
import com.hackathonos.backend.plan.dto.PrepareStageDto;
import com.hackathonos.backend.plan.dto.StepPrepareResponseDto;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.team.TeamCharterResponse;
import com.hackathonos.backend.team.TeamCharterResponseRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service managing asynchronous background preparation of plan stage prompts,
 * step-by-step lazy analysis, facts, and live stage tracking.
 */
@Service
public class PlanPrepareService {

    private static final Logger log = LoggerFactory.getLogger(PlanPrepareService.class);

    private final RoomAccess roomAccess;
    private final RoomService roomService;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final IdeaRepository ideaRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TeamCharterResponseRepository charterRepository;
    private final PlanStepPromptRepository promptRepository;
    private final PlanPromptService planPromptService;
    private final IdeasService ideasService;
    private final ObjectMapper objectMapper;

    // Jobs keyed by roomId + ":" + step + ":" + factsHash
    private final ConcurrentHashMap<String, StepJobState> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public PlanPrepareService(
            RoomAccess roomAccess,
            RoomService roomService,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            IdeaRepository ideaRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            TeamCharterResponseRepository charterRepository,
            PlanStepPromptRepository promptRepository,
            PlanPromptService planPromptService,
            IdeasService ideasService,
            ObjectMapper objectMapper) {
        this.roomAccess = roomAccess;
        this.roomService = roomService;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.ideaRepository = ideaRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.charterRepository = charterRepository;
        this.promptRepository = promptRepository;
        this.planPromptService = planPromptService;
        this.ideasService = ideasService;
        this.objectMapper = objectMapper;
    }

    public StepPrepareResponseDto prepareStep(UUID roomId, int stepIndex, User user) {
        if (user != null) {
            roomAccess.requireMember(roomId, user);
        }
        cleanOldJobs();

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

        String factsHash = planPromptService.computeFactsHash(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters);

        String jobKey = roomId + ":" + stepIndex + ":" + factsHash;

        // 1. Check if cached analysis exists in memory or DB
        PlanPromptService.AnalysisResult cachedAnalysis = planPromptService.getCachedAnalysis(roomId, stepIndex, factsHash);
        if (cachedAnalysis != null) {
            log.info("Analysis for room={} step={} already cached", roomId, stepIndex);
            return new StepPrepareResponseDto("READY", "cached-" + stepIndex);
        }

        Optional<PlanStepPrompt> promptOpt = promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex);
        if (promptOpt.isPresent() && !promptOpt.get().isStale() && factsHash.equals(promptOpt.get().getInputHash())) {
            log.info("Prompt for room={} step={} already valid in DB", roomId, stepIndex);
            return new StepPrepareResponseDto("READY", "db-" + stepIndex);
        }

        // 2. Check if an identical in-flight job exists
        StepJobState existing = jobs.get(jobKey);
        if (existing != null && ("RUNNING".equals(existing.status) || "QUEUED".equals(existing.status) || "READY".equals(existing.status) || "FALLBACK".equals(existing.status))) {
            return new StepPrepareResponseDto(existing.status, existing.jobId);
        }

        // 3. Start or join new job
        String jobId = UUID.randomUUID().toString();
        StepJobState job = new StepJobState(jobId, roomId, stepIndex, factsHash);
        jobs.put(jobKey, job);

        executor.submit(() -> executeStepJob(job, room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters, user, factsHash));

        return new StepPrepareResponseDto("RUNNING", jobId);
    }

    public PlanPrepareStatusDto getStepPrepareStatus(UUID roomId, int stepIndex, User user) {
        if (user != null) {
            roomAccess.requireMember(roomId, user);
        }
        cleanOldJobs();

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

        String factsHash = planPromptService.computeFactsHash(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                members, memberUsers, memberSkills, charters);

        String jobKey = roomId + ":" + stepIndex + ":" + factsHash;
        StepJobState job = jobs.get(jobKey);
        if (job != null) {
            return job.toDto();
        }

        // Check DB prompt
        Optional<PlanStepPrompt> promptOpt = promptRepository.findByRoomIdAndStepIndex(roomId, stepIndex);
        if (promptOpt.isPresent() && !promptOpt.get().isStale() && factsHash.equals(promptOpt.get().getInputHash())) {
            PlanStepPrompt p = promptOpt.get();
            Map<String, Object> facts = buildFactsMap(rubric, members, memberUsers, approvedIdeas, p.getMode(), p.getIdeaVerdict());
            List<PrepareStageDto> stages = List.of(
                    new PrepareStageDto("READ_INPUTS", "Reading inputs", "DONE", rubric.size() + " rubric criteria, " + members.size() + " teammates, " + approvedIdeas.size() + " approved ideas", p.getGeneratedAt().toString(), p.getGeneratedAt().toString()),
                    new PrepareStageDto("JUDGE_IDEA", getJudgeLabel(stepIndex), "DONE", p.getIdeaVerdict(), p.getGeneratedAt().toString(), p.getGeneratedAt().toString()),
                    new PrepareStageDto("WRITE_PROMPT", "Writing prompt", "DONE", "Prompt " + stepIndex + " ready", p.getGeneratedAt().toString(), p.getGeneratedAt().toString())
            );
            return new PlanPrepareStatusDto(
                    "db-" + stepIndex,
                    "READY",
                    p.getGeneratedAt().toString(),
                    stages,
                    facts,
                    p.getMode(),
                    p.getIdeaVerdict(),
                    "READY"
            );
        }

        // Not started yet
        Map<String, Object> facts = buildFactsMap(rubric, members, memberUsers, approvedIdeas, "BALANCED", "Pending analysis.");
        List<PrepareStageDto> initialStages = List.of(
                new PrepareStageDto("READ_INPUTS", "Reading inputs", "PENDING", "", null, null),
                new PrepareStageDto("JUDGE_IDEA", getJudgeLabel(stepIndex), "PENDING", "", null, null),
                new PrepareStageDto("WRITE_PROMPT", "Writing prompt", "PENDING", "", null, null)
        );
        return new PlanPrepareStatusDto(
                UUID.randomUUID().toString(),
                "QUEUED",
                Instant.now().toString(),
                initialStages,
                facts,
                "BALANCED",
                "Pending analysis.",
                "PENDING"
        );
    }

    public StepPrepareResponseDto prefetchNext(UUID roomId, int currentStep, User user) {
        if (currentStep >= 5) {
            return new StepPrepareResponseDto("READY", "none");
        }
        return prepareStep(roomId, currentStep + 1, user);
    }

    public void triggerPrepareAsync(UUID roomId, int stepIndex) {
        CompletableFuture.runAsync(() -> {
            try {
                prepareStep(roomId, stepIndex, null);
            } catch (Exception e) {
                log.warn("Async prepare failed for room={} step={}: {}", roomId, stepIndex, e.getMessage());
            }
        }, executor);
    }

    private void executeStepJob(
            StepJobState job,
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
            User user,
            String factsHash
    ) {
        int step = job.step;
        long jobStart = System.currentTimeMillis();

        try {
            // Stage 1: READ_INPUTS
            long s1Start = System.currentTimeMillis();
            StageState s1 = job.stages.get(0);
            s1.state = "RUNNING";
            s1.startedAt = Instant.now();

            int rubricCount = rubric.size();
            int memberCount = members.size();
            int approvedCount = approvedIdeas.size();
            s1.detail = rubricCount + " rubric criteria, " + memberCount + " teammates, " + approvedCount + " approved ideas";

            // Populate base facts
            job.facts.put("rubricCriterionNames", rubric.stream().map(BriefRubricItem::getCriterion).filter(Objects::nonNull).toList());
            job.facts.put("teamHandles", members.stream().map(m -> planPromptService.getHandleWithRole(m, memberUsers.get(m.getUserId()))).toList());
            job.facts.put("approvedIdeaTitles", approvedIdeas.stream().map(i -> {
                String t = i.getText().split("[.\\n]")[0].trim();
                return t.length() > 60 ? t.substring(0, 60) : t;
            }).toList());

            s1.endedAt = Instant.now();
            s1.state = "DONE";
            long s1Ms = System.currentTimeMillis() - s1Start;
            log.info("stage_complete room={} step={} stage=READ_INPUTS ms={} outcome=SUCCESS", room.getId(), step, s1Ms);

            // Stage 2: JUDGE_IDEA
            long s2Start = System.currentTimeMillis();
            StageState s2 = job.stages.get(1);
            s2.state = "RUNNING";
            s2.startedAt = Instant.now();

            PlanPromptService.AnalysisResult analysis = planPromptService.getOrComputeAnalysis(
                    room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                    members, memberUsers, memberSkills, charters, step, factsHash, user, false
            );

            s2.endedAt = Instant.now();
            long s2Ms = System.currentTimeMillis() - s2Start;
            log.info("stage_complete room={} step={} stage=JUDGE_IDEA ms={} outcome={}", room.getId(), step, s2Ms, analysis.fallback() ? "FALLBACK" : "SUCCESS");
            if (analysis.skippedNoKey()) {
                s2.state = "SKIPPED";
                s2.detail = "Skipped (no AI key)";
                job.analysisState = "SKIPPED_NO_KEY";
            } else if (analysis.fallback()) {
                s2.state = "FALLBACK";
                s2.detail = analysis.ideaVerdict();
                job.analysisState = "FALLBACK";
            } else {
                s2.state = "DONE";
                s2.detail = analysis.ideaVerdict();
                job.analysisState = "READY";
            }

            job.mode = analysis.mode();
            job.verdict = analysis.ideaVerdict();
            job.facts.put("mode", analysis.mode());
            job.facts.put("verdict", analysis.ideaVerdict());

            // Stage 3: WRITE_PROMPT
            long s3Start = System.currentTimeMillis();
            StageState s3 = job.stages.get(2);
            s3.state = "RUNNING";
            s3.startedAt = Instant.now();

            List<String> missingInputs = planPromptService.computeMissingInputs(brief, rubric, approvedIdeas, members, memberUsers, room);
            String factsText = planPromptService.buildFacts(room, brief, rubric, approvedIdeas, pendingIdeas, rejectedIdeas,
                    members, memberUsers, memberSkills, charters, missingInputs, false);
            String priorText = planPromptService.buildPrior(room.getId(), step);

            planPromptService.fusePrompt(room.getId(), step, factsText, analysis, priorText, factsHash);

            s3.endedAt = Instant.now();
            s3.state = "DONE";
            s3.detail = "Prompt " + step + " ready";
            long s3Ms = System.currentTimeMillis() - s3Start;
            log.info("stage_complete room={} step={} stage=WRITE_PROMPT ms={} outcome=SUCCESS", room.getId(), step, s3Ms);

            job.status = (analysis.skippedNoKey() || !analysis.fallback()) ? "READY" : "FALLBACK";

            job.updatedAt = Instant.now();
            log.info("Plan prepare step job completed successfully with status={} for room={} step={}", job.status, room.getId(), step);
        } catch (Exception fatal) {
            log.error("Fatal failure in prepare job for room={} step={}: {}", room.getId(), step, fatal.getMessage(), fatal);
            job.status = "FAILED";
            job.analysisState = "FALLBACK";
            job.updatedAt = Instant.now();
        }
    }

    private static String getJudgeLabel(int stepIndex) {
        return switch (stepIndex) {
            case 1 -> "Judging the idea, bluntly";
            case 2 -> "Analyzing tech stack & architecture";
            case 3 -> "Analyzing phases & design";
            case 4 -> "Analyzing tasks & schedule";
            case 5 -> "Analyzing demo & Q&A";
            default -> "Analyzing step " + stepIndex;
        };
    }

    private Map<String, Object> buildFactsMap(
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            List<Idea> approvedIdeas,
            String mode,
            String verdict
    ) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("rubricCriterionNames", rubric.stream().map(BriefRubricItem::getCriterion).filter(Objects::nonNull).toList());
        map.put("teamHandles", members.stream().map(m -> planPromptService.getHandleWithRole(m, memberUsers.get(m.getUserId()))).toList());
        map.put("approvedIdeaTitles", approvedIdeas.stream().map(i -> {
            String t = i.getText().split("[.\\n]")[0].trim();
            return t.length() > 60 ? t.substring(0, 60) : t;
        }).toList());
        map.put("mode", mode);
        map.put("verdict", verdict);
        return map;
    }

    // Legacy method for /plan/prepare endpoint
    public PlanPrepareStatusDto preparePlan(UUID roomId, User user) {
        prepareStep(roomId, 1, user);
        return getStepPrepareStatus(roomId, 1, user);
    }

    // Legacy method for /plan/prepare/status endpoint
    public PlanPrepareStatusDto getPrepareStatus(UUID roomId, User user) {
        return getStepPrepareStatus(roomId, 1, user);
    }

    private void cleanOldJobs() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(15));
        jobs.entrySet().removeIf(e -> e.getValue().updatedAt.isBefore(cutoff));
    }

    public static class StepJobState {
        public final String jobId;
        public final UUID roomId;
        public final int step;
        public final String factsHash;
        public final Instant startedAt;
        public volatile Instant updatedAt;
        public volatile String status = "RUNNING";
        public volatile String analysisState = "PENDING";
        public volatile String mode = "BALANCED";
        public volatile String verdict = "Pending analysis.";
        public final List<StageState> stages;
        public final Map<String, Object> facts = new ConcurrentHashMap<>();

        public StepJobState(String jobId, UUID roomId, int step, String factsHash) {
            this.jobId = jobId;
            this.roomId = roomId;
            this.step = step;
            this.factsHash = factsHash;
            this.startedAt = Instant.now();
            this.updatedAt = Instant.now();
            this.stages = List.of(
                    new StageState("READ_INPUTS", "Reading inputs"),
                    new StageState("JUDGE_IDEA", getJudgeLabel(step)),
                    new StageState("WRITE_PROMPT", "Writing prompt")
            );
        }

        public PlanPrepareStatusDto toDto() {
            List<PrepareStageDto> dtos = stages.stream()
                    .map(s -> new PrepareStageDto(
                            s.key, s.label, s.state, s.detail,
                            s.startedAt != null ? s.startedAt.toString() : null,
                            s.endedAt != null ? s.endedAt.toString() : null
                    )).toList();
            return new PlanPrepareStatusDto(
                    jobId,
                    status,
                    startedAt.toString(),
                    dtos,
                    facts,
                    mode,
                    verdict,
                    analysisState
            );
        }
    }

    public static class StageState {
        public final String key;
        public final String label;
        public volatile String state = "PENDING";
        public volatile String detail = "";
        public volatile Instant startedAt;
        public volatile Instant endedAt;

        public StageState(String key, String label) {
            this.key = key;
            this.label = label;
        }
    }
}
