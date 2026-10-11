package com.hackathonos.backend.retro;

import com.hackathonos.backend.checkpoints.RoomCheckpoint;
import com.hackathonos.backend.checkpoints.RoomCheckpointRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.github.GithubCommitRepository;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.pitch.PitchRehearsalRepository;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service managing retrospective reviews, milestone timelines, awards, and next step decisions.
 */
@Service
public class RetroService {

    private static final List<String> ALLOWED_TAGS = List.of(
            "overscope", "late-testing", "unread-ai-code", "no-rehearsal",
            "conflict", "wifi-failure", "rules-miss"
    );

    private static final String TWO_WEEK_CONTINUE_TEMPLATE =
            "Week 1: Fix the cut-list items, clean up the codebase, and write clear README instructions.\n" +
            "Week 2: Onboard 3 real target users, gather feedback, and decide the next product milestone.";

    private final RetroRepository retroRepository;
    private final RetroItemRepository retroItemRepository;
    private final RetroAwardRepository retroAwardRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PlanPhaseRepository phaseRepository;
    private final IdeaRepository ideaRepository;
    private final RoomCheckpointRepository checkpointRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final GithubCommitRepository githubCommitRepository;
    private final DemoMediaRepository demoMediaRepository;
    private final SubmissionRepository submissionRepository;
    private final PitchRehearsalRepository rehearsalRepository;
    private final RoomAccess roomAccess;

    public RetroService(
            RetroRepository retroRepository,
            RetroItemRepository retroItemRepository,
            RetroAwardRepository retroAwardRepository,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            PlanPhaseRepository phaseRepository,
            IdeaRepository ideaRepository,
            RoomCheckpointRepository checkpointRepository,
            GithubRepoRepository githubRepoRepository,
            GithubCommitRepository githubCommitRepository,
            DemoMediaRepository demoMediaRepository,
            SubmissionRepository submissionRepository,
            PitchRehearsalRepository rehearsalRepository,
            RoomAccess roomAccess
    ) {
        this.retroRepository = retroRepository;
        this.retroItemRepository = retroItemRepository;
        this.retroAwardRepository = retroAwardRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.phaseRepository = phaseRepository;
        this.ideaRepository = ideaRepository;
        this.checkpointRepository = checkpointRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.githubCommitRepository = githubCommitRepository;
        this.demoMediaRepository = demoMediaRepository;
        this.submissionRepository = submissionRepository;
        this.rehearsalRepository = rehearsalRepository;
        this.roomAccess = roomAccess;
    }

