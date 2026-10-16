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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class DeadlineReminderJob {

    private final RoomRepository roomRepository;
    private final TaskRepository taskRepository;
    private final RoomCheckpointRepository checkpointRepository;
    private final RoomMemberRepository memberRepository;
    private final ReminderLogRepository reminderLogRepository;
    private final NotificationService notificationService;
    private final Clock clock;
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public DeadlineReminderJob(
            RoomRepository roomRepository,
            TaskRepository taskRepository,
            RoomCheckpointRepository checkpointRepository,
            RoomMemberRepository memberRepository,
            ReminderLogRepository reminderLogRepository,
            NotificationService notificationService,
            Clock clock,
            com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService
    ) {
        this.roomRepository = roomRepository;
        this.taskRepository = taskRepository;
        this.checkpointRepository = checkpointRepository;
        this.memberRepository = memberRepository;
        this.reminderLogRepository = reminderLogRepository;
        this.notificationService = notificationService;
        this.clock = clock;
        this.advisoryLockService = advisoryLockService;
    }

    /**
     * Executes deadline reminder evaluations every 5 minutes.
     * Guarded by database advisory lock across cluster.
     */
    @Scheduled(fixedRate = 300000)
    public void scheduledRun() {
        advisoryLockService.tryLockAndRun(1005L, this::runReminders);
    }

    @Transactional
    public int runReminders() {
        int sentCount = 0;
        Instant now = clock.instant();
        Instant window = now.plus(Duration.ofMinutes(60));

        List<Room> allRooms = roomRepository.findAll();
        for (Room room : allRooms) {
            if (!"build".equalsIgnoreCase(room.getStage())) {
                continue;
            }

            // 1. Task deadlines
            List<Task> openTasks = taskRepository.findByRoomIdAndStatusNot(room.getId(), "DONE");
            for (Task t : openTasks) {
                if (t.isDropped()) continue;
                if (t.getDueAt() != null && t.getDueAt().isAfter(now) && !t.getDueAt().isAfter(window)) {
                    if (t.getAssigneeId() != null) {
                        UUID userId = t.getAssigneeId();
                        if (!reminderLogRepository.existsByKindAndRefIdAndUserId("TASK_DUE", t.getId(), userId)) {
                            long mins = Math.max(1, Duration.between(now, t.getDueAt()).toMinutes());
                            String title = t.getTaskKey() + " is due in " + mins + " minutes";
                            String link = "/app/room/" + room.getId() + "/board?task=" + t.getTaskKey();

                            notificationService.notifyUser(userId, room.getId(), NotificationType.DEADLINE_SOON, title, title, link);
                            reminderLogRepository.save(new ReminderLog("TASK_DUE", t.getId(), userId));
                            sentCount++;
                        }
                    }
                }
            }

            // 2. Checkpoint deadlines
            List<RoomCheckpoint> checkpoints = checkpointRepository.findByRoomIdOrderByPositionAsc(room.getId());
            for (RoomCheckpoint cp : checkpoints) {
                if (cp.getPassedAt() == null && cp.getDueAt() != null && cp.getDueAt().isAfter(now) && !cp.getDueAt().isAfter(window)) {
                    List<RoomMember> members = memberRepository.findByRoomId(room.getId());
                    for (RoomMember m : members) {
                        UUID userId = m.getUserId();
                        if (!reminderLogRepository.existsByKindAndRefIdAndUserId("CHECKPOINT_DUE", cp.getId(), userId)) {
                            long mins = Math.max(1, Duration.between(now, cp.getDueAt()).toMinutes());
                            String title = cp.getTitle() + " is due in " + mins + " minutes";
                            String link = "/app/room/" + room.getId() + "/overview";

                            notificationService.notifyUser(userId, room.getId(), NotificationType.DEADLINE_SOON, title, title, link);
                            reminderLogRepository.save(new ReminderLog("CHECKPOINT_DUE", cp.getId(), userId));
                            sentCount++;
                        }
                    }
                }
            }
        }

        return sentCount;
    }
}
