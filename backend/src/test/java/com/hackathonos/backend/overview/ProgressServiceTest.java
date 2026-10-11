package com.hackathonos.backend.overview;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private final Instant baseStart = Instant.parse("2026-10-10T08:00:00Z");
    private final Instant baseEnd = baseStart.plus(Duration.ofHours(48));

    private Room createTestRoom() {
        Room r = new Room();
        r.setId(UUID.randomUUID());
        r.setEventStart(baseStart);
        r.setEventEnd(baseEnd);
        return r;
    }

    @Test
    @DisplayName("Should return hasData = false when no tasks exist")
    void testEmptyTasks() {
        Clock clock = Clock.fixed(baseStart.plus(Duration.ofHours(10)), ZoneId.of("UTC"));
        ProgressService service = new ProgressService(taskRepository, clock);
        Room room = createTestRoom();

        when(taskRepository.findByRoomId(room.getId())).thenReturn(Collections.emptyList());

        ProgressService.ProgressResultDto result = service.calculate(room);
        assertFalse(result.hasData());
        assertTrue(result.planned().isEmpty());
        assertTrue(result.actual().isEmpty());
        assertEquals(0, result.deltaPct());
    }

    @Test
    @DisplayName("Should generate planned and actual hourly progress points with deltaPct")
    void testProgressCalculation() {
        Instant now = baseStart.plus(Duration.ofHours(20));
        Clock clock = Clock.fixed(now, ZoneId.of("UTC"));
        ProgressService service = new ProgressService(taskRepository, clock);
        Room room = createTestRoom();

        // Task 1: 60m estimate, due at hour 10, done at hour 8
        Task t1 = new Task(room.getId(), "TST-1", 1, "Task 1", null, "DONE", null, null, "MEDIUM", null, "Frontend", 60, baseStart.plus(Duration.ofHours(10)), 0, "MANUAL");
        t1.setCompletedAt(baseStart.plus(Duration.ofHours(8)));

        // Task 2: 60m estimate, due at hour 15, still in TODO
        Task t2 = new Task(room.getId(), "TST-2", 2, "Task 2", null, "TODO", null, null, "MEDIUM", null, "Backend", 60, baseStart.plus(Duration.ofHours(15)), 1, "MANUAL");

        // Task 3: 60m estimate, due at hour 30, still in TODO
        Task t3 = new Task(room.getId(), "TST-3", 3, "Task 3", null, "TODO", null, null, "MEDIUM", null, "Infra", 60, baseStart.plus(Duration.ofHours(30)), 2, "MANUAL");

        when(taskRepository.findByRoomId(room.getId())).thenReturn(List.of(t1, t2, t3));

        ProgressService.ProgressResultDto result = service.calculate(room);

        assertTrue(result.hasData());
        assertFalse(result.planned().isEmpty());
        assertFalse(result.actual().isEmpty());

        // Total weight is 180 (60 * 3)
        // Actual done weight at now: Task 1 = 60 -> actualPct = round(60/180 * 100) = 33%
        // Planned weight at now (due <= hour 20): Task 1 (due 10) + Task 2 (due 15) = 120 -> plannedPct = round(120/180 * 100) = 67%
        // deltaPct = 33 - 67 = -34%
        assertEquals(33, result.actualPct());
        assertEquals(67, result.plannedPct());
        assertEquals(-34, result.deltaPct());
    }
}
