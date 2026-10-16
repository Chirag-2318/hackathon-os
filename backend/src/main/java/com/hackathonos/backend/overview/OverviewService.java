package com.hackathonos.backend.overview;

import com.hackathonos.backend.activity.ActivityService;
import com.hackathonos.backend.activity.dto.ActivityItemDto;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefMapper;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.checkpoints.dto.CheckpointDtos;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.mvp.MvpState;
import com.hackathonos.backend.mvp.MvpStateRepository;
import com.hackathonos.backend.overview.attention.AttentionEngine;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.dto.OverviewDtos.*;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.mentor.MentorQuestionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskDtoMapper;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.tasks.dto.TaskDto;
import com.hackathonos.backend.team.dto.TeamDtos;
import com.hackathonos.backend.team.TeamService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class OverviewService {

    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final ClockService clockService;
    private final ProgressService progressService;
    private final WorkloadService workloadService;
    private final AttentionEngine attentionEngine;
    private final CheckpointService checkpointService;
    private final TeamService teamService;
    private final TaskRepository taskRepository;
    private final TaskDtoMapper taskDtoMapper;
    private final PlanPhaseRepository phaseRepository;
    private final ActivityService activityService;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final BriefMapper briefMapper;
    private final MvpStateRepository mvpStateRepository;
    private final IdeaRepository ideaRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository memberRepository;
    private final Clock clock;
    private final SubmissionRepository submissionRepository;
    private final MentorQuestionRepository mentorQuestionRepository;

    public OverviewService(
            RoomAccess roomAccess,
            RoomStageService stageService,
            ClockService clockService,
            ProgressService progressService,
            WorkloadService workloadService,
            AttentionEngine attentionEngine,
            CheckpointService checkpointService,
            TeamService teamService,
            TaskRepository taskRepository,
            TaskDtoMapper taskDtoMapper,
            PlanPhaseRepository phaseRepository,
            ActivityService activityService,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            BriefMapper briefMapper,
            MvpStateRepository mvpStateRepository,
            IdeaRepository ideaRepository,
            UserRepository userRepository,
            RoomMemberRepository memberRepository,
            Clock clock,
            SubmissionRepository submissionRepository,
            MentorQuestionRepository mentorQuestionRepository
    ) {
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.clockService = clockService;
        this.progressService = progressService;
        this.workloadService = workloadService;
        this.attentionEngine = attentionEngine;
        this.checkpointService = checkpointService;
        this.teamService = teamService;
        this.taskRepository = taskRepository;
        this.taskDtoMapper = taskDtoMapper;
        this.phaseRepository = phaseRepository;
        this.activityService = activityService;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.briefMapper = briefMapper;
        this.mvpStateRepository = mvpStateRepository;
        this.ideaRepository = ideaRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
        this.submissionRepository = submissionRepository;
        this.mentorQuestionRepository = mentorQuestionRepository;
    }

    /**
     * Resolves the room overview returning either the planning variant or the live build variant.
     */
    @Transactional(readOnly = true)
    public Object getOverview(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (!"build".equalsIgnoreCase(room.getStage())) {
            return buildPlanningOverview(room, user);
        }
        return buildBuildOverview(room, user);
    }

    /**
     * Returns progress burnup series alone for fast chart refreshes.
     */
    @Transactional(readOnly = true)
    public ProgressService.ProgressResultDto getProgress(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        return progressService.calculate(room);
    }

    /**
     * Returns workload metrics per room member scoped to the current phase or overall sprint.
     */
    @Transactional(readOnly = true)
    public WorkloadService.WorkloadResponseDto getWorkload(UUID roomId, String scope, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        return workloadService.calculate(room, scope);
    }

    /**
     * Computes navigation badge counters for open tasks, attention items, github, submission, and mentor questions.
     */
    @Transactional(readOnly = true)
    public NavBadgesDto getNavBadges(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        long openTasks = taskRepository.findByRoomId(room.getId()).stream().filter(t -> !t.isConfirmedDone() && !t.isDropped()).count();
        List<AttentionItem> attentionItems = attentionEngine.evaluate(room);
        long attentionCount = attentionItems.size();
        long github = attentionItems.stream()
                .filter(item -> item.actionRoute() != null && item.actionRoute().contains("/github"))
                .count();

        long submission = 0;
        if (room.getEventEnd() != null) {
            Duration timeLeft = Duration.between(clock.instant(), room.getEventEnd());
            long hoursLeft = timeLeft.toHours();
            if (hoursLeft <= 2 && !timeLeft.isNegative()) {
                boolean verifiedOrSubmitted = submissionRepository.findById(room.getId())
                        .map(s -> "VERIFIED".equalsIgnoreCase(s.getStatus()) || "SUBMITTED".equalsIgnoreCase(s.getStatus()))
                        .orElse(false);
                if (!verifiedOrSubmitted) {
                    submission = 1;
                }
            }
        }

        long mentor = mentorQuestionRepository.countByRoomIdAndStatus(room.getId(), "OPEN");

        return new NavBadgesDto(
                openTasks,
                attentionCount,
                openTasks,
                attentionCount,
                github,
                submission,
                mentor
        );
    }

    private PlanningOverviewResponse buildPlanningOverview(Room room, User user) {
        RoomSummaryDto roomSummary = toRoomSummary(room);
        Object journey = stageService.getJourney(room);

        String briefSummary = null;
        Optional<Brief> briefOpt = briefRepository.findByRoomId(room.getId());
        if (briefOpt.isPresent()) {
            briefSummary = briefOpt.get().getProblemStatement();
        }

        long pending = ideaRepository.countByRoomIdAndStatus(room.getId(), "PENDING");
        long approved = ideaRepository.countByRoomIdAndStatus(room.getId(), "APPROVED");
        long rejected = ideaRepository.countByRoomIdAndStatus(room.getId(), "REJECTED");

        List<Idea> pendingIdeas = ideaRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(room.getId(), "PENDING");
        Set<UUID> contributorIds = new LinkedHashSet<>();
        for (Idea i : pendingIdeas) {
            contributorIds.add(i.getAuthorId());
        }
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(contributorIds)) {
            userMap.put(u.getId(), u);
        }
        List<ContributorWaitingDto> contributorsWaiting = new ArrayList<>();
        for (UUID uId : contributorIds) {
            User u = userMap.get(uId);
            if (u != null) {
                contributorsWaiting.add(new ContributorWaitingDto(u.getId(), u.getName(), u.getAvatarUrl()));
            }
        }
        PlanningIdeasDto ideasDto = new PlanningIdeasDto(pending, approved, rejected, contributorsWaiting);

        TeamDtos.TeamResponseDto teamResp = teamService.getTeam(room.getId(), user);
        List<OverviewMemberDto> members = new ArrayList<>();
        for (TeamDtos.TeamMemberDto m : teamResp.members()) {
            CurrentTaskDto cur = m.currentTask() != null ? new CurrentTaskDto(m.currentTask().key(), m.currentTask().summary()) : null;
            members.add(new OverviewMemberDto(m.userId(), m.name(), m.avatarUrl(), m.role(), m.status(), cur));
        }
        PlanningTeamDto teamDto = new PlanningTeamDto(members, teamResp.skillCoverage());

        return new PlanningOverviewResponse(
                "planning",
                roomSummary,
                journey,
                briefSummary,
                ideasDto,
                teamDto,
                clock.instant()
        );
    }

    private BuildOverviewResponse buildBuildOverview(Room room, User user) {
        RoomSummaryDto roomSummary = toRoomSummary(room);
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(room.getId());
        ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);

        // Vitals: Checkpoints
        CheckpointDtos.CheckpointsResponseDto checkpointsData = checkpointService.getCheckpoints(room.getId(), user);
        VitalsCheckpointsDto vitalsCheckpoints = new VitalsCheckpointsDto(checkpointsData.passedCount(), checkpointsData.total());

        // Vitals: Tasks
        List<Task> allTasks = taskRepository.findByRoomId(room.getId());
        Set<String> validPhaseKeys = phases.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()) || "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .map(p -> p.getPhaseKey() != null ? p.getPhaseKey().toUpperCase() : "")
                .collect(java.util.stream.Collectors.toSet());

        long todo = 0, inProgress = 0, done = 0, blocked = 0;
        long totalNonDropped = 0;
        for (Task t : allTasks) {
            if (t.isDropped()) continue;
            if (t.getPhaseKey() != null && !validPhaseKeys.isEmpty() && !validPhaseKeys.contains(t.getPhaseKey().toUpperCase())) {
                continue;
            }
            totalNonDropped++;
            if (t.isConfirmedDone()) done++;
            else if ("inprogress".equalsIgnoreCase(t.getStatus()) || "in_progress".equalsIgnoreCase(t.getStatus())) inProgress++;
            else todo++;
            if (t.isFlagged() && !t.isConfirmedDone()) blocked++;
        }
        long open = totalNonDropped - done;
        VitalsTasksDto vitalsTasks = new VitalsTasksDto(open, todo, inProgress, blocked);

        // Vitals: vsPlan
        ProgressService.ProgressResultDto progressResult = progressService.calculate(room);
        String planLabel = progressResult.deltaPct() < -5 ? "BEHIND" : (progressResult.deltaPct() > 5 ? "AHEAD" : "ON PLAN");
        VitalsVsPlanDto vitalsVsPlan = new VitalsVsPlanDto(
                progressResult.deltaPct(),
                progressResult.actualPct(),
                progressResult.plannedPct(),
                planLabel
        );

        // Team info
        TeamDtos.TeamResponseDto teamResp = teamService.getTeam(room.getId(), user);
        long activeCount = 0;
        List<VitalsTeamMemberDto> vitalsMembers = new ArrayList<>();
        List<OverviewMemberDto> overviewMembers = new ArrayList<>();

        for (TeamDtos.TeamMemberDto m : teamResp.members()) {
            boolean isActive = "working".equalsIgnoreCase(m.status()) || "blocked".equalsIgnoreCase(m.status());
            if (isActive) activeCount++;
            if (vitalsMembers.size() < 4) {
                vitalsMembers.add(new VitalsTeamMemberDto(m.userId(), m.name(), m.avatarUrl(), m.status()));
            }
            CurrentTaskDto cur = m.currentTask() != null ? new CurrentTaskDto(m.currentTask().key(), m.currentTask().summary()) : null;
            overviewMembers.add(new OverviewMemberDto(m.userId(), m.name(), m.avatarUrl(), m.role(), m.status(), cur));
        }
        VitalsTeamDto vitalsTeam = new VitalsTeamDto(activeCount, teamResp.members().size(), vitalsMembers);
        OverviewVitalsDto vitals = new OverviewVitalsDto(vitalsCheckpoints, vitalsTasks, vitalsVsPlan, vitalsTeam);

        // Attention
        List<AttentionItem> attention = attentionEngine.evaluate(room);

        // My Tasks
        OverviewMyTasksDto myTasks = buildMyTasks(user.getId(), allTasks);

        // Activity (last 5)
        List<ActivityItemDto> recentActivity = activityService.listRoomActivity(user, room.getId(), 5, null).items();

        // Project Snapshot
        ProjectSnapshotDto project = buildProjectSnapshot(room);

        OverviewTeamDto team = new OverviewTeamDto(overviewMembers, teamResp.skillCoverage());
        List<WorkloadService.MemberWorkloadDto> workload = workloadService.calculate(room, "phase").members();

        return new BuildOverviewResponse(
                "build",
                roomSummary,
                clockCalc.clockStatus(),
                clockCalc.timeline(),
                clockCalc.currentPhase(),
                vitals,
                attention,
                checkpointsData.items(),
                progressResult,
                myTasks,
                recentActivity,
                project,
                team,
                workload,
                clock.instant()
        );
    }

    private OverviewMyTasksDto buildMyTasks(UUID userId, List<Task> allTasks) {
        Instant now = clock.instant();
        Instant in24h = now.plus(Duration.ofHours(24));

        List<Task> myOpenTasks = new ArrayList<>();
        for (Task t : allTasks) {
            if (t.isDropped()) continue;
            if (userId.equals(t.getAssigneeId()) && !t.isConfirmedDone()) {
                myOpenTasks.add(t);
            }
        }

        List<Task> nowTasks = new ArrayList<>();
        List<Task> todayTasks = new ArrayList<>();
        List<Task> laterTasks = new ArrayList<>();

        for (Task t : myOpenTasks) {
            if ("inprogress".equalsIgnoreCase(t.getStatus())) {
                nowTasks.add(t);
            } else if (t.getDueAt() != null && !t.getDueAt().isAfter(in24h)) {
                todayTasks.add(t);
            } else {
                laterTasks.add(t);
            }
        }

        List<TaskDto> nowDtos = new ArrayList<>();
        List<TaskDto> todayDtos = new ArrayList<>();
        List<TaskDto> laterDtos = new ArrayList<>();

        int budget = 6;
        for (Task t : nowTasks) {
            if (budget > 0) {
                nowDtos.add(taskDtoMapper.toSimpleDto(t));
                budget--;
            }
        }
        for (Task t : todayTasks) {
            if (budget > 0) {
                todayDtos.add(taskDtoMapper.toSimpleDto(t));
                budget--;
            }
        }
        for (Task t : laterTasks) {
            if (budget > 0) {
                laterDtos.add(taskDtoMapper.toSimpleDto(t));
                budget--;
            }
        }

        return new OverviewMyTasksDto(nowDtos, todayDtos, laterDtos, myOpenTasks.size());
    }

    private ProjectSnapshotDto buildProjectSnapshot(Room room) {
        Optional<MvpState> mvpOpt = mvpStateRepository.findById(room.getId());
        String identity = mvpOpt.map(MvpState::getIdentity).orElse(room.getName());
        String projectName = identity;
        if (projectName != null && !projectName.isBlank()) {
            String[] words = projectName.trim().split("\\s+");
            if (words.length > 4) {
                projectName = String.join(" ", Arrays.copyOfRange(words, 0, 4));
            }
        } else {
            projectName = room.getName();
        }

        Optional<Brief> briefOpt = briefRepository.findByRoomId(room.getId());
        List<RubricCriterionDto> rubric = new ArrayList<>();
        List<String> rules = new ArrayList<>();
        List<String> tracks = new ArrayList<>();

        if (briefOpt.isPresent()) {
            Brief b = briefOpt.get();
            List<BriefRubricItem> items = rubricRepository.findByBriefIdOrderByPositionAsc(b.getId());
            for (BriefRubricItem r : items) {
                rubric.add(new RubricCriterionDto(r.getCriterion(), r.getWeight()));
            }
            if (b.getAiPolicy() != null && !b.getAiPolicy().isBlank()) {
                rules.add("AI Policy: " + (b.getAiPolicy().length() > 30 ? b.getAiPolicy().substring(0, 30) + "..." : b.getAiPolicy()));
            }
            if (b.getDeliverables() != null) {
                rules.addAll(briefMapper.parseStringList(b.getDeliverables()));
            }
            if (b.getTracksAndPrizes() != null) {
                tracks.addAll(briefMapper.parseStringList(b.getTracksAndPrizes()));
            }
        }

        if (rubric.isEmpty()) {
            rubric.add(new RubricCriterionDto("Execution & Working Demo", 40));
            rubric.add(new RubricCriterionDto("Technical Innovation", 30));
            rubric.add(new RubricCriterionDto("Impact & Presentation", 30));
        }

        boolean runs = mvpOpt.map(MvpState::isHealthRuns).orElse(false);
        boolean stable = mvpOpt.map(MvpState::isHealthStable).orElse(false);
        boolean clear30 = mvpOpt.map(MvpState::isHealthClear30).orElse(false);
        boolean wow60 = mvpOpt.map(MvpState::isHealthWow60).orElse(false);
        int passedHealth = (runs ? 1 : 0) + (stable ? 1 : 0) + (clear30 ? 1 : 0) + (wow60 ? 1 : 0);

        MvpHealthChecksDto checks = new MvpHealthChecksDto(runs, stable, clear30, wow60);
        MvpHealthSnapshotDto healthSnapshot = new MvpHealthSnapshotDto(passedHealth, 4, checks);

        return new ProjectSnapshotDto(projectName, identity, rubric, healthSnapshot, rules, tracks);
    }

    private RoomSummaryDto toRoomSummary(Room room) {
        String templateName = room.getTemplateId() != null ? room.getTemplateId() : "Custom Event";
        return new RoomSummaryDto(
                room.getId(),
                room.getName(),
                templateName,
                room.getStage(),
                room.getEventStart(),
                room.getEventEnd()
        );
    }
}