    /**
     * Loads the retrospective dashboard model, facts, timeline, items, and awards.
     */
    @Transactional
    public RetroDtos.RetroResponse getRetro(UUID roomId, User user) {
        RoomMember callerMember = roomAccess.requireMember(roomId, user);
        Room room = roomRepository.findById(roomId).orElseThrow();

        Retro retro = retroRepository.findByRoomId(roomId).orElseGet(() -> {
            Retro r = new Retro(roomId, null, "", "", "", Instant.now());
            return retroRepository.save(r);
        });

        Instant now = Instant.now();
        boolean eventEnded = room.getEventEnd() != null && now.isAfter(room.getEventEnd());
        Instant eventStart = room.getEventStart() != null ? room.getEventStart() : room.getCreatedAt();

        // Facts
        Integer firstWorkingDemoHour = getCheckpointHour(roomId, "CORE_FLOW_WORKING", eventStart);
        Integer videoRecordedHour = getCheckpointHour(roomId, "VIDEO_RECORDED", eventStart);
        Optional<Submission> subOpt = submissionRepository.findByRoomId(roomId);
        Integer submissionHour = subOpt.filter(s -> s.getVerifiedAt() != null)
                .map(s -> (int) Duration.between(eventStart, s.getVerifiedAt()).toHours())
                .orElse(null);

        long commitCount = githubCommitRepository.countByRoomId(roomId);
        List<Task> tasks = taskRepository.findByRoomId(roomId);
        int tasksTotal = tasks.size();
        int tasksDone = (int) tasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();
        int ideasApproved = ideaRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(roomId, "APPROVED").size();

        RetroDtos.RetroFactsDto facts = new RetroDtos.RetroFactsDto(
                firstWorkingDemoHour, submissionHour, videoRecordedHour, (int) commitCount, tasksDone, tasksTotal, ideasApproved
        );

        // Timeline milestones
        List<RetroDtos.TimelineMilestoneDto> timeline = new ArrayList<>();
        timeline.add(new RetroDtos.TimelineMilestoneDto("m-kickoff", "Kickoff", "Kickoff", 0, "prep"));
        if (room.isIdeateDone()) {
            timeline.add(new RetroDtos.TimelineMilestoneDto("m-ideate", "Ideation locked", "Ideation locked", 2, "ideate"));
        }
        if (room.isPlanDone()) {
            timeline.add(new RetroDtos.TimelineMilestoneDto("m-plan", "Plan completed", "Plan completed", 4, "plan"));
        }
        if (firstWorkingDemoHour != null) {
            timeline.add(new RetroDtos.TimelineMilestoneDto("m-demo", "First working demo", "First working demo", firstWorkingDemoHour, "build"));
        }
        if (videoRecordedHour != null) {
            timeline.add(new RetroDtos.TimelineMilestoneDto("m-video", "Video recorded", "Video recorded", videoRecordedHour, "freeze"));
        }
        if (submissionHour != null) {
            timeline.add(new RetroDtos.TimelineMilestoneDto("m-ship", "Submission verified", "Submission verified", submissionHour, "ship"));
        }

        // Links
        Optional<GithubRepo> repo = githubRepoRepository.findById(roomId);
        Optional<DemoMedia> media = demoMediaRepository.findByRoomId(roomId);
        RetroDtos.ProjectLinksDto links = new RetroDtos.ProjectLinksDto(
                repo.map(GithubRepo::getUrl).orElse(null),
                media.map(DemoMedia::getVideoUrl).orElse(null),
                repo.map(GithubRepo::getDeployedLink).orElse(null)
        );

        // Team
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<RetroDtos.TeamMemberDto> team = new ArrayList<>();
        for (RoomMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            List<String> skills = skillRepository.findByMemberId(m.getId()).stream()
                    .map(RoomMemberSkill::getSkill).toList();
            team.add(new RetroDtos.TeamMemberDto(
                    u != null ? u.getName() : "Teammate",
                    u != null ? u.getAvatarUrl() : null,
                    m.getRole(),
                    skills
            ));
        }

        // Retro items
        List<RetroItem> allItems = retroItemRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
        List<RetroDtos.RetroItemDto> wentWell = new ArrayList<>();
        List<RetroDtos.RetroItemDto> didntGo = new ArrayList<>();
        List<RetroDtos.RetroItemDto> change = new ArrayList<>();

        for (RetroItem item : allItems) {
            User author = userRepository.findById(item.getAuthorId()).orElse(null);
            String authorName = author != null ? author.getName() : "Member";
            RetroDtos.RetroItemDto dto = new RetroDtos.RetroItemDto(item.getId(), item.getText(), item.getTag(), item.getKind(), authorName);
            if ("WENT_WELL".equalsIgnoreCase(item.getKind())) wentWell.add(dto);
            else if ("DIDNT_GO".equalsIgnoreCase(item.getKind())) didntGo.add(dto);
            else if ("CHANGE".equalsIgnoreCase(item.getKind())) change.add(dto);
        }

        // Awards
        List<RetroDtos.AwardDto> awards = retroAwardRepository.findByRoomIdOrderByNameAsc(roomId).stream()
                .map(a -> new RetroDtos.AwardDto(a.getId(), a.getName(), a.getDetail())).toList();

        // Time distribution by phase
        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<RetroDtos.TimeDistributionDto> timeDist = new ArrayList<>();
        long totalRoomHours = room.getEventStart() != null && room.getEventEnd() != null
                ? Math.max(1, Duration.between(room.getEventStart(), room.getEventEnd()).toHours()) : 24;

        for (PlanPhase p : phases) {
            List<Task> phaseTasks = taskRepository.findByRoomIdAndPhaseId(roomId, p.getId());
            int pDone = (int) phaseTasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();
            double share = (p.getEndPct().doubleValue() - p.getStartPct().doubleValue()) / 100.0;
            double pHours = Math.round(share * totalRoomHours * 10.0) / 10.0;
            timeDist.add(new RetroDtos.TimeDistributionDto(p.getName().toLowerCase(Locale.ROOT), p.getName(), pDone, pHours, pHours, pHours));
        }

        boolean canDecide = "leader".equalsIgnoreCase(callerMember.getRole());

        // UI compatibility wrappers
        long rehearsals = rehearsalRepository.countByRoomId(roomId);
        RetroDtos.WrappedStatsDto wrapped = new RetroDtos.WrappedStatsDto(
                (int) totalRoomHours, tasksDone, firstWorkingDemoHour != null ? firstWorkingDemoHour : 12, (int) rehearsals
        );

        String workedCombined = wentWell.stream().map(RetroDtos.RetroItemDto::text).reduce((a, b) -> a + "\n" + b).orElse("");
        String didntCombined = didntGo.stream().map(RetroDtos.RetroItemDto::text).reduce((a, b) -> a + "\n" + b).orElse("");
        String changeCombined = change.stream().map(RetroDtos.RetroItemDto::text).reduce((a, b) -> a + "\n" + b).orElse("");
        RetroDtos.RetroAnswersDto retroAnswers = new RetroDtos.RetroAnswersDto(workedCombined, didntCombined, changeCombined);

        List<String> w1 = List.of("Fix cut-list items", "Codebase cleanup and README docs");
        List<String> w2 = List.of("Onboard 3 real pilot users", "Evaluate next sprint milestone");
        RetroDtos.TwoWeekPlanDto twoWeekPlan = new RetroDtos.TwoWeekPlanDto(w1, w2);

        List<RetroDtos.PortfolioLinkDto> pLinks = new ArrayList<>();
        if (links.repoUrl() != null) pLinks.add(new RetroDtos.PortfolioLinkDto("GitHub Repository", links.repoUrl()));
        if (links.videoUrl() != null) pLinks.add(new RetroDtos.PortfolioLinkDto("Demo Video", links.videoUrl()));
        if (links.deployedUrl() != null) pLinks.add(new RetroDtos.PortfolioLinkDto("Live Deployment", links.deployedUrl()));

        List<RetroDtos.PortfolioAwardDto> pAwards = awards.stream()
                .map(a -> new RetroDtos.PortfolioAwardDto(a.name(), a.detail())).toList();

        RetroDtos.PortfolioEntryDto portfolioEntry = new RetroDtos.PortfolioEntryDto(
                new RetroDtos.PortfolioProjectDto(room.getName(), retro.getPortfolioSummary() != null ? retro.getPortfolioSummary() : ""),
                callerMember.getRole(),
                pLinks,
                pAwards
        );

        return new RetroDtos.RetroResponse(
                eventEnded,
                facts,
                timeline,
                links,
                team,
                wentWell,
                didntGo,
                change,
                ALLOWED_TAGS,
                retro.getDecision(),
                retro.getNextSteps(),
                retro.getResult(),
                awards,
                retro.getPortfolioSummary(),
                timeDist,
                new RetroDtos.PermissionsDto(canDecide),
                wrapped,
                timeline,
                timeDist,
                retroAnswers,
                twoWeekPlan,
                portfolioEntry,
                now
        );
    }

