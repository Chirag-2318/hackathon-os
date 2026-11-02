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
    public org.springframework.http.ResponseEntity<CursorPageResponse<NotificationItemDto>> listNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor) {
        User user = currentUser.get();
        int safeLimit = (limit != null && limit > 0) ? Math.min(limit, 500) : 50;
        CursorPageResponse<NotificationItemDto> res = notificationService.listNotifications(user, unreadOnly, safeLimit, cursor);
        var response = org.springframework.http.ResponseEntity.ok();
        if (res.nextCursor() != null) {
            response.header("X-Truncated", "true");
        }
        return response.body(res);
    }

    @GetMapping("/api/v1/notifications/unread-count")
    public UnreadCountDto getUnreadCount() {
        User user = currentUser.get();
        return notificationService.getUnreadCount(user);
    }

    @GetMapping("/api/v1/rooms/{roomId}/notifications")
    public org.springframework.http.ResponseEntity<List<NotificationItemDto>> listRoomNotifications(
            @PathVariable UUID roomId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page) {
        User user = currentUser.get();
        List<NotificationItemDto> all = notificationService.listRoomNotifications(user, roomId);
        int total = all.size();
        int safeLimit = (limit != null && limit > 0) ? Math.min(limit, 500) : 50;
        int pageNum = (page != null && page >= 0) ? page : 0;
        int fromIndex = Math.min(pageNum * safeLimit, total);
        int toIndex = Math.min(fromIndex + safeLimit, total);
        List<NotificationItemDto> pageItems = all.subList(fromIndex, toIndex);

        var response = org.springframework.http.ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total));
        if (total > safeLimit || toIndex < total) {
            response.header("X-Truncated", "true");
        }
        return response.body(pageItems);
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

    @GetMapping("/api/v1/notifications/grouped")
    public java.util.Map<String, List<NotificationItemDto>> getGroupedNotifications() {
        User user = currentUser.get();
        return notificationService.listGroupedNotifications(user);
    }

    @PatchMapping("/api/v1/notifications/{notificationId}/read")
    public NotificationItemDto markReadGlobal(@PathVariable UUID notificationId) {
        User user = currentUser.get();
        return notificationService.markRead(user, notificationId);
    }
}

