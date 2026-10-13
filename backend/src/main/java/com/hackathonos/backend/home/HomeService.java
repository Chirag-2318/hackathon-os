package com.hackathonos.backend.home;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.checkpoints.dto.CheckpointDtos;
import com.hackathonos.backend.checkpoints.dto.CheckpointDtos.CheckpointItemDto;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.home.HomeDtos.*;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.overview.ClockService;
import com.hackathonos.backend.overview.WorkloadService;
import com.hackathonos.backend.overview.dto.OverviewDtos.*;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.rooms.dto.JourneyDto;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskDtoMapper;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.tasks.dto.TaskDto;
import com.hackathonos.backend.team.dto.TeamDtos;
import com.hackathonos.backend.team.TeamService;
import com.hackathonos.backend.rooms.dto.NextStepDto;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class HomeService {

    private final RoomRepository roomRepository;
    private final RoomStageService stageService;
    private final ClockService clockService;
    private final WorkloadService workloadService;
    private final CheckpointService checkpointService;
    private final TeamService teamService;
    private final TaskRepository taskRepository;
    private final TaskDtoMapper taskDtoMapper;
    private final PlanPhaseRepository phaseRepository;
    private final BriefRepository briefRepository;
    private final IdeaRepository ideaRepository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final com.hackathonos.backend.rooms.RoomTimeService roomTimeService;
    private final com.hackathonos.backend.rooms.NextStepService nextStepService;
    private final com.hackathonos.backend.notifications.NotificationRepository notificationRepository;
    private final com.hackathonos.backend.members.RoomMemberRepository roomMemberRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public HomeService(
            RoomRepository roomRepository,
            RoomStageService stageService,
            ClockService clockService,
            WorkloadService workloadService,
            CheckpointService checkpointService,
            TeamService teamService,
            TaskRepository taskRepository,
            TaskDtoMapper taskDtoMapper,
            PlanPhaseRepository phaseRepository,
            BriefRepository briefRepository,
            IdeaRepository ideaRepository,
            UserRepository userRepository,
            Clock clock,
            com.hackathonos.backend.rooms.RoomTimeService roomTimeService,
            com.hackathonos.backend.rooms.NextStepService nextStepService,
            com.hackathonos.backend.notifications.NotificationRepository notificationRepository,
            com.hackathonos.backend.members.RoomMemberRepository roomMemberRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate
    ) {
        this.roomRepository = roomRepository;
        this.stageService = stageService;
        this.clockService = clockService;
        this.workloadService = workloadService;
        this.checkpointService = checkpointService;
        this.teamService = teamService;
        this.taskRepository = taskRepository;
        this.taskDtoMapper = taskDtoMapper;
        this.phaseRepository = phaseRepository;
        this.briefRepository = briefRepository;
        this.ideaRepository = ideaRepository;
        this.userRepository = userRepository;
        this.clock = clock;
        this.roomTimeService = roomTimeService;
        this.nextStepService = nextStepService;
        this.notificationRepository = notificationRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Resolves home screen data across user's active rooms with rich metrics for the selected room.
     */
    @Transactional
    public HomeResponseDto getHome(User user, UUID requestedRoomId) {
        if (user == null) {
            throw new com.hackathonos.backend.common.error.UnauthenticatedException("UNAUTHENTICATED", "Authentication required");
        }
        List<Room> rooms = roomRepository.findActiveRoomsByMemberUserId(user.getId());
        Instant now = clock.instant();

        String firstName = (user.getName() != null && !user.getName().isBlank())
                ? user.getName().trim().split("\\s+")[0]
                : "Builder";
        HomeUserDto userDto = new HomeUserDto(firstName, "Asia/Kolkata");
        com.hackathonos.backend.users.dto.UserSummaryDto userSummary = new com.hackathonos.backend.users.dto.UserSummaryDto(
                user.getId(), user.getName(), user.getAvatarUrl(), user.getLogin()
        );
        long unreadNotificationCount = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());

        if (rooms.isEmpty()) {
            PassportDto passport = buildPassport(user, now);
            HomeCountsDto counts = new HomeCountsDto(0, 0);
            return new HomeResponseDto(userDto, now, Collections.emptyList(), null, userSummary, unreadNotificationCount, List.of(), List.of(), "No active rooms", passport, null, counts);
        }

        Room selectedRoom = null;
        if (requestedRoomId != null) {
            for (Room r : rooms) {
                if (r.getId().equals(requestedRoomId)) {
                    selectedRoom = r;
                    break;
                }
            }
        }
        if (selectedRoom == null) {
            // Default to most recently updated room
            rooms.sort(Comparator.comparing(Room::getUpdatedAt).reversed());
            selectedRoom = rooms.get(0);
        }

        trackLastVisited(user, selectedRoom, now);

        List<HomeRoomCardDto> roomCards = new ArrayList<>();
        List<SelectedDeadlineRowDto> deadlinesAcrossRooms = new ArrayList<>();

        for (Room r : rooms) {
            boolean isSelected = r.getId().equals(selectedRoom.getId());
            boolean isBuild = "build".equalsIgnoreCase(r.getStage());

            String phaseLabel = "Planning";
            if (isBuild) {
                List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(r.getId());
                ClockService.ClockCalculation calc = clockService.calculate(r, phases);
                if (calc.currentPhase() != null && calc.currentPhase().name() != null) {
                    phaseLabel = calc.currentPhase().name();
                } else {
                    phaseLabel = "Build";
                }
            }

            JourneyDto journey = stageService.getJourney(r);
            int journeyDone = 0;
            if (journey != null && journey.steps() != null) {
                for (JourneyDto.JourneyStepDto s : journey.steps()) {
                    if ("done".equalsIgnoreCase(s.status())) journeyDone++;
                }
            }

            long myOpenTasks = taskRepository.countByRoomIdAndAssigneeIdAndStatusNot(r.getId(), user.getId(), "done");
            CheckpointDtos.CheckpointsResponseDto cps = checkpointService.getCheckpoints(r.getId(), user);

            NextDeadlineDto nextDeadline = null;
            if (cps != null && cps.items() != null) {
                for (CheckpointItemDto cp : cps.items()) {
                    if (!"passed".equalsIgnoreCase(cp.status()) && cp.dueAt() != null) {
                        nextDeadline = new NextDeadlineDto(cp.title(), cp.dueAt());
                        deadlinesAcrossRooms.add(new SelectedDeadlineRowDto(
                                r.getName() + ": " + cp.title(),
                                cp.helper(),
                                cp.tag(),
                                cp.dueAt(),
                                false
                        ));
                    }
                }
            }

            String templateName = r.getTemplateId() != null ? r.getTemplateId() : "Custom Event";
            NextStepDto cardNextStep = nextStepService.computeNextStep(r);

            roomCards.add(new HomeRoomCardDto(
                    r.getId(),
                    r.getName(),
                    templateName,
                    r.getStage(),
                    phaseLabel,
                    nextDeadline,
                    cps != null ? cps.passedCount() : 0,
                    cps != null ? cps.total() : 0,
                    journeyDone,
                    journey != null && journey.steps() != null ? journey.steps().size() : 4,
                    myOpenTasks,
                    isSelected,
                    roomTimeService.computeClock(r, now),
                    cardNextStep
            ));
        }

        deadlinesAcrossRooms.sort(Comparator.comparing(SelectedDeadlineRowDto::dueAt));
        if (deadlinesAcrossRooms.size() > 5) {
            deadlinesAcrossRooms = deadlinesAcrossRooms.subList(0, 5);
        }

        List<Task> allUserTasks = taskRepository.findByAssigneeId(user.getId());
        List<TaskDto> myOpenTasks = allUserTasks.stream()
                .filter(t -> !"done".equalsIgnoreCase(t.getStatus()))
                .sorted((a, b) -> {
                    boolean aInProg = "inprogress".equalsIgnoreCase(a.getStatus());
                    boolean bInProg = "inprogress".equalsIgnoreCase(b.getStatus());
                    if (aInProg != bInProg) return aInProg ? -1 : 1;
                    if (a.getDueAt() != null && b.getDueAt() != null) return a.getDueAt().compareTo(b.getDueAt());
                    if (a.getDueAt() != null) return -1;
                    if (b.getDueAt() != null) return 1;
                    return a.getPosition() - b.getPosition();
                })
                .limit(10)
                .map(taskDtoMapper::toSimpleDto)
                .toList();

        long totalOpen = allUserTasks.stream().filter(t -> !"done".equalsIgnoreCase(t.getStatus())).count();
        String teamPulse = rooms.size() + " active rooms · " + totalOpen + " open tasks assigned to you";

        SelectedRoomDto selectedDto = buildSelectedRoom(selectedRoom, user);
        ResumeRoomDto resume = buildResume(user, rooms);
        PassportDto passport = buildPassport(user, now);
        int liveRooms = (int) rooms.stream().filter(r -> {
            com.hackathonos.backend.rooms.dto.RoomClockDto c = roomTimeService.computeClock(r, now);
            return "RUNNING".equalsIgnoreCase(c.clockStatus()) || "FREEZE".equalsIgnoreCase(c.clockStatus());
        }).count();
        HomeCountsDto counts = new HomeCountsDto(rooms.size(), liveRooms);

        return new HomeResponseDto(
                userDto,
                now,
                roomCards,
                selectedDto,
                userSummary,
                unreadNotificationCount,
                myOpenTasks,
                deadlinesAcrossRooms,
                teamPulse,
                passport,
                resume,
                counts
        );
    }

    private SelectedRoomDto buildSelectedRoom(Room room, User user) {
        boolean isBuild = "build".equalsIgnoreCase(room.getStage());
        String variant = isBuild ? "build" : "planning";
        Instant now = clock.instant();

        List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(room.getId());
        ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);

        String headline = resolveHeadline(room, clockCalc);
        CheckpointDtos.CheckpointsResponseDto cps = checkpointService.getCheckpoints(room.getId(), user);

        List<SelectedDeadlineRowDto> deadlineRows = new ArrayList<>();
        if (cps != null && cps.items() != null) {
            for (CheckpointItemDto cp : cps.items()) {
                if (!"passed".equalsIgnoreCase(cp.status()) && cp.dueAt() != null) {
                    deadlineRows.add(new SelectedDeadlineRowDto(
                            cp.title(),
                            cp.helper(),
                            cp.tag(),
                            cp.dueAt(),
                            false
                    ));
                    if (deadlineRows.size() >= 3) break;
                }
            }
        }

        // My tasks: up to 4 not-done tasks assigned to me, ordered by in-progress first, then due date
        List<Task> allTasks = taskRepository.findByRoomId(room.getId());
        List<Task> myOpen = new ArrayList<>();
        for (Task t : allTasks) {
            if (user.getId().equals(t.getAssigneeId()) && !"done".equalsIgnoreCase(t.getStatus())) {
                myOpen.add(t);
            }
        }

        myOpen.sort((a, b) -> {
            boolean aInProg = "inprogress".equalsIgnoreCase(a.getStatus());
            boolean bInProg = "inprogress".equalsIgnoreCase(b.getStatus());
            if (aInProg != bInProg) return aInProg ? -1 : 1;
            if (a.getDueAt() != null && b.getDueAt() != null) {
                return a.getDueAt().compareTo(b.getDueAt());
            }
            if (a.getDueAt() != null) return -1;
            if (b.getDueAt() != null) return 1;
            return a.getPosition() - b.getPosition();
        });

        List<TaskDto> taskDtos = new ArrayList<>();
        for (int i = 0; i < Math.min(4, myOpen.size()); i++) {
            taskDtos.add(taskDtoMapper.toSimpleDto(myOpen.get(i)));
        }
        HomeMyTasksDto myTasksDto = new HomeMyTasksDto(taskDtos, myOpen.size());

        List<WorkloadService.MemberWorkloadDto> workload = workloadService.calculate(room, "phase").members();

        TeamDtos.TeamResponseDto teamResp = teamService.getTeam(room.getId(), user);
        List<OverviewMemberDto> overviewMembers = new ArrayList<>();
        if (teamResp != null && teamResp.members() != null) {
            for (TeamDtos.TeamMemberDto m : teamResp.members()) {
                CurrentTaskDto cur = m.currentTask() != null ? new CurrentTaskDto(m.currentTask().key(), m.currentTask().summary()) : null;
                overviewMembers.add(new OverviewMemberDto(m.userId(), m.name(), m.avatarUrl(), m.role(), m.status(), cur));
            }
        }
        OverviewTeamDto teamDto = new OverviewTeamDto(overviewMembers, teamResp != null ? teamResp.skillCoverage() : Collections.emptyList());

        HomePlanningDataDto planningData = null;
        ClockService.ClockStatusDto clockDto;
        List<ClockService.TimelineSegmentDto> timelineDto;

        if (!isBuild) {
            Instant targetAt = room.getEventStart() != null ? room.getEventStart() : now.plus(java.time.Duration.ofDays(7));
            long secondsLeft = Math.max(0, java.time.Duration.between(now, targetAt).getSeconds());
            long hoursLeft = secondsLeft / 3600;
            long minutesLeft = (secondsLeft % 3600) / 60;
            clockDto = new ClockService.ClockStatusDto(
                    "Event starts in",
                    targetAt,
                    hoursLeft,
                    minutesLeft,
                    "PLANNING",
                    targetAt,
                    0,
                    48
            );
            timelineDto = Collections.emptyList();

            JourneyDto journey = stageService.getJourney(room);
            String briefSummary = briefRepository.findByRoomId(room.getId()).map(Brief::getProblemStatement).orElse(null);
            long pending = ideaRepository.countByRoomIdAndStatus(room.getId(), "PENDING");
            long approved = ideaRepository.countByRoomIdAndStatus(room.getId(), "APPROVED");
            long rejected = ideaRepository.countByRoomIdAndStatus(room.getId(), "REJECTED");
            PlanningIdeasDto ideasDto = new PlanningIdeasDto(pending, approved, rejected, Collections.emptyList());
            planningData = new HomePlanningDataDto(journey, briefSummary, ideasDto);
        } else {
            clockDto = clockCalc.clockStatus();
            timelineDto = clockCalc.timeline();
        }

        return new SelectedRoomDto(
                room.getId(),
                room.getName(),
                variant,
                headline,
                clockDto,
                timelineDto,
                cps != null ? cps.next() : null,
                deadlineRows,
                myTasksDto,
                workload,
                teamDto,
                planningData,
                roomTimeService.computeClock(room, now)
        );
    }

    private String resolveHeadline(Room room, ClockService.ClockCalculation clockCalc) {
        if (!"build".equalsIgnoreCase(room.getStage())) {
            String s = room.getStage() != null ? room.getStage().toLowerCase() : "planning";
            return switch (s) {
                case "brief" -> "brief";
                case "ideate" -> "ideate";
                case "plan" -> "plan";
                default -> "planning";
            };
        }

        if (clockCalc.clockStatus() != null && "ENDED".equalsIgnoreCase(clockCalc.clockStatus().status())) {
            return "ended";
        }

        if (clockCalc.currentPhase() != null && clockCalc.currentPhase().name() != null) {
            String p = clockCalc.currentPhase().name().toLowerCase();
            if (p.contains("freeze")) return "freeze";
            if (p.contains("polish")) return "polish";
            if (p.contains("submit")) return "submit";
            if (p.contains("build")) return "build";
            if (p.contains("plan")) return "plan";
        }

        return "build";
    }

    private void trackLastVisited(User user, Room selectedRoom, Instant now) {
        if (selectedRoom == null || user == null) return;
        try {
            roomMemberRepository.findByRoomIdAndUserId(selectedRoom.getId(), user.getId()).ifPresent(m -> {
                if (m.getLastVisitedAt() == null || m.getLastVisitedAt().isBefore(now.minus(5, ChronoUnit.MINUTES))) {
                    m.setLastVisitedAt(now);
                    roomMemberRepository.save(m);
                }
            });
        } catch (Exception ignored) {}
    }

    private ResumeRoomDto buildResume(User user, List<Room> rooms) {
        if (rooms.isEmpty()) return null;
        List<com.hackathonos.backend.members.RoomMember> members = roomMemberRepository.findByUserId(user.getId());
        if (members.isEmpty()) {
            Room fallback = rooms.get(0);
            return new ResumeRoomDto(fallback.getId(), fallback.getName(), null, fallback.getTemplateId() != null ? fallback.getTemplateId() : "hackathon", nextStepService.computeNextStep(fallback), null);
        }
        List<com.hackathonos.backend.members.RoomMember> sorted = new ArrayList<>(members);
        sorted.sort((a, b) -> {
            Instant ta = a.getLastVisitedAt();
            Instant tb = b.getLastVisitedAt();
            if (ta != null && tb != null) return tb.compareTo(ta);
            if (ta != null) return -1;
            if (tb != null) return 1;
            Instant ja = a.getJoinedAt() != null ? a.getJoinedAt() : Instant.EPOCH;
            Instant jb = b.getJoinedAt() != null ? b.getJoinedAt() : Instant.EPOCH;
            return jb.compareTo(ja);
        });
        com.hackathonos.backend.members.RoomMember topMember = sorted.get(0);
        Room topRoom = rooms.stream().filter(r -> r.getId().equals(topMember.getRoomId())).findFirst()
                .orElseGet(() -> roomRepository.findById(topMember.getRoomId()).orElse(rooms.get(0)));
        NextStepDto nextStep = nextStepService.computeNextStep(topRoom);
        return new ResumeRoomDto(
                topRoom.getId(),
                topRoom.getName(),
                null,
                topRoom.getTemplateId() != null ? topRoom.getTemplateId() : "hackathon",
                nextStep,
                topMember.getLastVisitedAt()
        );
    }

    private PassportDto buildPassport(User user, Instant now) {
        long hackathonsCompleted = roomRepository.countSubmittedRoomsByUserId(user.getId());
        long tasksConfirmed = taskRepository.countByAssigneeIdAndConfirmedAtIsNotNull(user.getId());
        long ideasApproved = ideaRepository.countByAuthorIdAndStatus(user.getId(), "APPROVED");

        int floorIndex = 0;
        String exp = user.getExperienceLevel();
        if ("HIGH".equalsIgnoreCase(exp)) floorIndex = 3;
        else if ("MID".equalsIgnoreCase(exp)) floorIndex = 2;
        else if ("LOW".equalsIgnoreCase(exp)) floorIndex = 1;

        int earnedIndex = 0;
        if (hackathonsCompleted >= 10) earnedIndex = 3;
        else if (hackathonsCompleted >= 4) earnedIndex = 2;
        else if (hackathonsCompleted >= 1) earnedIndex = 1;

        int levelIndex = Math.max(floorIndex, earnedIndex);
        String levelName = switch (levelIndex) {
            case 3 -> "Legend";
            case 2 -> "Veteran";
            case 1 -> "Regular";
            default -> "Rookie";
        };

        Integer nextLevelIn = null;
        if (levelIndex == 0) {
            nextLevelIn = Math.max(1, (int) (1 - hackathonsCompleted));
        } else if (levelIndex == 1) {
            nextLevelIn = Math.max(1, (int) (4 - hackathonsCompleted));
        } else if (levelIndex == 2) {
            nextLevelIn = Math.max(1, (int) (10 - hackathonsCompleted));
        }

        LocalDate today = LocalDate.ofInstant(now, ZoneOffset.UTC);
        LocalDate sinceDate = today.minusDays(83);
        Instant sinceInstant = sinceDate.atStartOfDay().toInstant(ZoneOffset.UTC);

        Map<String, Integer> dayCounts = new HashMap<>();

        // Grouped query 1: confirmed tasks
        try {
            jdbcTemplate.query(
                    """
                    SELECT TO_CHAR(confirmed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt
                    FROM tasks
                    WHERE assignee_id = ? AND confirmed_at >= ?
                    GROUP BY TO_CHAR(confirmed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                    """,
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        dayCounts.put(day, dayCounts.getOrDefault(day, 0) + cnt);
                    },
                    user.getId(), java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        // Grouped query 2: approved ideas
        try {
            jdbcTemplate.query(
                    """
                    SELECT TO_CHAR(COALESCE(decided_at, created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt
                    FROM ideas
                    WHERE author_id = ? AND status = 'APPROVED' AND COALESCE(decided_at, created_at) >= ?
                    GROUP BY TO_CHAR(COALESCE(decided_at, created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                    """,
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        dayCounts.put(day, dayCounts.getOrDefault(day, 0) + cnt);
                    },
                    user.getId(), java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        // Grouped query 3: docs edited
        try {
            jdbcTemplate.query(
                    """
                    SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day_str, COUNT(*) AS cnt
                    FROM doc_versions
                    WHERE created_by = ? AND created_at >= ?
                    GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                    """,
                    rs -> {
                        String day = rs.getString("day_str");
                        int cnt = rs.getInt("cnt");
                        dayCounts.put(day, dayCounts.getOrDefault(day, 0) + cnt);
                    },
                    user.getId(), java.sql.Timestamp.from(sinceInstant)
            );
        } catch (Exception ignored) {}

        List<DailyActivityDto> activity = new ArrayList<>(84);
        for (int i = 83; i >= 0; i--) {
            String dateStr = today.minusDays(i).toString();
            activity.add(new DailyActivityDto(dateStr, dayCounts.getOrDefault(dateStr, 0)));
        }

        int streakDays = 0;
        LocalDate checkDay = today;
        if (dayCounts.getOrDefault(checkDay.toString(), 0) == 0) {
            checkDay = checkDay.minusDays(1);
        }
        while (dayCounts.getOrDefault(checkDay.toString(), 0) > 0) {
            streakDays++;
            checkDay = checkDay.minusDays(1);
        }

        return new PassportDto(
                levelName,
                nextLevelIn,
                hackathonsCompleted,
                tasksConfirmed,
                ideasApproved,
                streakDays,
                activity
        );
    }
}
