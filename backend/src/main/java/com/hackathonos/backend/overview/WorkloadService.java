package com.hackathonos.backend.overview;

import com.hackathonos.backend.members.MemberStatusCalculator;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
public class WorkloadService {

    public record MemberWorkloadDto(
            UUID userId,
            String name,
            String avatarUrl,
            String status,
            int done,
            int expected
    ) {}

    public record WorkloadResponseDto(
            List<MemberWorkloadDto> members
    ) {}

    private final RoomMemberRepository memberRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final PlanPhaseRepository phaseRepository;
    private final MemberStatusCalculator statusCalculator;
    private final ClockService clockService;
    private final Clock clock;

    public WorkloadService(
            RoomMemberRepository memberRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            PlanPhaseRepository phaseRepository,
            MemberStatusCalculator statusCalculator,
            ClockService clockService,
            Clock clock
    ) {
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.phaseRepository = phaseRepository;
        this.statusCalculator = statusCalculator;
        this.clockService = clockService;
        this.clock = clock;
    }

    /**
     * Calculates completed and expected task counts per member scoped to the current phase or overall sprint.
     */
    public WorkloadResponseDto calculate(Room room, String scope) {
        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        List<Task> allTasks = taskRepository.findByRoomId(room.getId());
        Instant now = clock.instant();

        UUID targetPhaseId = null;
        if ("phase".equalsIgnoreCase(scope)) {
            List<PlanPhase> phases = phaseRepository.findByRoomIdOrderByPositionAsc(room.getId());
            ClockService.ClockCalculation clockCalc = clockService.calculate(room, phases);
            if (clockCalc.currentPhase() != null) {
                targetPhaseId = clockCalc.currentPhase().id();
            }
        }

        Map<UUID, List<Task>> tasksByUser = new HashMap<>();
        for (Task t : allTasks) {
            if (t.getAssigneeId() != null) {
                tasksByUser.computeIfAbsent(t.getAssigneeId(), k -> new ArrayList<>()).add(t);
            }
        }

        Set<UUID> userIds = new HashSet<>();
        for (RoomMember m : members) {
            if (m.getUserId() != null) {
                userIds.add(m.getUserId());
            }
        }
        Map<UUID, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);
        }

        List<MemberWorkloadDto> result = new ArrayList<>();
        for (RoomMember m : members) {
            if (m.getUserId() == null) {
                continue;
            }
            User u = userMap.get(m.getUserId());
            String name = u != null && u.getName() != null ? u.getName() : "Member";
            String avatarUrl = u != null ? u.getAvatarUrl() : null;

            List<Task> userTasks = tasksByUser.getOrDefault(m.getUserId(), Collections.emptyList());
            MemberStatusCalculator.MemberStatusResult statusResult =
                    statusCalculator.calculate(m.getUserId(), m.getLastSeenAt(), userTasks);

            int done = 0;
            int expected = 0;

            for (Task t : userTasks) {
                if (targetPhaseId != null && !targetPhaseId.equals(t.getPhaseId())) {
                    continue;
                }
                boolean isDone = "DONE".equalsIgnoreCase(t.getStatus());
                if (isDone) done++;
                if (t.getDueAt() != null && !t.getDueAt().isAfter(now)) {
                    expected++;
                }
            }

            result.add(new MemberWorkloadDto(m.getUserId(), name, avatarUrl, statusResult.status(), done, expected));
        }

        return new WorkloadResponseDto(result);
    }
}