    /**
     * Updates retrospective notes, portfolio summary, and leader project decision.
     */
    @Transactional
    public RetroDtos.RetroResponse updateRetro(UUID roomId, User user, RetroDtos.UpdateRetroRequest req) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Retro retro = retroRepository.findByRoomId(roomId)
                .orElseGet(() -> new Retro(roomId, null, "", "", "", Instant.now()));

        if (req.decision() != null && !req.decision().isBlank()) {
            if (!"leader".equalsIgnoreCase(member.getRole())) {
                throw new ForbiddenException("LEADER_ONLY", "Only the room leader can decide whether to continue or archive the project");
            }
            String dec = req.decision().trim().toUpperCase(Locale.ROOT);
            retro.setDecision(dec);

            if ("CONTINUE".equals(dec) && (req.nextSteps() == null || req.nextSteps().isBlank()) && (retro.getNextSteps() == null || retro.getNextSteps().isBlank())) {
                retro.setNextSteps(TWO_WEEK_CONTINUE_TEMPLATE);
            }
        }

        if (req.nextSteps() != null) retro.setNextSteps(req.nextSteps().trim());
        if (req.result() != null) retro.setResult(req.result().trim());
        if (req.portfolioSummary() != null) retro.setPortfolioSummary(req.portfolioSummary().trim());
        retro.setUpdatedAt(Instant.now());

