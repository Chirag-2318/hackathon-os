package com.hackathonos.backend.notifications;

import com.hackathonos.backend.common.dto.CursorPageResponse;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.notifications.dto.NotificationItemDto;
import com.hackathonos.backend.notifications.dto.UnreadCountDto;
import com.hackathonos.backend.users.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    public NotificationController(NotificationService notificationService, CurrentUser currentUser) {
        this.notificationService = notificationService;
        this.currentUser = currentUser;
    }

    @GetMapping("/api/v1/notifications")
    public CursorPageResponse<NotificationItemDto> listNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor) {
        User user = currentUser.get();
        return notificationService.listNotifications(user, unreadOnly, limit, cursor);
    }

    @GetMapping("/api/v1/notifications/unread-count")
    public UnreadCountDto getUnreadCount() {
        User user = currentUser.get();
        return notificationService.getUnreadCount(user);
    }

    @GetMapping("/api/v1/rooms/{roomId}/notifications")
    public List<NotificationItemDto> listRoomNotifications(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return notificationService.listRoomNotifications(user, roomId);
    }

    @PatchMapping("/api/v1/rooms/{roomId}/notifications/{notificationId}/read")
    public NotificationItemDto markRead(@PathVariable UUID roomId, @PathVariable UUID notificationId) {
        User user = currentUser.get();
        return notificationService.markRead(user, notificationId);
    }

    @PostMapping("/api/v1/rooms/{roomId}/notifications/mark-all-read")
    public void markAllReadForRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        notificationService.markAllReadForRoom(user, roomId);
    }

    @PostMapping("/api/v1/notifications/mark-all-read")
    public void markAllRead() {
        User user = currentUser.get();
        notificationService.markAllRead(user);
    }
}
