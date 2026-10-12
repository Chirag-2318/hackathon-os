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
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
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
            Clock clock
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
    }

    /**
     * Resolves home screen data across user's active rooms with rich metrics for the selected room.
     */
    @Transactional(readOnly = true)
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

        if (rooms.isEmpty()) {
            return new HomeResponseDto(userDto, now, Collections.emptyList(), null);
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

        List<HomeRoomCardDto> roomCards = new ArrayList<>();
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
                        break;
                    }
                }
            }

            String templateName = r.getTemplateId() != null ? r.getTemplateId() : "Custom Event";
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
                    isSelected
            ));
        }

        SelectedRoomDto selectedDto = buildSelectedRoom(selectedRoom, user);
        return new HomeResponseDto(userDto, now, roomCards, selectedDto);
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
                planningData
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
}
