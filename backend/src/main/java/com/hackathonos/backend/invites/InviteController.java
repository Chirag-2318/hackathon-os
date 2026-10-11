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
    private final CurrentUser currentUser;

    public InviteController(InviteService inviteService, CurrentUser currentUser) {
        this.inviteService = inviteService;
        this.currentUser = currentUser;
    }

    @PostMapping("/api/v1/rooms/{roomId}/invites")
    public InviteResponse createInviteLink(@PathVariable UUID roomId,
                                           @RequestBody(required = false) CreateInviteRequest request) {
        User user = currentUser.get();
        return inviteService.createInviteLink(user, roomId, request);
    }

    @GetMapping("/api/v1/rooms/{roomId}/invites")
    public List<InviteResponse> listActiveInvites(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return inviteService.listActiveInvites(user, roomId);
    }

    @DeleteMapping("/api/v1/rooms/{roomId}/invites/{inviteId}")
    public void revokeInvite(@PathVariable UUID roomId, @PathVariable UUID inviteId) {
        User user = currentUser.get();
        inviteService.revokeInvite(user, roomId, inviteId);
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

    @PostMapping("/api/v1/rooms/join")
    public JoinInviteResponse joinByCode(@Valid @RequestBody JoinCodeRequest request) {
        User user = currentUser.get();
        return inviteService.joinByCode(user, request);
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
