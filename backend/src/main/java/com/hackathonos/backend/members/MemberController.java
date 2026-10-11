package com.hackathonos.backend.members;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.members.dto.*;
import com.hackathonos.backend.users.User;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class MemberController {

    private final MemberService memberService;
    private final CurrentUser currentUser;

    public MemberController(MemberService memberService, CurrentUser currentUser) {
        this.memberService = memberService;
        this.currentUser = currentUser;
    }

    @GetMapping("/members")
    public MemberListResponse listMembers(@PathVariable UUID roomId) {
        User user = currentUser.get();
        return memberService.listMembers(user, roomId);
    }

    @PatchMapping("/members/{userId}/role")
    public MemberItemDto updateRole(@PathVariable UUID roomId,
                                    @PathVariable UUID userId,
                                    @Valid @RequestBody UpdateRoleRequest request) {
        User user = currentUser.get();
        return memberService.updateRole(user, roomId, userId, request);
    }

    @PatchMapping("/members/{userId}/skills")
    public MemberItemDto updateSkills(@PathVariable UUID roomId,
                                      @PathVariable UUID userId,
                                      @RequestBody UpdateSkillsRequest request) {
        User user = currentUser.get();
        return memberService.updateSkills(user, roomId, userId, request);
    }

    @DeleteMapping("/members/{userId}")
    public void removeMember(@PathVariable UUID roomId, @PathVariable UUID userId) {
        User user = currentUser.get();
        memberService.removeMember(user, roomId, userId);
    }

    @PostMapping("/leave")
    public void leaveRoom(@PathVariable UUID roomId) {
        User user = currentUser.get();
        memberService.leaveRoom(user, roomId);
    }

    @PostMapping("/invitations")
    public MemberItemDto createInvitation(@PathVariable UUID roomId,
                                          @Valid @RequestBody CreateInvitationRequest request) {
        User user = currentUser.get();
        return memberService.createInvitation(user, roomId, request);
    }

    @DeleteMapping("/invitations/{id}")
    public void revokeInvitation(@PathVariable UUID roomId, @PathVariable UUID id) {
        User user = currentUser.get();
        memberService.revokeInvitation(user, roomId, id);
    }

    @PostMapping("/heartbeat")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void heartbeat(@PathVariable UUID roomId) {
        User user = currentUser.get();
        memberService.recordHeartbeat(user, roomId);
    }
}
