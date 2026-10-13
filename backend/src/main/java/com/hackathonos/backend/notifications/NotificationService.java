package com.hackathonos.backend.notifications;

import com.hackathonos.backend.common.dto.CursorPageResponse;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.dto.NotificationItemDto;
import com.hackathonos.backend.notifications.dto.UnreadCountDto;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.annotation.Scheduled;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserSettingsRepository settingsRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserSettingsRepository settingsRepository,
                               RoomMemberRepository memberRepository,
                               UserRepository userRepository,
                               RoomRepository roomRepository) {
        this.notificationRepository = notificationRepository;
        this.settingsRepository = settingsRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    /**
     * Sends an in-app notification to a single user if their settings permit it.
     * Records the event with room deep-link for quick navigation.
     */
    @Transactional
    public void notifyUser(User user, Room room, NotificationType type, String title, String body) {
        UUID roomId = room != null ? room.getId() : null;
        String linkPath = room != null ? "/app/room/" + room.getId() + "/overview" : "/app";
        notifyUser(user.getId(), roomId, type, title, body, linkPath);
    }

    /**
     * Sends an in-app notification with custom deep-link path if settings permit.
     */
    @Transactional
    public void notifyUser(UUID userId, UUID roomId, NotificationType type, String title, String body, String linkPath) {
        if (!shouldNotify(userId, type)) {
            return;
        }

        String targetLink = linkPath != null ? linkPath : "/app";

        // De-duplicate: collapse repeated notifications of the same type and entity within 10 minutes
        Optional<Notification> recent = notificationRepository
                .findTopByUserIdAndRoomIdAndTypeAndLinkPathAndCreatedAtAfterOrderByCreatedAtDesc(
                        userId, roomId, type.name(), targetLink, Instant.now().minusSeconds(600));

        if (recent.isPresent()) {
            Notification existing = recent.get();
            existing.setCount(existing.getCount() + 1);
            existing.setTitle(title);
            existing.setBody(body);
            existing.setCreatedAt(Instant.now());
            notificationRepository.save(existing);
            return;
        }

        Notification notification = new Notification(
                userId,
                roomId,
                type.name(),
                title,
                body,
                targetLink,
                null
        );
        notificationRepository.save(notification);
    }

    /**
     * Broadcasts a notification to all active room members except the initiating actor.
     * Used for collaborative events like members joining or role updates.
     */
    @Transactional
    public void notifyRoomMembers(Room room, User exceptUser, NotificationType type, String title, String body) {
        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        for (RoomMember member : members) {
            if (exceptUser != null && member.getUserId().equals(exceptUser.getId())) {
                continue;
            }
            userRepository.findById(member.getUserId()).ifPresent(user ->
                    notifyUser(user, room, type, title, body));
        }
    }

    /**
     * Retrieves cursor-paginated notifications for the current user.
     * Populates room names for group headers and computes next pagination cursor.
     */
    public CursorPageResponse<NotificationItemDto> listNotifications(User user, Boolean unreadOnly, Integer limit, String cursor) {
        int pageSize = (limit != null && limit > 0 && limit <= 100) ? limit : 20;
        PageRequest pageRequest = PageRequest.of(0, pageSize);
        Instant cursorInstant = (cursor != null && !cursor.isBlank()) ? Instant.parse(cursor) : null;

        List<Notification> items = fetchPage(user.getId(), unreadOnly != null && unreadOnly, cursorInstant, pageRequest);
        Map<UUID, String> roomNames = loadRoomNames(items);

        List<NotificationItemDto> dtos = new ArrayList<>();
        for (Notification n : items) {
            String roomName = n.getRoomId() != null ? roomNames.get(n.getRoomId()) : null;
            dtos.add(toDto(n, roomName));
        }

        String nextCursor = (items.size() == pageSize) ? items.get(items.size() - 1).getCreatedAt().toString() : null;
        return new CursorPageResponse<>(dtos, nextCursor);
    }

    /**
     * Returns notifications scoped to a single room for the current user.
     * Used by room-specific activity panels.
     */
    public List<NotificationItemDto> listRoomNotifications(User user, UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new com.hackathonos.backend.common.error.NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        if (room.getDeletedAt() != null || room.getArchivedAt() != null) {
            throw new com.hackathonos.backend.common.error.NotFoundException("ROOM_NOT_FOUND", "Room not found or has been archived");
        }
        if (!memberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new com.hackathonos.backend.common.error.ForbiddenException("NOT_A_MEMBER", "You are not a member of this room");
        }

        List<Notification> items = notificationRepository.findByUserIdAndRoomIdOrderByCreatedAtDesc(user.getId(), roomId);
        String roomName = room.getName();

        List<NotificationItemDto> dtos = new ArrayList<>();
        for (Notification n : items) {
            dtos.add(toDto(n, roomName));
        }
        return dtos;
    }

    /**
     * Returns count of unread notifications for display in header badge.
     */
    public UnreadCountDto getUnreadCount(User user) {
        long count = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());
        return new UnreadCountDto(count);
    }

    /**
     * Marks a single notification as read if owned by the caller.
     */
    @Transactional
    public NotificationItemDto markRead(User user, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("NOTIFICATION_NOT_FOUND", "Notification not found"));

        if (!notification.getUserId().equals(user.getId())) {
            throw new ForbiddenException("CANNOT_MODIFY_NOTIFICATION", "Cannot modify another user's notification");
        }

        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);

        String roomName = notification.getRoomId() != null
                ? roomRepository.findById(notification.getRoomId()).map(Room::getName).orElse(null)
                : null;
        return toDto(notification, roomName);
    }

    /**
     * Marks all notifications as read across all rooms for the user.
     */
    @Transactional
    public void markAllRead(User user) {
        notificationRepository.markAllReadForUser(user.getId(), Instant.now());
    }

    /**
     * Marks all notifications for a specific room as read for the user.
     */
    @Transactional
    public void markAllReadForRoom(User user, UUID roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new com.hackathonos.backend.common.error.NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        if (room.getDeletedAt() != null || room.getArchivedAt() != null) {
            throw new com.hackathonos.backend.common.error.NotFoundException("ROOM_NOT_FOUND", "Room not found or has been archived");
        }
        if (!memberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new com.hackathonos.backend.common.error.ForbiddenException("NOT_A_MEMBER", "You are not a member of this room");
        }
        notificationRepository.markAllReadForUserAndRoom(user.getId(), roomId, Instant.now());
    }

    private boolean shouldNotify(UUID userId, NotificationType type) {
        Optional<UserSettings> settingsOpt = settingsRepository.findById(userId);
        if (settingsOpt.isEmpty()) {
            return true;
        }
        UserSettings settings = settingsOpt.get();
        if (type == NotificationType.TASK_BLOCKED && !settings.isNotifyBlocked()) return false;
        if (type == NotificationType.DEADLINE_SOON && !settings.isNotifyDeadlines()) return false;
        if (type == NotificationType.MENTION && !settings.isNotifyMentions()) return false;
        return true;
    }

    private List<Notification> fetchPage(UUID userId, boolean unreadOnly, Instant cursor, PageRequest pageRequest) {
        if (cursor != null) {
            return unreadOnly
                    ? notificationRepository.findByUserIdAndReadAtIsNullAndCreatedAtLessThanOrderByCreatedAtDesc(userId, cursor, pageRequest)
                    : notificationRepository.findByUserIdAndCreatedAtLessThanOrderByCreatedAtDesc(userId, cursor, pageRequest);
        } else {
            return unreadOnly
                    ? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageRequest)
                    : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        }
    }

    private Map<UUID, String> loadRoomNames(List<Notification> items) {
        Set<UUID> roomIds = new HashSet<>();
        for (Notification n : items) {
            if (n.getRoomId() != null) roomIds.add(n.getRoomId());
        }
        if (roomIds.isEmpty()) return Collections.emptyMap();

        Map<UUID, String> map = new HashMap<>();
        List<Room> rooms = roomRepository.findAllById(roomIds);
        for (Room r : rooms) {
            map.put(r.getId(), r.getName());
        }
        return map;
    }

    @Scheduled(cron = "0 0 3 * * ?") // 3 AM daily cleanup
    @Transactional
    public void cleanupOldNotifications() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        notificationRepository.deleteOlderThan(cutoff);
    }

    public Map<String, List<NotificationItemDto>> listGroupedNotifications(User user) {
        List<Notification> items = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 60));
        Map<UUID, String> roomNames = loadRoomNames(items);
        Map<String, List<NotificationItemDto>> grouped = new LinkedHashMap<>();
        for (Notification n : items) {
            String roomName = n.getRoomId() != null ? roomNames.getOrDefault(n.getRoomId(), "General") : "General";
            grouped.computeIfAbsent(roomName, k -> new ArrayList<>()).add(toDto(n, roomName));
        }
        return grouped;
    }

    private NotificationItemDto toDto(Notification n, String roomName) {
        String path = n.getLinkPath() != null ? n.getLinkPath() : "/app";
        return new NotificationItemDto(
                n.getId(),
                n.getRoomId(),
                roomName,
                n.getType(),
                n.getTitle(),
                n.getBody(),
                n.getBody(),
                path,
                path,
                path,
                n.getCount(),
                n.getReadAt() != null,
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}

