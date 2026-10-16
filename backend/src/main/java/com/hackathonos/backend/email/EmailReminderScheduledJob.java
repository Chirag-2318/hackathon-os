package com.hackathonos.backend.email;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class EmailReminderScheduledJob {

    private static final Logger log = LoggerFactory.getLogger(EmailReminderScheduledJob.class);
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter IST_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a").withZone(IST_ZONE);

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final MailService mailService;
    private final EmailOutboxRepository outboxRepository;
    private final UnsubscribeTokenService unsubscribeTokenService;
    private final AppProperties appProperties;
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public EmailReminderScheduledJob(RoomRepository roomRepository,
                                     RoomMemberRepository memberRepository,
                                     UserRepository userRepository,
                                     TaskRepository taskRepository,
                                     MailService mailService,
                                     EmailOutboxRepository outboxRepository,
                                     UnsubscribeTokenService unsubscribeTokenService,
                                     AppProperties appProperties,
                                     com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.mailService = mailService;
        this.outboxRepository = outboxRepository;
        this.unsubscribeTokenService = unsubscribeTokenService;
        this.appProperties = appProperties;
        this.advisoryLockService = advisoryLockService;
    }

    @Scheduled(fixedRate = 300000)
    public void runReminders() {
        advisoryLockService.tryLockAndRun(1008L, this::doRunReminders);
    }

    public void doRunReminders() {
        Instant now = Instant.now();
        List<Room> rooms = roomRepository.findAll();

        for (Room room : rooms) {
            if (room.getDeletedAt() != null || room.getArchivedAt() != null || room.getSubmittedAt() != null) {
                continue;
            }

            Instant startsAt = room.getStartsAt();
            Instant endsAt = room.getEndsAt();
            Instant freezeAt = room.getFreezeAt();

            if (startsAt == null || endsAt == null) {
                continue;
            }

            // Check clockStatus: LIVE or FROZEN only (not UPCOMING, not ENDED, not SUBMITTED)
            if (now.isBefore(startsAt) || !now.isBefore(endsAt)) {
                continue;
            }

            // Evaluate kinds
            checkAndTriggerKind(room, "FREEZE_24H", freezeAt, Duration.ofHours(24), now);
            checkAndTriggerKind(room, "FREEZE_3H", freezeAt, Duration.ofHours(3), now);
            checkAndTriggerKind(room, "SUBMIT_3H", endsAt, Duration.ofHours(3), now);
        }
    }

    private void checkAndTriggerKind(Room room, String kind, Instant targetInstant, Duration beforeDuration, Instant now) {
        if (targetInstant == null) {
            return;
        }

        Instant triggerThreshold = targetInstant.minus(beforeDuration);
        // Moment must have arrived (now >= triggerThreshold) and not passed by more than 30 minutes
        if (!now.isAfter(triggerThreshold)) {
            return;
        }

        long minutesPast = Duration.between(triggerThreshold, now).toMinutes();
        if (minutesPast > 30) {
            return;
        }

        // Target deadline still in future
        Duration remaining = Duration.between(now, targetInstant);
        if (remaining.isNegative()) {
            return;
        }

        long seconds = remaining.getSeconds();
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        String countdown = String.format("%02d:%02d:%02d", Math.max(0, h), Math.max(0, m), Math.max(0, s));
        String asOfTime = IST_FORMATTER.format(now) + " IST";

        long totalDurationMs = Duration.between(room.getStartsAt(), room.getEndsAt()).toMillis();
        long elapsedMs = Duration.between(room.getStartsAt(), now).toMillis();
        int elapsedPercent = totalDurationMs > 0 ? (int) Math.min(100, Math.max(0, (elapsedMs * 100) / totalDurationMs)) : 0;

        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        List<Task> roomTasks = taskRepository.findByRoomId(room.getId());

        for (RoomMember member : members) {
            UUID userId = member.getUserId();
            String dedupeKey = "reminder:" + room.getId() + ":" + kind + ":" + userId;

            if (outboxRepository.existsByDedupeKey(dedupeKey)) {
                continue;
            }

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                continue;
            }

            User user = userOpt.get();
            if (!user.isEmailReminders() || user.getEmail() == null || user.getEmail().isBlank()) {
                continue;
            }

            int openTasks = (int) roomTasks.stream()
                    .filter(t -> userId.equals(t.getAssigneeId()) && !"DONE".equalsIgnoreCase(t.getStatus()))
                    .count();

            boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole())
                    || (room.getOwnerId() != null && room.getOwnerId().equals(userId));

            Integer confirmTasks = isLeader ? (int) roomTasks.stream()
                    .filter(t -> "AWAITING".equalsIgnoreCase(t.getReviewState()))
                    .count() : null;

            String nextStep = resolveNextStep(room);
            String boardUrl = appProperties.getPublicUrl() + "/room/" + room.getId();
            String token = unsubscribeTokenService.generateToken(userId);
            String unsubscribeUrl = appProperties.getPublicUrl() + "/api/v1/email/unsubscribe?token=" + token;

            Map<String, Object> vars = new HashMap<>();
            vars.put("kind", kind);
            vars.put("roomName", room.getName());
            vars.put("countdown", countdown);
            vars.put("asOfTime", asOfTime);
            vars.put("elapsedPercent", elapsedPercent);
            vars.put("openTasksCount", openTasks);
            vars.put("confirmTasksCount", confirmTasks);
            vars.put("nextStep", nextStep);
            vars.put("boardUrl", boardUrl);
            vars.put("unsubscribeUrl", unsubscribeUrl);

            mailService.enqueue("reminder", user.getEmail(), vars, dedupeKey);
            log.info("Triggered {} email reminder for user {} in room {}", kind, user.getEmail(), room.getName());
        }
    }

    private String resolveNextStep(Room room) {
        if (!room.isBriefDone()) {
            return "Extract event brief requirements and success criteria.";
        }
        if (!room.isIdeateDone()) {
            return "Complete idea voting and lock candidate solutions.";
        }
        if (!room.isPlanDone()) {
            return "Finalize PRD cut list and architecture phases.";
        }
        return "Complete open build tasks and prepare final demo rehearsal.";
    }
}
