package com.hackathonos.backend.overview;

import com.hackathonos.backend.members.MemberStatusCalculator;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkloadServiceTest {

    @Mock
    private RoomMemberRepository memberRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PlanPhaseRepository phaseRepository;
    @Mock
    private MemberStatusCalculator statusCalculator;
    @Mock
    private ClockService clockService;

    @Test
    @DisplayName("Should aggregate done and expected tasks per room member")
    void testCalculateWorkload() {
        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        Clock clock = Clock.fixed(now, ZoneId.of("UTC"));

        WorkloadService service = new WorkloadService(
                memberRepository, taskRepository, userRepository,
                phaseRepository, statusCalculator, clockService, clock
        );

        UUID roomId = UUID.randomUUID();
        Room room = new Room();
        room.setId(roomId);

        UUID user1Id = UUID.randomUUID();
        UUID user2Id = UUID.randomUUID();

        RoomMember m1 = new RoomMember(roomId, user1Id, "LEADER");
        RoomMember m2 = new RoomMember(roomId, user2Id, "MEMBER");
        when(memberRepository.findByRoomId(roomId)).thenReturn(List.of(m1, m2));

        User u1 = new User("DEV", "alice@dev.com", "Alice", null, null, null);
        u1.setId(user1Id);
        User u2 = new User("DEV", "bob@dev.com", "Bob", null, null, null);
        u2.setId(user2Id);
        when(userRepository.findAllById(any())).thenReturn(List.of(u1, u2));

        // Alice: 1 task done (due past), 1 task in progress (due future)
        Task t1 = new Task(roomId, "K-1", 1, "Task 1", null, "DONE", user1Id, null, "HIGH", null, "Backend", 60, now.minus(Duration.ofHours(2)), 0, "MANUAL");
        Task t2 = new Task(roomId, "K-2", 2, "Task 2", null, "IN_PROGRESS", user1Id, null, "HIGH", null, "Backend", 60, now.plus(Duration.ofHours(2)), 1, "MANUAL");

        // Bob: 1 task in progress (due past -> expected!), 0 done
        Task t3 = new Task(roomId, "K-3", 3, "Task 3", null, "IN_PROGRESS", user2Id, null, "HIGH", null, "Frontend", 60, now.minus(Duration.ofHours(1)), 2, "MANUAL");

        when(taskRepository.findByRoomId(roomId)).thenReturn(List.of(t1, t2, t3));
        when(statusCalculator.calculate(eq(user1Id), any(), any()))
                .thenReturn(new MemberStatusCalculator.MemberStatusResult("working", null));
        when(statusCalculator.calculate(eq(user2Id), any(), any()))
                .thenReturn(new MemberStatusCalculator.MemberStatusResult("working", null));

        WorkloadService.WorkloadResponseDto response = service.calculate(room, "all");

        assertEquals(2, response.members().size());

        WorkloadService.MemberWorkloadDto alice = response.members().stream().filter(m -> m.userId().equals(user1Id)).findFirst().orElseThrow();
        assertEquals("Alice", alice.name());
        assertEquals(1, alice.done());
        assertEquals(1, alice.expected()); // t1 is due before now, t2 is due after

        WorkloadService.MemberWorkloadDto bob = response.members().stream().filter(m -> m.userId().equals(user2Id)).findFirst().orElseThrow();
        assertEquals("Bob", bob.name());
        assertEquals(0, bob.done());
        assertEquals(1, bob.expected()); // t3 is due before now
    }
}
