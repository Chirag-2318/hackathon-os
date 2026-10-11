package com.hackathonos.backend.overview;

import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.rooms.Room;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ClockServiceTest {

    private final Instant baseStart = Instant.parse("2026-10-10T08:00:00Z");
    private final Instant baseEnd = baseStart.plus(Duration.ofHours(48));

    private Room createTestRoom() {
        Room r = new Room();
        r.setId(UUID.randomUUID());
        r.setName("Sprint 2026");
        r.setEventStart(baseStart);
        r.setEventEnd(baseEnd);
        return r;
    }

    private List<PlanPhase> createTestPhases(UUID roomId) {
        PlanPhase p1 = new PlanPhase(roomId, "phase-1", 0, "Phase 1: Setup", BigDecimal.valueOf(0), BigDecimal.valueOf(25), "Setup complete", "blue");
        PlanPhase p2 = new PlanPhase(roomId, "phase-2", 1, "Phase 2: Core Build", BigDecimal.valueOf(25), BigDecimal.valueOf(70), "Core flow works", "green");
        PlanPhase p3 = new PlanPhase(roomId, "phase-3", 2, "Phase 3: Polish", BigDecimal.valueOf(70), BigDecimal.valueOf(100), "Demo ready", "purple");
        return List.of(p1, p2, p3);
    }

    @Test
    @DisplayName("Should return NOT_STARTED when now is before event start")
    void testBeforeStart() {
        Instant before = baseStart.minus(Duration.ofHours(2));
        Clock clock = Clock.fixed(before, ZoneId.of("UTC"));
        ClockService service = new ClockService(clock);

        Room room = createTestRoom();
        List<PlanPhase> phases = createTestPhases(room.getId());

        ClockService.ClockCalculation calc = service.calculate(room, phases);

        assertEquals("NOT_STARTED", calc.clockStatus().status());
        assertEquals(0.0, calc.elapsedPct());
        assertEquals(1, calc.clockStatus().hourOfEvent());
        assertEquals(48, calc.clockStatus().totalHours());
        assertEquals("upcoming", calc.timeline().get(0).state());
    }

    @Test
    @DisplayName("Should return ON_TRACK and identify current phase midway")
    void testMidway() {
        Instant midway = baseStart.plus(Duration.ofHours(24)); // 50%
        Clock clock = Clock.fixed(midway, ZoneId.of("UTC"));
        ClockService service = new ClockService(clock);

        Room room = createTestRoom();
        List<PlanPhase> phases = createTestPhases(room.getId());

        ClockService.ClockCalculation calc = service.calculate(room, phases);

        assertEquals("ON_TRACK", calc.clockStatus().status());
        assertEquals(50.0, calc.elapsedPct(), 0.01);
        assertEquals(25, calc.clockStatus().hourOfEvent());
        assertEquals(24, calc.clockStatus().hoursLeft());

        assertNotNull(calc.currentPhase());
        assertEquals("Phase 2: Core Build", calc.currentPhase().name());
        assertEquals("done", calc.timeline().get(0).state());
        assertEquals("current", calc.timeline().get(1).state());
        assertEquals("upcoming", calc.timeline().get(2).state());
    }

    @Test
    @DisplayName("Should return DUE_SOON and FINAL_STRETCH as event nears deadline")
    void testDueSoonAndFinalStretch() {
        // 40 hours in -> 8h left -> 8/48 = 16.6% left -> DUE_SOON (<= 25% and >= 10%)
        Instant hour40 = baseStart.plus(Duration.ofHours(40));
        Clock clock1 = Clock.fixed(hour40, ZoneId.of("UTC"));
        ClockService service1 = new ClockService(clock1);

        Room room = createTestRoom();
        List<PlanPhase> phases = createTestPhases(room.getId());

        ClockService.ClockCalculation calc1 = service1.calculate(room, phases);
        assertEquals("DUE_SOON", calc1.clockStatus().status());

        // 45 hours in -> 3h left -> 3/48 = 6.25% left -> FINAL_STRETCH (< 10%)
        Instant hour45 = baseStart.plus(Duration.ofHours(45));
        Clock clock2 = Clock.fixed(hour45, ZoneId.of("UTC"));
        ClockService service2 = new ClockService(clock2);

        ClockService.ClockCalculation calc2 = service2.calculate(room, phases);
        assertEquals("FINAL_STRETCH", calc2.clockStatus().status());
    }

    @Test
    @DisplayName("Should return ENDED when event is past deadline")
    void testEnded() {
        Instant past = baseEnd.plus(Duration.ofHours(1));
        Clock clock = Clock.fixed(past, ZoneId.of("UTC"));
        ClockService service = new ClockService(clock);

        Room room = createTestRoom();
        List<PlanPhase> phases = createTestPhases(room.getId());

        ClockService.ClockCalculation calc = service.calculate(room, phases);

        assertEquals("ENDED", calc.clockStatus().status());
        assertEquals(100.0, calc.elapsedPct());
        assertEquals(0, calc.clockStatus().hoursLeft());
        assertTrue(calc.timeline().stream().allMatch(t -> "done".equals(t.state())));
    }
}
