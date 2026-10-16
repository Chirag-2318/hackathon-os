package com.hackathonos.backend.users;

import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.email.EmailOutboxRepository;
import com.hackathonos.backend.notifications.NotificationRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Enforces data retention policies configured in AppProperties:
 * - Notifications (default 90 days)
 * - Email log (default 90 days)
 * - Deleted rooms (default 30 days)
 */
@Service
public class DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);

    private final NotificationRepository notificationRepository;
    private final EmailOutboxRepository emailOutboxRepository;
    private final RoomRepository roomRepository;
    private final AppProperties appProperties;
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public DataRetentionService(NotificationRepository notificationRepository,
                                EmailOutboxRepository emailOutboxRepository,
                                RoomRepository roomRepository,
                                AppProperties appProperties,
                                com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService) {
        this.notificationRepository = notificationRepository;
        this.emailOutboxRepository = emailOutboxRepository;
        this.roomRepository = roomRepository;
        this.appProperties = appProperties;
        this.advisoryLockService = advisoryLockService;
    }

    public int getNotificationsRetentionDays() {
        return appProperties.getRetention().getNotificationsDays();
    }

    public int getEmailLogRetentionDays() {
        return appProperties.getRetention().getEmailLogDays();
    }

    public int getDeletedRoomsRetentionDays() {
        return appProperties.getRetention().getDeletedRoomsDays();
    }

    @Scheduled(cron = "0 0 3 * * ?")
    public void runRetentionCleanup() {
        advisoryLockService.tryLockAndRun(1001L, this::doRetentionCleanup);
    }

    @Transactional
    public void doRetentionCleanup() {
        Instant now = Instant.now();

        // 1. Notifications retention
        int notifDays = getNotificationsRetentionDays();
        Instant notifCutoff = now.minus(notifDays, ChronoUnit.DAYS);
        int deletedNotifs = notificationRepository.deleteOlderThan(notifCutoff);

        // 2. Email log retention
        int emailDays = getEmailLogRetentionDays();
        Instant emailCutoff = now.minus(emailDays, ChronoUnit.DAYS);
        int deletedEmails = emailOutboxRepository.deleteOlderThan(emailCutoff);

        // 3. Deleted rooms retention
        int roomDays = getDeletedRoomsRetentionDays();
        Instant roomCutoff = now.minus(roomDays, ChronoUnit.DAYS);
        List<Room> expiredRooms = roomRepository.findByDeletedAtBefore(roomCutoff);
        for (Room r : expiredRooms) {
            roomRepository.delete(r);
        }

        if (deletedNotifs > 0 || deletedEmails > 0 || !expiredRooms.isEmpty()) {
            log.info("Retention cleanup completed: {} notifications, {} emails, {} expired rooms purged",
                    deletedNotifs, deletedEmails, expiredRooms.size());
        }
    }
}
