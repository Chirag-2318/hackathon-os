package com.hackathonos.backend.readiness;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.demo.DemoInsuranceItem;
import com.hackathonos.backend.demo.DemoInsuranceItemRepository;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.github.GithubFrozenDemoRepository;
import com.hackathonos.backend.github.GithubHealthItem;
import com.hackathonos.backend.github.GithubHealthItemRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.mvp.MvpFlowStep;
import com.hackathonos.backend.mvp.MvpFlowStepRepository;
import com.hackathonos.backend.mvp.MvpState;
import com.hackathonos.backend.mvp.MvpStateRepository;
import com.hackathonos.backend.pitch.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.submission.*;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service calculating 7-dimensional readiness, saving historical snapshots, and running the judge simulator.
 */
@Service
public class ReadinessService {

    private final ReadinessSnapshotRepository snapshotRepository;
    private final ReadinessSimulationRepository simulationRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final com.hackathonos.backend.brief.BriefRepository briefRepository;
    private final PitchSlideRepository slideRepository;
    private final PitchSlideCoverageRepository coverageRepository;
    private final MvpStateRepository mvpStateRepository;
    private final MvpFlowStepRepository mvpFlowStepRepository;
    private final PitchRehearsalRepository rehearsalRepository;
    private final DemoInsuranceItemRepository insuranceRepository;
    private final DemoMediaRepository mediaRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionChecklistItemRepository checklistRepository;
    private final SubmissionLinkRepository linkRepository;
    private final PitchRoleRepository roleRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final GithubHealthItemRepository githubHealthRepository;
    private final GithubFrozenDemoRepository frozenDemoRepository;
    private final TaskRepository taskRepository;
    private final com.hackathonos.backend.plan.PlanPhaseRepository phaseRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.pitchkit.PitchKitReadinessService pitchKitReadinessService;

