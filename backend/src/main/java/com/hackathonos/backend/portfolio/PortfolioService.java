package com.hackathonos.backend.portfolio;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.portfolio.PortfolioDtos.*;
import com.hackathonos.backend.retro.Retro;
import com.hackathonos.backend.retro.RetroAwardRepository;
import com.hackathonos.backend.retro.RetroRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.submission.Submission;
import com.hackathonos.backend.submission.SubmissionLink;
import com.hackathonos.backend.submission.SubmissionLinkRepository;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PortfolioService {

    private final PortfolioSettingsRepository settingsRepository;
    private final PortfolioVisibilityRepository visibilityRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final RoomRepository roomRepository;
    private final TaskRepository taskRepository;
    private final IdeaRepository ideaRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionLinkRepository submissionLinkRepository;
    private final RetroRepository retroRepository;
    private final RetroAwardRepository awardRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final DemoMediaRepository demoMediaRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final UserRepository userRepository;
    private final MilestoneEvaluator milestoneEvaluator;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public PortfolioService(
            PortfolioSettingsRepository settingsRepository,
            PortfolioVisibilityRepository visibilityRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            RoomRepository roomRepository,
            TaskRepository taskRepository,
            IdeaRepository ideaRepository,
            SubmissionRepository submissionRepository,
            SubmissionLinkRepository submissionLinkRepository,
            RetroRepository retroRepository,
            RetroAwardRepository awardRepository,
            GithubRepoRepository githubRepoRepository,
            DemoMediaRepository demoMediaRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            UserRepository userRepository,
            MilestoneEvaluator milestoneEvaluator,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.settingsRepository = settingsRepository;
        this.visibilityRepository = visibilityRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.roomRepository = roomRepository;
        this.taskRepository = taskRepository;
        this.ideaRepository = ideaRepository;
        this.submissionRepository = submissionRepository;
        this.submissionLinkRepository = submissionLinkRepository;
        this.retroRepository = retroRepository;
        this.awardRepository = awardRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.demoMediaRepository = demoMediaRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.userRepository = userRepository;
        this.milestoneEvaluator = milestoneEvaluator;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public FullPortfolioResponse getMyPortfolio(User user) {
        return buildPortfolio(user, true);
    }

    @Transactional(readOnly = true)
    public FullPortfolioResponse getPublicPortfolioByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new NotFoundException("PORTFOLIO_NOT_FOUND", "Username required");
        }
        User owner = userRepository.findByUsername(username.trim().toLowerCase(Locale.ROOT))
                .or(() -> userRepository.findByLogin(username.trim()))
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "Builder not found"));

        PortfolioSettings settings = settingsRepository.findByUserId(owner.getId())
                .orElse(null);

        if (settings == null || !settings.isPublic()) {
            throw new NotFoundException("PORTFOLIO_PRIVATE", "This builder passport is private");
        }

        return buildPortfolio(owner, false);
    }

    @Transactional
    public PortfolioSettingsDto updateSettings(User user, UpdateSettingsRequest req) {
        PortfolioSettings settings = settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> new PortfolioSettings(user.getId(), user.getUsername(), false));

        if (req.isPublic() != null) settings.setPublic(req.isPublic());
        if (req.bio() != null) settings.setBio(req.bio().trim());
        if (req.slug() != null && !req.slug().isBlank()) settings.setSlug(req.slug().trim().toLowerCase(Locale.ROOT));

        if (req.customLinks() != null) {
            try {
                settings.setCustomLinks(objectMapper.writeValueAsString(req.customLinks()));
            } catch (Exception ignored) {}
        }

        settings.setUpdatedAt(Instant.now());
        PortfolioSettings saved = settingsRepository.save(settings);
        return toSettingsDto(saved);
    }

    @Transactional
    public void updateProjectCuration(UUID roomId, User user, UpdateProjectCurationRequest req) {
        PortfolioVisibility vis = visibilityRepository.findByUserIdAndRoomId(user.getId(), roomId)
                .orElseGet(() -> new PortfolioVisibility(user.getId(), roomId, true));

        if (req.pinned() != null) vis.setPinned(req.pinned());
        if (req.pinOrder() != null) vis.setPinOrder(req.pinOrder());
        if (req.visible() != null) vis.setVisible(req.visible());
        vis.setUpdatedAt(Instant.now());

        visibilityRepository.save(vis);
    }

    private FullPortfolioResponse buildPortfolio(User user, boolean isOwner) {
        UUID userId = user.getId();
        PortfolioSettings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> new PortfolioSettings(userId, user.getUsername(), false));

        List<CustomLinkDto> customLinks = parseCustomLinks(settings.getCustomLinks());
        List<RoomMember> memberships = memberRepository.findByUserId(userId);

        Map<UUID, PortfolioVisibility> visibilityMap = new HashMap<>();
        for (PortfolioVisibility pv : visibilityRepository.findByUserId(userId)) {
            visibilityMap.put(pv.getRoomId(), pv);
        }

        List<ProjectCardDto> allProjectCards = new ArrayList<>();
        List<PassportStampDto> timelineStamps = new ArrayList<>();
        Map<String, StackAccumulator> stackMap = new HashMap<>();
        Map<UUID, Integer> sharedRoomCounts = new HashMap<>();

        long hackathonsJoined = memberships.size();
        long projectsShipped = 0;
        long teamsLed = 0;
        int builderTasksCount = 0;
        int leaderActionsCount = 0;
        int productIdeasCount = 0;
        int pitchPresenceCount = 0;

        DateTimeFormatter monthYearFmt = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneOffset.UTC);

        // Fetch user's room data
        for (RoomMember member : memberships) {
            Room room = roomRepository.findById(member.getRoomId()).orElse(null);
            if (room == null || room.getDeletedAt() != null) continue;

            PortfolioVisibility vis = visibilityMap.getOrDefault(room.getId(), null);
            boolean visible = vis == null || vis.isVisible();
            boolean isPinned = vis != null && vis.isPinned();
            int pinOrder = vis != null ? vis.getPinOrder() : 0;

            if (!isOwner && !visible) {
                continue; // Private projects never leak in public view
            }

            boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
            if (isLeader) teamsLed++;

            Optional<Submission> submissionOpt = submissionRepository.findByRoomId(room.getId());
            boolean isSubmitted = room.getSubmittedAt() != null || (submissionOpt.isPresent() && submissionOpt.get().isComplete());
            if (isSubmitted) projectsShipped++;

            // Collaborators tracking
            List<RoomMember> roomMembers = memberRepository.findByRoomId(room.getId());
            for (RoomMember other : roomMembers) {
                if (!other.getUserId().equals(userId)) {
                    sharedRoomCounts.put(other.getUserId(), sharedRoomCounts.getOrDefault(other.getUserId(), 0) + 1);
                }
            }

            // Case Study data derivation
            CaseStudyDetailDto caseStudy = buildCaseStudy(user, room, member, roomMembers, submissionOpt);

            // Tech stack extraction
            List<String> roomStack = caseStudy.techStack();
            for (String tech : roomStack) {
                String cleanTech = tech.trim();
                if (cleanTech.isEmpty()) continue;
                StackAccumulator acc = stackMap.computeIfAbsent(cleanTech, k -> new StackAccumulator(k, detectCategory(k)));
                acc.addProject(room.getName());
            }

            // Role metrics breakdown
            builderTasksCount += caseStudy.myContribution().tasksCompleted();
            if (isLeader) leaderActionsCount += 1;
            productIdeasCount += caseStudy.myContribution().ideasAccepted();
            if (caseStudy.links().demoUrl() != null || caseStudy.links().deckUrl() != null) {
                pitchPresenceCount += 1;
            }

            String dates = formatDates(room.getEventStart() != null ? room.getEventStart() : room.getCreatedAt(), room.getEventEnd(), monthYearFmt);
            String status = determineStatus(room, isSubmitted);
            String coverUrl = caseStudy.links().demoUrl() != null ? null : null; // abstract cover will be rendered on frontend

            ProjectCardDto card = new ProjectCardDto(
                    room.getId(),
                    room.getName(),
                    room.getTemplateId() != null ? room.getTemplateId() : "Open Track",
                    dates,
                    member.getRole() != null ? member.getRole() : "BUILDER",
                    extractPitch(room, caseStudy),
                    roomStack,
                    caseStudy.team(),
                    caseStudy.links(),
                    isPinned,
                    pinOrder,
                    visible,
                    coverUrl,
                    status,
                    caseStudy
            );
            allProjectCards.add(card);

            PassportStampDto stamp = new PassportStampDto(
                    room.getId(),
                    room.getName(),
                    room.getTemplateId() != null ? room.getTemplateId() : "Hackathon",
                    dates,
                    member.getRole() != null ? member.getRole() : "BUILDER",
                    resolveFurthestStage(room, isSubmitted),
                    isSubmitted,
                    caseStudy.outcome(),
                    isPinned,
                    visible,
                    caseStudy
            );
            timelineStamps.add(stamp);
        }

        // Sort projects for featured display: pinned first by pinOrder, then recent
        List<ProjectCardDto> featuredProjects = allProjectCards.stream()
                .filter(ProjectCardDto::pinned)
                .sorted(Comparator.comparingInt(ProjectCardDto::pinOrder))
                .limit(3)
                .toList();

        if (featuredProjects.isEmpty() && !allProjectCards.isEmpty()) {
            // Default top 3 if none pinned
            featuredProjects = allProjectCards.stream().limit(3).toList();
        }

        // Timeline stamps sorted chronologically descending
        timelineStamps.sort((a, b) -> b.name().compareToIgnoreCase(a.name()));

        // Heatmap and streaks
        ActivityHeatmapDto heatmap = buildHeatmap(userId);

        long tasksCompleted = taskRepository.countByAssigneeIdAndConfirmedAtIsNotNull(userId);
        long ideasApproved = ideaRepository.countByAuthorIdAndStatus(userId, "APPROVED");
        long commitsCount = countUserCommits(userId);

        // Teammates built with
        List<CollaboratorDto> collaborators = buildCollaborators(sharedRoomCounts);

        // Stack constellation
        List<StackItemDto> constellation = stackMap.values().stream()
                .map(acc -> new StackItemDto(acc.name, acc.category, acc.projects.size(), new ArrayList<>(acc.projects)))
                .sorted(Comparator.comparingInt(StackItemDto::projectCount).reversed())
                .limit(20)
                .toList();

        // Role fingerprint
        int totalRolePoints = builderTasksCount + leaderActionsCount + productIdeasCount + pitchPresenceCount;
        RoleFingerprintDto roleFingerprint = new RoleFingerprintDto(
                builderTasksCount,
                leaderActionsCount,
                productIdeasCount,
                pitchPresenceCount,
                totalRolePoints
        );

        // Milestones
        MilestoneEvaluator.MilestoneContext milestoneCtx = new MilestoneEvaluator.MilestoneContext(
                hackathonsJoined,
                projectsShipped,
                teamsLed,
                tasksCompleted,
                ideasApproved,
                commitsCount,
                heatmap.days().isEmpty() ? 0 : calculateStreak(heatmap.days()),
                collaborators.size()
        );
        List<MilestoneDto> milestones = milestoneEvaluator.evaluate(milestoneCtx);

        // Computed Builder Line
        String topStack = constellation.stream().limit(2).map(StackItemDto::name).reduce((a, b) -> a + " & " + b).orElse(null);
        String builderLine = computeBuilderLine(teamsLed, projectsShipped, hackathonsJoined, topStack);

        PortfolioStatsDto stats = new PortfolioStatsDto(
                hackathonsJoined,
                projectsShipped,
                tasksCompleted,
                teamsLed,
                collaborators.size(),
                calculateStreak(heatmap.days()),
                heatmap.totalActions()
        );

        UserProfileDto profile = new UserProfileDto(
                user.getId(),
                user.getName(),
                user.getUsername() != null ? user.getUsername() : user.getLogin(),
                isOwner ? user.getEmail() : null, // Never leak email to public
                user.getAvatarUrl(),
                user.getAvatarType(),
                user.getAvatarPreset(),
                user.getProvider(),
                user.getLogin(),
                user.getCreatedAt(),
                settings.getBio(),
                customLinks,
                builderLine
        );

        return new FullPortfolioResponse(
                profile,
                toSettingsDto(settings),
                stats,
                featuredProjects,
                timelineStamps,
                heatmap,
                constellation,
                roleFingerprint,
                collaborators,
                milestones,
                isOwner
        );
    }

    private CaseStudyDetailDto buildCaseStudy(
            User user,
            Room room,
            RoomMember member,
            List<RoomMember> roomMembers,
            Optional<Submission> submissionOpt
    ) {
        UUID roomId = room.getId();
        Optional<Retro> retroOpt = retroRepository.findByRoomId(roomId);
        Optional<GithubRepo> repoOpt = githubRepoRepository.findById(roomId);
        Optional<DemoMedia> mediaOpt = demoMediaRepository.findByRoomId(roomId);

        // Real problem definition from Doc PRD or room description
        String problem = room.getProjectDescription();
        if (problem == null || problem.isBlank()) {
            problem = room.getDescription();
        }

        // Real MVP definition
        String whatWeBuilt = retroOpt.map(Retro::getPortfolioSummary).filter(s -> !s.isBlank()).orElse(null);
        if (whatWeBuilt == null && submissionOpt.isPresent()) {
            whatWeBuilt = extractSubmissionDraftField(submissionOpt.get().getDraft(), "whatItDoes");
        }
        if (whatWeBuilt == null) {
            whatWeBuilt = problem;
        }

        // Tech stack
        List<String> techStack = extractRoomStack(roomId, member);

        // My contribution
        List<Task> myTasks = taskRepository.findByRoomIdAndAssigneeId(roomId, user.getId());
        List<String> completedTaskSummaries = myTasks.stream()
                .filter(t -> "DONE".equalsIgnoreCase(t.getStatus()) || t.getConfirmedAt() != null)
                .map(Task::getSummary)
                .toList();

        long ideasAcceptedCount = ideaRepository.findByRoomIdAndStatus(roomId, "APPROVED").stream()
                .filter(i -> user.getId().equals(i.getAuthorId()))
                .count();

        int commitCount = 0;
        int additions = 0;
        int deletions = 0;
        try {
            List<Map<String, Object>> commitStats = jdbcTemplate.queryForList(
                    "SELECT COUNT(*) AS c, COALESCE(SUM(additions), 0) AS a, COALESCE(SUM(deletions), 0) AS d " +
                    "FROM github_commits WHERE room_id = ? AND (author_user_id = ? OR author_login = ?)",
                    roomId, user.getId(), user.getLogin()
            );
            if (!commitStats.isEmpty()) {
                commitCount = ((Number) commitStats.get(0).get("c")).intValue();
                additions = ((Number) commitStats.get(0).get("a")).intValue();
                deletions = ((Number) commitStats.get(0).get("d")).intValue();
            }
        } catch (Exception ignored) {}

        ContributionDto myContribution = new ContributionDto(
                completedTaskSummaries.size(),
                (int) ideasAcceptedCount,
                commitCount,
                additions,
                deletions,
                completedTaskSummaries
        );

        // Team members
        List<TeamMemberSummaryDto> team = roomMembers.stream().map(m -> {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (u == null) return null;
            return new TeamMemberSummaryDto(
                    u.getId(),
                    u.getName(),
                    u.getUsername() != null ? u.getUsername() : u.getLogin(),
                    u.getAvatarUrl(),
                    u.getAvatarType(),
                    u.getAvatarPreset(),
                    m.getRole()
            );
        }).filter(Objects::nonNull).toList();

        // Links
        List<SubmissionLink> subLinks = submissionLinkRepository.findByRoomIdOrderByLabelAsc(roomId);
        String repoUrl = repoOpt.map(GithubRepo::getUrl).orElse(findSubLink(subLinks, "repo", "github"));
        String liveUrl = repoOpt.map(GithubRepo::getDeployedLink).orElse(findSubLink(subLinks, "live", "app", "site"));
        String videoUrl = mediaOpt.map(DemoMedia::getVideoUrl).orElse(findSubLink(subLinks, "demo", "video", "youtube", "loom"));
        String deckUrl = findSubLink(subLinks, "deck", "pitch", "slides", "canva");
        String submissionUrl = findSubLink(subLinks, "submission", "devpost");

        ProjectLinksDto links = new ProjectLinksDto(liveUrl != null ? liveUrl : videoUrl, videoUrl, deckUrl, repoUrl, liveUrl, submissionUrl);

        // Outcome and awards
        String outcome = retroOpt.map(Retro::getResult).filter(s -> !s.isBlank()).orElse(null);
        if (outcome == null && submissionOpt.isPresent() && submissionOpt.get().isComplete()) {
            outcome = "Submitted to Hackathon";
        }

        List<AwardDto> awards = awardRepository.findByRoomIdOrderByNameAsc(roomId).stream()
                .map(a -> new AwardDto(a.getId(), a.getName(), a.getDetail()))
                .toList();

        return new CaseStudyDetailDto(
                problem,
                whatWeBuilt,
                techStack,
                myContribution,
                team,
                links,
                outcome,
                awards
        );
    }

    private ActivityHeatmapDto buildHeatmap(UUID userId) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        LocalDate sinceDate = today.minusDays(83);
        Instant sinceInstant = sinceDate.atStartOfDay().toInstant(ZoneOffset.UTC);

        Map<String, HeatmapDayAccumulator> dayMap = new HashMap<>();
        for (int i = 83; i >= 0; i--) {
            String dateStr = today.minusDays(i).toString();
            dayMap.put(dateStr, new HeatmapDayAccumulator(dateStr));
        }

        // Tasks
        try {
            jdbcTemplate.query(
                    "SELECT TO_CHAR(confirmed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, r.name AS rname, COUNT(*) AS cnt " +
                    "FROM tasks t LEFT JOIN rooms r ON t.room_id = r.id " +
                    "WHERE t.assignee_id = ? AND t.confirmed_at >= ? " +
                    "GROUP BY TO_CHAR(confirmed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'), r.name",
                    rs -> {
                        String day = rs.getString("day_str");
                        String rname = rs.getString("rname");
                        int cnt = rs.getInt("cnt");
                        HeatmapDayAccumulator acc = dayMap.get(day);
                        if (acc != null) {
                            acc.tasks += cnt;
                            acc.addRoom(rname, cnt);
                        }
                    },
                    userId, java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        // Ideas
        try {
            jdbcTemplate.query(
                    "SELECT TO_CHAR(COALESCE(decided_at, created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt " +
                    "FROM ideas WHERE author_id = ? AND status = 'APPROVED' AND COALESCE(decided_at, created_at) >= ? " +
                    "GROUP BY TO_CHAR(COALESCE(decided_at, created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        HeatmapDayAccumulator acc = dayMap.get(day);
                        if (acc != null) acc.ideas += cnt;
                    },
                    userId, java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        // Commits
        try {
            jdbcTemplate.query(
                    "SELECT TO_CHAR(committed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt " +
                    "FROM github_commits WHERE author_user_id = ? AND committed_at >= ? " +
                    "GROUP BY TO_CHAR(committed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        HeatmapDayAccumulator acc = dayMap.get(day);
                        if (acc != null) acc.commits += cnt;
                    },
                    userId, java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        // Docs edited
        try {
            jdbcTemplate.query(
                    "SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt " +
                    "FROM doc_versions WHERE created_by = ? AND created_at >= ? " +
                    "GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        HeatmapDayAccumulator acc = dayMap.get(day);
                        if (acc != null) acc.docs += cnt;
                    },
                    userId, java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        List<DailyActivityDto> days = new ArrayList<>(84);
        int total = 0;
        int maxCount = 0;
        String busiestDate = null;
        String busiestRoom = null;

        for (int i = 83; i >= 0; i--) {
            String dateStr = today.minusDays(i).toString();
            HeatmapDayAccumulator acc = dayMap.get(dateStr);
            int count = acc.total();
            total += count;
            days.add(new DailyActivityDto(dateStr, count, acc.tasks, acc.commits, acc.ideas, acc.docs));

            if (count > maxCount) {
                maxCount = count;
                busiestDate = dateStr;
                busiestRoom = acc.topRoom();
            }
        }

        BusiestDayDto busiest = maxCount > 0 ? new BusiestDayDto(busiestDate, maxCount, busiestRoom) : null;
        return new ActivityHeatmapDto(days, busiest, total);
    }

    private List<CollaboratorDto> buildCollaborators(Map<UUID, Integer> sharedCounts) {
        List<CollaboratorDto> list = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : sharedCounts.entrySet()) {
            User u = userRepository.findById(entry.getKey()).orElse(null);
            if (u == null) continue;
            boolean isPublic = settingsRepository.findByUserId(u.getId()).map(PortfolioSettings::isPublic).orElse(false);
            list.add(new CollaboratorDto(
                    u.getId(),
                    u.getName(),
                    u.getUsername() != null ? u.getUsername() : u.getLogin(),
                    u.getAvatarUrl(),
                    u.getAvatarType(),
                    u.getAvatarPreset(),
                    entry.getValue(),
                    isPublic
            ));
        }
        list.sort(Comparator.comparingInt(CollaboratorDto::sharedHackathonsCount).reversed());
        return list;
    }

    private String computeBuilderLine(long teamsLed, long projectsShipped, long totalJoined, String topStack) {
        StringBuilder sb = new StringBuilder();
        if (teamsLed > 0) {
            sb.append("Led ").append(teamsLed).append(teamsLed == 1 ? " team. " : " teams. ");
        } else if (projectsShipped > 0) {
            sb.append("Shipped ").append(projectsShipped).append(projectsShipped == 1 ? " project. " : " projects. ");
        } else {
            sb.append("Joined ").append(totalJoined).append(totalJoined == 1 ? " hackathon. " : " hackathons. ");
        }

        if (topStack != null && !topStack.isBlank()) {
            sb.append("Mostly builds in ").append(topStack).append(".");
        } else {
            sb.append("Active builder on [brackit].");
        }
        return sb.toString();
    }

    private int calculateStreak(List<DailyActivityDto> days) {
        if (days == null || days.isEmpty()) return 0;
        int streak = 0;
        int i = days.size() - 1;
        if (days.get(i).count() == 0 && i > 0) {
            i--; // Allow today to not be over yet
        }
        while (i >= 0 && days.get(i).count() > 0) {
            streak++;
            i--;
        }
        return streak;
    }

    private long countUserCommits(UUID userId) {
        try {
            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM github_commits WHERE author_user_id = ?",
                    Long.class,
                    userId
            );
            return count != null ? count : 0L;
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private List<String> extractRoomStack(UUID roomId, RoomMember member) {
        LinkedHashSet<String> stack = new LinkedHashSet<>();
        // 1. Member assigned skills
        skillRepository.findByMemberId(member.getId()).forEach(s -> {
            if (s.getSkill() != null && !s.getSkill().isBlank()) stack.add(s.getSkill().trim());
        });

        // 2. Room TECH.md doc if exists
        Optional<Doc> techDoc = docRepository.findByRoomIdAndFileName(roomId, "TECH.md");
        if (techDoc.isPresent()) {
            Optional<DocVersion> ver = docVersionRepository.findByDocIdAndVersion(techDoc.get().getId(), techDoc.get().getCurrentVersion());
            ver.ifPresent(v -> stack.addAll(parseStackFromMarkdown(v.getContent())));
        }

        return new ArrayList<>(stack);
    }

    private List<String> parseStackFromMarkdown(String content) {
        if (content == null || content.isBlank()) return Collections.emptyList();
        List<String> list = new ArrayList<>();
        String[] keywords = {"React", "TypeScript", "Python", "Node.js", "Next.js", "Java", "Spring Boot", "PostgreSQL", "Tailwind", "Docker", "FastAPI", "Go", "Rust", "Vue", "GraphQL", "Redis"};
        for (String kw : keywords) {
            if (content.toLowerCase().contains(kw.toLowerCase())) {
                list.add(kw);
            }
        }
        return list;
    }

    private String detectCategory(String tech) {
        String t = tech.toLowerCase();
        if (t.contains("react") || t.contains("vue") || t.contains("next") || t.contains("css") || t.contains("tailwind") || t.contains("html") || t.contains("frontend")) return "Frontend";
        if (t.contains("java") || t.contains("spring") || t.contains("node") || t.contains("python") || t.contains("go") || t.contains("rust") || t.contains("fastapi") || t.contains("api")) return "Backend";
        if (t.contains("sql") || t.contains("postgres") || t.contains("redis") || t.contains("mongo") || t.contains("db")) return "Database";
        if (t.contains("docker") || t.contains("kube") || t.contains("aws") || t.contains("cloud") || t.contains("ci") || t.contains("devops")) return "Infra";
        return "Language";
    }

    private String formatDates(Instant start, Instant end, DateTimeFormatter fmt) {
        if (start == null) return "2026";
        String s = fmt.format(start);
        if (end == null) return s;
        String e = fmt.format(end);
        return s.equals(e) ? s : s + " - " + e;
    }

    private String determineStatus(Room room, boolean isSubmitted) {
        if (isSubmitted) return "SUBMITTED";
        if (room.getWorkflowStage() != null) return room.getWorkflowStage().toUpperCase();
        return "BUILDING";
    }

    private String resolveFurthestStage(Room room, boolean isSubmitted) {
        if (isSubmitted) return "submitted";
        if (room.getStage() != null) return room.getStage().toLowerCase();
        return "build";
    }

    private String extractPitch(Room room, CaseStudyDetailDto caseStudy) {
        if (caseStudy.problem() != null && !caseStudy.problem().isBlank()) {
            String p = caseStudy.problem().trim();
            int newline = p.indexOf('\n');
            if (newline > 0) p = p.substring(0, newline);
            return p.length() > 140 ? p.substring(0, 137) + "..." : p;
        }
        return room.getName() + " hackathon project";
    }

    private String extractSubmissionDraftField(String draftJson, String field) {
        if (draftJson == null || draftJson.isBlank()) return null;
        try {
            Map<String, Object> map = objectMapper.readValue(draftJson, new TypeReference<>() {});
            Object val = map.get(field);
            return val != null ? val.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String findSubLink(List<SubmissionLink> links, String... matchers) {
        for (SubmissionLink l : links) {
            String label = l.getLabel() != null ? l.getLabel().toLowerCase() : "";
            String url = l.getUrl() != null ? l.getUrl().toLowerCase() : "";
            for (String m : matchers) {
                if (label.contains(m) || url.contains(m)) {
                    return l.getUrl();
                }
            }
        }
        return null;
    }

    private List<CustomLinkDto> parseCustomLinks(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private PortfolioSettingsDto toSettingsDto(PortfolioSettings s) {
        return new PortfolioSettingsDto(
                s.isPublic(),
                s.getSlug(),
                s.getBio(),
                parseCustomLinks(s.getCustomLinks())
        );
    }

    private static class StackAccumulator {
        final String name;
        final String category;
        final Set<String> projects = new HashSet<>();
        StackAccumulator(String name, String category) {
            this.name = name;
            this.category = category;
        }
        void addProject(String p) { projects.add(p); }
    }

    private static class HeatmapDayAccumulator {
        final String date;
        int tasks = 0;
        int commits = 0;
        int ideas = 0;
        int docs = 0;
        final Map<String, Integer> roomActions = new HashMap<>();
        HeatmapDayAccumulator(String date) { this.date = date; }
        int total() { return tasks + commits + ideas + docs; }
        void addRoom(String room, int count) {
            if (room != null) roomActions.put(room, roomActions.getOrDefault(room, 0) + count);
        }
        String topRoom() {
            return roomActions.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        }
    }
}
