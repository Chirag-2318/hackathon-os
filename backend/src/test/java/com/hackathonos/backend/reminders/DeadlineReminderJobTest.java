package com.hackathonos.backend.reminders;

import com.hackathonos.backend.checkpoints.RoomCheckpoint;
import com.hackathonos.backend.checkpoints.RoomCheckpointRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeadlineReminderJobTest {

    @Mock private RoomRepository roomRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private RoomCheckpointRepository checkpointRepository;
    @Mock private RoomMemberRepository memberRepository;
    @Mock private ReminderLogRepository reminderLogRepository;
    @Mock private NotificationService notificationService;

    @Test
    @DisplayName("Should send notifications for tasks and checkpoints due within the 60 minute window")
    void testReminderWithin60Minutes() {
        Instant now = Instant.parse("2026-10-10T14:00:00Z");
        Clock clock = Clock.fixed(now, ZoneId.of("UTC"));

        DeadlineReminderJob job = new DeadlineReminderJob(
                roomRepository, taskRepository, checkpointRepository, memberRepository,
                reminderLogRepository, notificationService, clock
        );

        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Room room = new Room();
        room.setId(roomId);
        room.setStage("build");
        when(roomRepository.findAll()).thenReturn(List.of(room));

        // Task 1: Due in 30 minutes (within 60m window!) -> Should trigger reminder
        Task taskDueSoon = new Task(roomId, "TSK-1", 1, "Ship feature", null, "IN_PROGRESS", userId, null, "HIGH", null, "Backend", 60, now.plus(Duration.ofMinutes(30)), 0, "MANUAL");

        // Task 2: Due in 120 minutes (outside window) -> Should NOT trigger
        Task taskDueLater = new Task(roomId, "TSK-2", 2, "Future task", null, "TODO", userId, null, "LOW", null, "Frontend", 60, now.plus(Duration.ofMinutes(120)), 1, "MANUAL");

        when(taskRepository.findByRoomIdAndStatusNot(roomId, "DONE")).thenReturn(List.of(taskDueSoon, taskDueLater));
        when(reminderLogRepository.existsByKindAndRefIdAndUserId(eq("TASK_DUE"), eq(taskDueSoon.getId()), eq(userId))).thenReturn(false);

        // Checkpoint 1: Due in 45 minutes -> Should trigger reminder for room members
        RoomCheckpoint cp = new RoomCheckpoint(roomId, 3, "FEATURE_FREEZE", "Freeze", "desc", null, now.plus(Duration.ofMinutes(45)), null, null);
        when(checkpointRepository.findByRoomIdOrderByPositionAsc(roomId)).thenReturn(List.of(cp));

        RoomMember member = new RoomMember(roomId, userId, "MEMBER");
        when(memberRepository.findByRoomId(roomId)).thenReturn(List.of(member));
        when(reminderLogRepository.existsByKindAndRefIdAndUserId(eq("CHECKPOINT_DUE"), eq(cp.getId()), eq(userId))).thenReturn(false);

        int sent = job.runReminders();

        assertEquals(2, sent, "Should have triggered 1 task reminder and 1 checkpoint reminder");

        verify(notificationService).notifyUser(
                eq(userId), eq(roomId), eq(NotificationType.DEADLINE_SOON),
                contains("TSK-1 is due in 30 minutes"), any(), any()
        );

        verify(notificationService).notifyUser(
                eq(userId), eq(roomId), eq(NotificationType.DEADLINE_SOON),
                contains("Freeze is due in 45 minutes"), any(), any()
        );

        verify(reminderLogRepository, times(2)).save(any(ReminderLog.class));
    }

    @Test
    @DisplayName("Should not send duplicate reminder if reminder was already logged")
    void testNoDuplicateReminders() {
        Instant now = Instant.parse("2026-10-10T14:00:00Z");
        Clock clock = Clock.fixed(now, ZoneId.of("UTC"));

        DeadlineReminderJob job = new DeadlineReminderJob(
                roomRepository, taskRepository, checkpointRepository, memberRepository,
                reminderLogRepository, notificationService, clock
        );

        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Room room = new Room();
        room.setId(roomId);
        room.setStage("build");
        when(roomRepository.findAll()).thenReturn(List.of(room));

        Task taskDueSoon = new Task(roomId, "TSK-1", 1, "Ship feature", null, "IN_PROGRESS", userId, null, "HIGH", null, "Backend", 60, now.plus(Duration.ofMinutes(20)), 0, "MANUAL");
        when(taskRepository.findByRoomIdAndStatusNot(roomId, "DONE")).thenReturn(List.of(taskDueSoon));

        // Already logged!
        when(reminderLogRepository.existsByKindAndRefIdAndUserId(eq("TASK_DUE"), eq(taskDueSoon.getId()), eq(userId))).thenReturn(true);
        when(checkpointRepository.findByRoomIdOrderByPositionAsc(roomId)).thenReturn(Collections.emptyList());

        int sent = job.runReminders();

        assertEquals(0, sent, "No duplicate reminder should be sent");
        verify(notificationService, never()).notifyUser(any(), any(), any(), any(), any(), any());
    }
}
