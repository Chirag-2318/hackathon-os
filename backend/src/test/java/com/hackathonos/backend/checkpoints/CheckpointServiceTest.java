package com.hackathonos.backend.checkpoints;

import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.mvp.MvpState;
import com.hackathonos.backend.mvp.MvpStateRepository;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.pitch.PitchRehearsalRepository;
import com.hackathonos.backend.submission.SubmissionRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckpointServiceTest {

    @Mock
    private RoomCheckpointRepository checkpointRepository;
    @Mock
    private PlanPhaseRepository phaseRepository;
    @Mock
    private MvpStateRepository mvpStateRepository;
    @Mock
    private PitchRehearsalRepository pitchRehearsalRepository;
    @Mock
    private DemoMediaRepository demoMediaRepository;
    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private RoomAccess roomAccess;

    private final Instant baseStart = Instant.parse("2026-10-10T08:00:00Z");

    @Test
    @DisplayName("Should seed standard 7 hackathon checkpoints when initializing room")
    void testCreateForRoom() {
        Clock clock = Clock.fixed(baseStart, ZoneId.of("UTC"));
        CheckpointService service = new CheckpointService(
                checkpointRepository, phaseRepository, mvpStateRepository,
                pitchRehearsalRepository, demoMediaRepository, submissionRepository,
                roomAccess, clock
        );

        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setEventStart(baseStart);
        room.setEventEnd(baseStart.plus(Duration.ofHours(48)));

        when(checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId())).thenReturn(Collections.emptyList());
        when(phaseRepository.findByRoomIdOrderByPositionAsc(room.getId())).thenReturn(Collections.emptyList());

        service.createForRoom(room);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RoomCheckpoint>> captor = ArgumentCaptor.forClass(List.class);
        verify(checkpointRepository).saveAll(captor.capture());

        List<RoomCheckpoint> seeded = captor.getValue();
        assertEquals(7, seeded.size());
        assertEquals("RULES_CONFIRMED", seeded.get(0).getRuleKey());
        assertEquals("IDEA_LOCKED", seeded.get(1).getRuleKey());
        assertEquals("CORE_FLOW_RUNS", seeded.get(2).getRuleKey());
        assertEquals("FEATURE_FREEZE", seeded.get(3).getRuleKey());
        assertEquals("DEMO_REHEARSED", seeded.get(4).getRuleKey());
        assertEquals("VIDEO_RECORDED", seeded.get(5).getRuleKey());
        assertEquals("SUBMISSION_VERIFIED", seeded.get(6).getRuleKey());
    }

    @Test
    @DisplayName("Should auto-pass checkpoints matching stage completion and MVP health")
    void testAutoEvaluation() {
        Clock clock = Clock.fixed(baseStart.plus(Duration.ofHours(10)), ZoneId.of("UTC"));
        CheckpointService service = new CheckpointService(
                checkpointRepository, phaseRepository, mvpStateRepository,
                pitchRehearsalRepository, demoMediaRepository, submissionRepository,
                roomAccess, clock
        );

        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setBriefDone(true);
        room.setIdeateDone(true);

        RoomCheckpoint cp1 = new RoomCheckpoint(room.getId(), 0, "RULES_CONFIRMED", "Rules", "desc", null, null, null, null);
        RoomCheckpoint cp2 = new RoomCheckpoint(room.getId(), 1, "IDEA_LOCKED", "Idea", "desc", null, null, null, null);
        RoomCheckpoint cp3 = new RoomCheckpoint(room.getId(), 2, "CORE_FLOW_RUNS", "Core flow", "desc", null, null, null, null);

        when(checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId())).thenReturn(List.of(cp1, cp2, cp3));
        MvpState mvp = new MvpState(room.getId(), "pitch", "flow");
        mvp.setHealthRuns(true);
        when(mvpStateRepository.findById(room.getId())).thenReturn(Optional.of(mvp));

        service.evaluate(room);

        // All 3 conditions met -> all 3 should have passedAt set
        assertNotNull(cp1.getPassedAt(), "RULES_CONFIRMED should auto-pass when brief is done");
        assertNotNull(cp2.getPassedAt(), "IDEA_LOCKED should auto-pass when ideate is done");
        assertNotNull(cp3.getPassedAt(), "CORE_FLOW_RUNS should auto-pass when MVP health runs");
    }

    @Test
    @DisplayName("Should allow manual passing of a checkpoint and record pass notes")
    void testManualPass() {
        Clock clock = Clock.fixed(baseStart, ZoneId.of("UTC"));
        CheckpointService service = new CheckpointService(
                checkpointRepository, phaseRepository, mvpStateRepository,
                pitchRehearsalRepository, demoMediaRepository, submissionRepository,
                roomAccess, clock
        );

        UUID roomId = UUID.randomUUID();
        UUID cpId = UUID.randomUUID();
        User user = new User("DEV", "tester@dev.com", "Tester", null, null, null);
        user.setId(UUID.randomUUID());

        RoomCheckpoint cp = new RoomCheckpoint(roomId, 5, "VIDEO_RECORDED", "Video recorded", "desc", null, null, null, null);
        cp.setId(cpId);

        when(checkpointRepository.findById(cpId)).thenReturn(Optional.of(cp));

        service.passCheckpoint(roomId, user, cpId, new com.hackathonos.backend.checkpoints.dto.CheckpointDtos.PassCheckpointRequest(true));

        assertNotNull(cp.getPassedAt());
        verify(checkpointRepository).save(cp);
    }
}