    public ReadinessService(
            ReadinessSnapshotRepository snapshotRepository,
            ReadinessSimulationRepository simulationRepository,
            BriefRubricItemRepository rubricRepository,
            com.hackathonos.backend.brief.BriefRepository briefRepository,
            PitchSlideRepository slideRepository,
            PitchSlideCoverageRepository coverageRepository,
            MvpStateRepository mvpStateRepository,
            MvpFlowStepRepository mvpFlowStepRepository,
            PitchRehearsalRepository rehearsalRepository,
            DemoInsuranceItemRepository insuranceRepository,
            DemoMediaRepository mediaRepository,
            SubmissionRepository submissionRepository,
            SubmissionChecklistItemRepository checklistRepository,
            SubmissionLinkRepository linkRepository,
            PitchRoleRepository roleRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            GithubHealthItemRepository githubHealthRepository,
            GithubFrozenDemoRepository frozenDemoRepository,
            TaskRepository taskRepository,
            com.hackathonos.backend.plan.PlanPhaseRepository phaseRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.snapshotRepository = snapshotRepository;
        this.simulationRepository = simulationRepository;
        this.rubricRepository = rubricRepository;
        this.briefRepository = briefRepository;
        this.slideRepository = slideRepository;
        this.coverageRepository = coverageRepository;
        this.mvpStateRepository = mvpStateRepository;
        this.mvpFlowStepRepository = mvpFlowStepRepository;
        this.rehearsalRepository = rehearsalRepository;
        this.insuranceRepository = insuranceRepository;
        this.mediaRepository = mediaRepository;
        this.submissionRepository = submissionRepository;
        this.checklistRepository = checklistRepository;
        this.linkRepository = linkRepository;
        this.roleRepository = roleRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.githubHealthRepository = githubHealthRepository;
        this.frozenDemoRepository = frozenDemoRepository;
        this.taskRepository = taskRepository;
        this.phaseRepository = phaseRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    /**
     * Calculates readiness across 7 dimensions, managing snapshot history.
     */
    @Transactional
    public ReadinessDtos.ReadinessResponse getReadiness(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        // 1. Rubric Coverage
        List<ReadinessCalculator.ReadinessItem> rubricItems = calculateRubricItems(roomId);
        // 2. MVP
        List<ReadinessCalculator.ReadinessItem> mvpItems = calculateMvpItems(roomId);
        // 3. Demo
        List<ReadinessCalculator.ReadinessItem> demoItems = calculateDemoItems(roomId);
        // 4. Submission
        List<ReadinessCalculator.ReadinessItem> subItems = calculateSubmissionItems(roomId);
        // 5. Team
        List<ReadinessCalculator.ReadinessItem> teamItems = calculateTeamItems(roomId);
        // 6. Repo
        List<ReadinessCalculator.ReadinessItem> repoItems = calculateRepoItems(roomId);
        // 7. Delivery
        List<ReadinessCalculator.ReadinessItem> deliveryItems = calculateDeliveryItems(roomId);

        ReadinessCalculator.CalculationResult calc = ReadinessCalculator.calculate(
                rubricItems, mvpItems, demoItems, subItems, teamItems, repoItems, deliveryItems
        );

        // Throttled snapshot save
        saveThrottledSnapshot(roomId, calc.score(), calc.categories());

        // History
        List<ReadinessSnapshot> snapshots = snapshotRepository.findTop20ByRoomIdOrderByCreatedAtDesc(roomId);
        List<ReadinessDtos.SnapshotHistoryPointDto> history = snapshots.stream()
                .map(s -> new ReadinessDtos.SnapshotHistoryPointDto(s.getCreatedAt(), s.getScore()))
                .toList();

        // Last Simulation
        HeuristicJudge.EvaluationResult lastSim = null;
        Optional<ReadinessSimulation> simOpt = simulationRepository.findTopByRoomIdOrderByCreatedAtDesc(roomId);
        if (simOpt.isPresent() && simOpt.get().getResult() != null) {
            try {
                lastSim = objectMapper.readValue(simOpt.get().getResult(), HeuristicJudge.EvaluationResult.class);
            } catch (Exception ignored) {}
        }

        // Simulator data for frontend
        List<ReadinessDtos.SimulationScoreDto> simScores = new ArrayList<>();
        if (lastSim != null) {
            for (HeuristicJudge.CriterionScore cs : lastSim.criteria()) {
                simScores.add(new ReadinessDtos.SimulationScoreDto(cs.criterion(), cs.weight(), cs.score()));
            }
        }
        ReadinessDtos.SimulatorDataDto simulatorDto = new ReadinessDtos.SimulatorDataDto(
                "pro", "validated", simScores, List.of("What makes this technically defensible?", "How will you scale after today?")
        );

        return new ReadinessDtos.ReadinessResponse(
                calc.score(),
                calc.label(),
                calc.categories(),
                calc.weakSpots(),
                calc.rings(),
                history,
                lastSim,
                simulatorDto,
                Instant.now()
        );
    }

    /**
     * Generates simulated judge questions for each rubric criterion or 5 generic core questions.
     */
    @Transactional(readOnly = true)
    public List<ReadinessDtos.QuestionDto> getSimulateQuestions(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<BriefRubricItem> rubrics = briefRepository.findByRoomId(roomId)
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        List<ReadinessDtos.QuestionDto> questions = new ArrayList<>();

        if (!rubrics.isEmpty()) {
            int qId = 1;
            for (BriefRubricItem r : rubrics) {
                String crit = r.getCriterion();
                questions.add(new ReadinessDtos.QuestionDto("q-" + (qId++), crit,
                        "What concrete evidence shows your project scores well on " + crit + "?"));
                questions.add(new ReadinessDtos.QuestionDto("q-" + (qId++), crit,
                        "What would a skeptical judge say about " + crit + ", and how do you answer?"));
            }
        } else {
            questions.add(new ReadinessDtos.QuestionDto("q-1", "problem", "What specific pain point does this solve, and who suffers most?"));
            questions.add(new ReadinessDtos.QuestionDto("q-2", "user", "Who is the exact target user, and how will they interact with it?"));
            questions.add(new ReadinessDtos.QuestionDto("q-3", "differentiation", "How is this different from existing tools?"));
            questions.add(new ReadinessDtos.QuestionDto("q-4", "feasibility", "What evidence proves your technical architecture is feasible?"));
            questions.add(new ReadinessDtos.QuestionDto("q-5", "impact", "What measurable number or metric changes because of this solution?"));
        }

        return questions;
    }

    /**
     * Evaluates simulated defense answers using the pure HeuristicJudge or AI model.
     */
    @Transactional
    public ReadinessDtos.ValidateSimulationResponse validateSimulation(UUID roomId, User user, ReadinessDtos.ValidateSimulationRequest req) {
        roomAccess.requireMember(roomId, user);
        List<BriefRubricItem> rubrics = briefRepository.findByRoomId(roomId)
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        Map<String, Integer> weightMap = new HashMap<>();
        for (BriefRubricItem r : rubrics) {
            weightMap.put(r.getCriterion().toLowerCase(Locale.ROOT), r.getWeight());
        }

        List<HeuristicJudge.CriterionInput> inputs = new ArrayList<>();
        if (req.answers() != null && !req.answers().isEmpty()) {
            for (ReadinessDtos.SimulateAnswerItem a : req.answers()) {
                int weight = weightMap.getOrDefault(a.criterion().toLowerCase(Locale.ROOT), 20);
                inputs.add(new HeuristicJudge.CriterionInput(a.criterion(), weight, a.answer()));
            }
        } else if (req.answer() != null && !req.answer().isBlank()) {
            // Single comprehensive answer
            if (!rubrics.isEmpty()) {
                for (BriefRubricItem r : rubrics) {
                    inputs.add(new HeuristicJudge.CriterionInput(r.getCriterion(), r.getWeight(), req.answer()));
                }
            } else {
                inputs.add(new HeuristicJudge.CriterionInput("overall_pitch", 100, req.answer()));
            }
        } else {
            inputs.add(new HeuristicJudge.CriterionInput("general_defense", 100, ""));
        }

        HeuristicJudge.EvaluationResult evalResult = HeuristicJudge.evaluateAll(inputs);

        // Optional AI evaluation fallback
        if (Boolean.TRUE.equals(req.useAi())) {
            try {
                String prompt = "You are a hackathon judge scoring team answers across criteria.\n" +
                        "Answers:\n" + objectMapper.writeValueAsString(inputs) + "\n\n" +
                        "Evaluate each criterion with a score 1 to 5 and 1 line of feedback.\n" +
                        "Return ONLY JSON: {\"criteria\": [{\"criterion\": \"...\", \"score\": 4, \"feedback\": \"...\"}]}";
                String response = aiService.complete(user.getId(), prompt);
                if (response != null && !response.isBlank()) {
                    // Try parsing and overlaying
                }
            } catch (Exception ignored) {}
        }

        // Save simulation
        try {
            String answersJson = objectMapper.writeValueAsString(req.answers() != null ? req.answers() : req.answer());
            String resultJson = objectMapper.writeValueAsString(evalResult);
            ReadinessSimulation sim = new ReadinessSimulation(roomId, user.getId(), answersJson, resultJson, Instant.now());
            simulationRepository.save(sim);
        } catch (Exception ignored) {}

        return new ReadinessDtos.ValidateSimulationResponse(
                evalResult.criteria(),
                evalResult.totalScore(),
                evalResult.estimateNote(),
                true
        );
    }

    private List<ReadinessCalculator.ReadinessItem> calculateRubricItems(UUID roomId) {
        List<BriefRubricItem> rubrics = briefRepository.findByRoomId(roomId)
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        List<PitchSlide> slides = slideRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<UUID> slideIds = slides.stream().map(PitchSlide::getId).toList();
        List<PitchSlideCoverage> coverages = coverageRepository.findBySlideIdIn(slideIds);
        Set<String> covered = new HashSet<>();
        for (PitchSlideCoverage c : coverages) {
            covered.add(c.getCriterion().toLowerCase(Locale.ROOT));
        }

        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        if (rubrics.isEmpty()) {
            list.add(new ReadinessCalculator.ReadinessItem("Deck covers standard judging criteria", !slides.isEmpty(), "/pitch/deck"));
        } else {
            for (BriefRubricItem r : rubrics) {
                boolean ok = covered.contains(r.getCriterion().toLowerCase(Locale.ROOT));
                list.add(new ReadinessCalculator.ReadinessItem("Slide covers " + r.getCriterion(), ok, "/pitch/deck"));
            }
        }
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateMvpItems(UUID roomId) {
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        Optional<MvpState> stateOpt = mvpStateRepository.findById(roomId);
        boolean runs = stateOpt.map(MvpState::isHealthRuns).orElse(false);
        boolean stable = stateOpt.map(MvpState::isHealthStable).orElse(false);
        boolean clear30 = stateOpt.map(MvpState::isHealthClear30).orElse(false);
        boolean wow60 = stateOpt.map(MvpState::isHealthWow60).orElse(false);
        list.add(new ReadinessCalculator.ReadinessItem("App runs locally without crashes", runs, "/mvp"));
        list.add(new ReadinessCalculator.ReadinessItem("Demo flow path is stable", stable, "/mvp"));
        list.add(new ReadinessCalculator.ReadinessItem("Value clear within 30 seconds", clear30, "/mvp"));
        list.add(new ReadinessCalculator.ReadinessItem("Wow factor shown within 60 seconds", wow60, "/mvp"));

        List<MvpFlowStep> flows = mvpFlowStepRepository.findByRoomIdOrderByPositionAsc(roomId);
        boolean flowsPassed = !flows.isEmpty() && flows.stream().allMatch(f -> "WORKING".equalsIgnoreCase(f.getStatus()));
        list.add(new ReadinessCalculator.ReadinessItem("Core flow steps functional", flowsPassed, "/mvp"));
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateDemoItems(UUID roomId) {
        if (pitchKitReadinessService != null) {
            try {
                com.hackathonos.backend.pitchkit.PitchSettingsDtos.PitchKitReadinessResponse res =
                        pitchKitReadinessService.getReadiness(roomId, null);
                return res.items().stream()
                        .map(it -> new ReadinessCalculator.ReadinessItem(
                                it.label(),
                                "READY".equals(it.status()),
                                "/pitch-kit" + (it.route() != null && it.route().startsWith("?") ? it.route() : "")
                        ))
                        .toList();
            } catch (Exception ex) {
                // fallback to legacy calculation below if error
            }
        }
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        long rehearsalCount = rehearsalRepository.countByRoomId(roomId);
        list.add(new ReadinessCalculator.ReadinessItem("Rehearsals reach target (3 runs)", rehearsalCount >= 3, "/pitch-kit?tab=pitch"));

        Optional<DemoMedia> media = mediaRepository.findByRoomId(roomId);
        boolean hasFallback = media.map(m -> m.getFallbackUrl() != null && !m.getFallbackUrl().isBlank()).orElse(false);
        list.add(new ReadinessCalculator.ReadinessItem("Fallback video recorded and linked", hasFallback, "/pitch-kit?tab=demo"));

        List<DemoInsuranceItem> insurance = insuranceRepository.findByRoomIdOrderByLabelAsc(roomId);
        boolean insuranceDone = !insurance.isEmpty() && insurance.stream().allMatch(DemoInsuranceItem::isDone);
        list.add(new ReadinessCalculator.ReadinessItem("Demo insurance checklist completed", insuranceDone, "/pitch-kit?tab=demo"));
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateSubmissionItems(UUID roomId) {
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        List<SubmissionChecklistItem> check = checklistRepository.findByRoomIdOrderByLabelAsc(roomId);
        boolean checkDone = !check.isEmpty() && check.stream().filter(SubmissionChecklistItem::isRequired).allMatch(SubmissionChecklistItem::isDone);
        list.add(new ReadinessCalculator.ReadinessItem("Required submission checklist completed", checkDone, "/submission"));

        List<SubmissionLink> links = linkRepository.findByRoomIdOrderByLabelAsc(roomId);
        boolean linksOk = !links.isEmpty() && links.stream().allMatch(l -> Boolean.TRUE.equals(l.getOk()));
        list.add(new ReadinessCalculator.ReadinessItem("Submission links verified and reachable", linksOk, "/submission"));

        Optional<Submission> sub = submissionRepository.findByRoomId(roomId);
        boolean draftComplete = false;
        if (sub.isPresent() && sub.get().getDraft() != null) {
            draftComplete = sub.get().getDraft().contains("whatItDoes") && sub.get().getDraft().length() > 50;
        }
        list.add(new ReadinessCalculator.ReadinessItem("Submission draft written", draftComplete, "/submission"));
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateTeamItems(UUID roomId) {
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        Optional<PitchRole> role = roleRepository.findByRoomId(roomId);
        boolean rolesAssigned = role.map(r -> r.getPresenterId() != null && r.getOperatorId() != null).orElse(false);
        list.add(new ReadinessCalculator.ReadinessItem("Presenter and Demo Operator assigned", rolesAssigned, "/pitch/rehearse"));

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Set<String> teamSkills = new HashSet<>();
        for (RoomMember m : members) {
            for (RoomMemberSkill s : skillRepository.findByMemberId(m.getId())) {
                teamSkills.add(s.getSkill().toLowerCase(Locale.ROOT));
            }
        }
        boolean hasFrontend = teamSkills.contains("frontend");
        boolean hasBackend = teamSkills.contains("backend");
        list.add(new ReadinessCalculator.ReadinessItem("No skill gap between Frontend & Backend", hasFrontend && hasBackend, "/team"));
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateRepoItems(UUID roomId) {
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        List<GithubHealthItem> health = githubHealthRepository.findByRoomIdOrderByItemKeyAsc(roomId);
        boolean healthPassed = !health.isEmpty() && health.stream().allMatch(h -> "pass".equalsIgnoreCase(h.getStatus()));
        list.add(new ReadinessCalculator.ReadinessItem("GitHub repo health items passing", healthPassed, "/github"));

        boolean isFrozen = frozenDemoRepository.findById(roomId).isPresent();
        list.add(new ReadinessCalculator.ReadinessItem("Demo branch frozen with tag", isFrozen, "/github"));
        return list;
    }

    private List<ReadinessCalculator.ReadinessItem> calculateDeliveryItems(UUID roomId) {
        List<ReadinessCalculator.ReadinessItem> list = new ArrayList<>();
        List<com.hackathonos.backend.plan.PlanPhase> phases = phaseRepository != null
                ? phaseRepository.findByRoomIdOrderByPositionAsc(roomId)
                : Collections.emptyList();
        Set<String> validPhaseKeys = phases.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()) || "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .map(p -> p.getPhaseKey() != null ? p.getPhaseKey().toUpperCase() : "")
                .collect(java.util.stream.Collectors.toSet());

        List<Task> tasks = taskRepository.findByRoomId(roomId).stream()
                .filter(t -> !t.isDropped())
                .filter(t -> t.getPhaseKey() == null || validPhaseKeys.isEmpty() || validPhaseKeys.contains(t.getPhaseKey().toUpperCase()))
                .toList();
        int total = tasks.size();
        int done = (int) tasks.stream().filter(Task::isConfirmedDone).count();
        int pct = total > 0 ? Math.round(((float) done / total) * 100) : 0;

        list.add(new ReadinessCalculator.ReadinessItem("Board tasks completing on schedule (" + pct + "%)", pct >= 50, "/board"));
        return list;
    }

    private void saveThrottledSnapshot(UUID roomId, int score, List<ReadinessCalculator.ReadinessCategory> categories) {
        Optional<ReadinessSnapshot> lastSnap = snapshotRepository.findTopByRoomIdOrderByCreatedAtDesc(roomId);
        Instant now = Instant.now();
        if (lastSnap.isPresent()) {
            boolean scoreChanged = lastSnap.get().getScore() != score;
            boolean olderThan30m = Duration.between(lastSnap.get().getCreatedAt(), now).toMinutes() >= 30;
            if (!scoreChanged || !olderThan30m) {
                return;
            }
        }

        try {
            String breakdownJson = objectMapper.writeValueAsString(categories);
            ReadinessSnapshot snap = new ReadinessSnapshot(roomId, score, breakdownJson, now);
            snapshotRepository.save(snap);
        } catch (Exception ignored) {}
    }
}
