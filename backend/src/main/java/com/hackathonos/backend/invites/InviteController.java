package com.hackathonos.backend.invites;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.invites.dto.*;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class InviteController {

    private final InviteService inviteService;
    private final RoomEmailInviteService roomEmailInviteService;
    private final CurrentUser currentUser;
    private final com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService;

    public InviteController(InviteService inviteService,
                            RoomEmailInviteService roomEmailInviteService,
                            CurrentUser currentUser,
                            com.hackathonos.backend.common.idempotency.IdempotencyService idempotencyService) {
        this.inviteService = inviteService;
        this.roomEmailInviteService = roomEmailInviteService;
        this.currentUser = currentUser;
        this.idempotencyService = idempotencyService;
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "create_invite", limit = 10, periodSeconds = 60)
    @PostMapping("/api/v1/rooms/{roomId}/invites")
    public InviteResponse createInviteLink(@PathVariable UUID roomId,
                                           @RequestBody(required = false) CreateInviteRequest request) {
        User user = currentUser.get();
        return inviteService.createInviteLink(user, roomId, request);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "email_invite", limit = 20, periodSeconds = 60)
    @PostMapping({"/rooms/{roomId}/invites/email", "/api/v1/rooms/{roomId}/invites/email"})
    public EmailInviteItemDto sendEmailInvite(@PathVariable UUID roomId,
                                              @Valid @RequestBody InviteEmailRequest request) {
        User user = currentUser.get();
        return roomEmailInviteService.sendEmailInvite(user, roomId, request);
    }

    @GetMapping({"/rooms/{roomId}/invites", "/api/v1/rooms/{roomId}/invites"})
    public List<EmailInviteItemDto> listRoomInvites(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return roomEmailInviteService.listRoomInvites(user, roomId);
    }

    @PostMapping({"/rooms/{roomId}/invites/{id}/resend", "/api/v1/rooms/{roomId}/invites/{id}/resend"})
    public EmailInviteItemDto resendInvite(@PathVariable UUID roomId, @PathVariable UUID id) {
        User user = currentUser.get();
        return roomEmailInviteService.resendInvite(user, roomId, id);
    }

    @DeleteMapping({"/rooms/{roomId}/invites/{id}", "/api/v1/rooms/{roomId}/invites/{id}"})
    public void revokeInvite(@PathVariable UUID roomId, @PathVariable UUID id) {
        User user = currentUser.get();
        roomEmailInviteService.revokeInvite(user, roomId, id);
    }

    @GetMapping("/api/v1/invites/preview")
    public TokenInvitePreviewDto previewInviteByToken(@RequestParam String token) {
        return roomEmailInviteService.previewInvite(token);
    }

    @PostMapping("/api/v1/invites/accept")
    public JoinInviteResponse acceptInvite(@Valid @RequestBody AcceptInviteRequest request) {
        User user = currentUser.get();
        return roomEmailInviteService.acceptInvite(user, request.token());
    }

    @GetMapping("/api/v1/invites/{token}")
    public InvitePreviewDto previewInvite(@PathVariable String token) {
        User callerOrNull = resolveOptionalUser();
        return inviteService.previewInvite(token, callerOrNull);
    }

    @PostMapping("/api/v1/invites/{token}/join")
    public JoinInviteResponse joinByInvite(@PathVariable String token) {
        User user = currentUser.get();
        return inviteService.joinByInvite(user, token);
    }

    @com.hackathonos.backend.common.security.RateLimited(key = "join_by_code", limit = 10, periodSeconds = 60)
    @PostMapping("/api/v1/rooms/join")
    public JoinInviteResponse joinByCode(
            @Valid @RequestBody JoinCodeRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        User user = currentUser.get();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var cached = idempotencyService.get(user.getId(), idempotencyKey);
            if (cached.isPresent() && cached.get() instanceof JoinInviteResponse dto) {
                return dto;
            }
        }
        JoinInviteResponse result = inviteService.joinByCode(user, request);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyService.put(user.getId(), idempotencyKey, result);
        }
        return result;
    }

    private User resolveOptionalUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        try {
            return currentUser.get();
        } catch (Exception e) {
            return null;
        }
    }
}