        retroRepository.save(retro);
        return getRetro(roomId, user);
    }

    /**
     * Adds a retrospective item (went well, didn't go well, or change).
     */
    @Transactional
    public RetroDtos.RetroItemDto addRetroItem(UUID roomId, User user, RetroDtos.CreateRetroItemRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.text() == null || req.text().isBlank()) {
            throw new BadRequestException("INVALID_TEXT", "Retro item text cannot be empty");
        }

        String kind = req.kind() != null ? req.kind().trim().toUpperCase(Locale.ROOT) : "WENT_WELL";
        RetroItem item = new RetroItem(
                roomId,
                kind,
                req.text().trim(),
                req.tag() != null ? req.tag().trim().toLowerCase(Locale.ROOT) : null,
                user.getId(),
                Instant.now()
        );
        RetroItem saved = retroItemRepository.save(item);
        return new RetroDtos.RetroItemDto(saved.getId(), saved.getText(), saved.getTag(), saved.getKind(), user.getName());
    }

    /**
     * Deletes a retrospective item; author or room leader only.
     */
    @Transactional
    public void deleteRetroItem(UUID roomId, UUID itemId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        RetroItem item = retroItemRepository.findById(itemId)
                .filter(i -> i.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Retro item not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isAuthor = user.getId().equals(item.getAuthorId());
        if (!isLeader && !isAuthor) {
            throw new ForbiddenException("CANNOT_DELETE_ITEM", "Only the author or room leader can delete this item");
        }
        retroItemRepository.delete(item);
    }

    /**
     * Adds a project award or superlative.
     */
    @Transactional
    public RetroDtos.AwardDto addAward(UUID roomId, User user, RetroDtos.CreateAwardRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.name() == null || req.name().isBlank()) {
            throw new BadRequestException("INVALID_NAME", "Award name cannot be empty");
        }

        RetroAward award = new RetroAward(
                roomId,
                req.name().trim(),
                req.detail() != null ? req.detail().trim() : ""
        );
        RetroAward saved = retroAwardRepository.save(award);
        return new RetroDtos.AwardDto(saved.getId(), saved.getName(), saved.getDetail());
    }

    /**
     * Deletes a project award.
     */
    @Transactional
    public void deleteAward(UUID roomId, UUID awardId, User user) {
        roomAccess.requireMember(roomId, user);
        RetroAward award = retroAwardRepository.findById(awardId)
                .filter(a -> a.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("AWARD_NOT_FOUND", "Award not found"));
        retroAwardRepository.delete(award);
    }

    private Integer getCheckpointHour(UUID roomId, String key, Instant start) {
        return checkpointRepository.findByRoomIdAndRuleKey(roomId, key)
                .filter(c -> c.getPassedAt() != null)
                .map(c -> (int) Math.max(0, Duration.between(start, c.getPassedAt()).toHours()))
                .orElse(null);
    }
}
