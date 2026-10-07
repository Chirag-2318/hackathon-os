package com.hackathonos.backend.room;

import com.hackathonos.backend.auth.CurrentUser;
import com.hackathonos.backend.auth.User;
import com.hackathonos.backend.auth.UserRepository;
import com.hackathonos.backend.room.dto.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final InviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final RoomAuthorization roomAuthorization;

    public RoomController(RoomRepository roomRepository, RoomMemberRepository roomMemberRepository,
                           InviteRepository inviteRepository, UserRepository userRepository,
                           CurrentUser currentUser, RoomAuthorization roomAuthorization) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
        this.roomAuthorization = roomAuthorization;
    }

    @PostMapping
    public RoomResponse createRoom(@AuthenticationPrincipal OAuth2User principal,
                                    @Valid @RequestBody CreateRoomRequest request) {
        User user = currentUser.resolve(principal);
        Room room = roomRepository.save(new Room(request.name(), user.getId()));
        roomMemberRepository.save(new RoomMember(room.getId(), user.getId(), RoomRole.LEADER));
        return new RoomResponse(room.getId(), room.getName(), room.getLeaderId(), RoomRole.LEADER.name());
    }

    private static final String[] ADJECTIVES = {"Rapid", "Bold", "Swift", "Bright", "Clever", "Nimble", "Sharp", "Keen"};
    private static final String[] NOUNS = {"Hackers", "Builders", "Makers", "Coders", "Pioneers", "Devs", "Crew", "Squad"};

    @GetMapping("/suggest-name")
    public java.util.Map<String, String> suggestName() {
        var rng = ThreadLocalRandom.current();
        String suggestion = ADJECTIVES[rng.nextInt(ADJECTIVES.length)]
                + " " + NOUNS[rng.nextInt(NOUNS.length)]
                + " " + rng.nextInt(100, 999);
        return java.util.Map.of("suggestion", suggestion);
    }

    @GetMapping("/{roomId}")
    public RoomResponse getRoom(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long roomId) {
        User user = currentUser.resolve(principal);
        RoomMember membership = roomAuthorization.requireMember(roomId, user.getId());
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalStateException("Room not found"));
        return new RoomResponse(room.getId(), room.getName(), room.getLeaderId(), membership.getRole().name());
    }

    @PostMapping("/{roomId}/invites")
    public InviteResponse createInvite(@AuthenticationPrincipal OAuth2User principal, @PathVariable Long roomId) {
        User user = currentUser.resolve(principal);
        roomAuthorization.requireRole(roomId, user.getId(), RoomRole.LEADER, RoomRole.CAPTAIN);

        String token = UUID.randomUUID().toString().replace("-", "");
        Invite invite = inviteRepository.save(
                new Invite(roomId, token, OffsetDateTime.now().plusDays(7)));
        return new InviteResponse(invite.getToken(), "/invite/" + invite.getToken());
    }

    @PostMapping("/invites/{token}/join")
    public RoomResponse joinRoom(@AuthenticationPrincipal OAuth2User principal, @PathVariable String token) {
        User user = currentUser.resolve(principal);
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite link."));

        if (invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("This invite link has expired.");
        }

        roomMemberRepository.findByRoomIdAndUserId(invite.getRoomId(), user.getId())
                .orElseGet(() -> roomMemberRepository.save(
                        new RoomMember(invite.getRoomId(), user.getId(), RoomRole.MEMBER)));

        Room room = roomRepository.findById(invite.getRoomId())
                .orElseThrow(() -> new IllegalStateException("Room not found"));
        RoomMember membership = roomMemberRepository
                .findByRoomIdAndUserId(invite.getRoomId(), user.getId()).orElseThrow();
        return new RoomResponse(room.getId(), room.getName(), room.getLeaderId(), membership.getRole().name());
    }

    @GetMapping("/{roomId}/members")
    public List<RoomMemberResponse> listMembers(@AuthenticationPrincipal OAuth2User principal,
                                                 @PathVariable Long roomId) {
        User user = currentUser.resolve(principal);
        roomAuthorization.requireMember(roomId, user.getId());

        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(m -> {
                    User u = userRepository.findById(m.getUserId()).orElseThrow();
                    return new RoomMemberResponse(u.getId(), u.getDisplayName(), u.getAvatarUrl(), m.getRole().name());
                })
                .collect(Collectors.toList());
    }

    @PatchMapping("/{roomId}/members/{userId}/role")
    public RoomMemberResponse changeRole(@AuthenticationPrincipal OAuth2User principal,
                                          @PathVariable Long roomId, @PathVariable Long userId,
                                          @RequestBody Object rawRole) {
        User actingUser = currentUser.resolve(principal);
        roomAuthorization.requireRole(roomId, actingUser.getId(), RoomRole.LEADER);

        RoomRole newRole;
        if (rawRole instanceof java.util.Map<?, ?> map && map.containsKey("role")) {
            newRole = RoomRole.valueOf(map.get("role").toString());
        } else {
            newRole = RoomRole.valueOf(rawRole.toString().replace("\"", "").trim());
        }

        RoomMember target = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("That user is not a member of this room."));
        target.setRole(newRole);
        roomMemberRepository.save(target);

        User u = userRepository.findById(userId).orElseThrow();
        return new RoomMemberResponse(u.getId(), u.getDisplayName(), u.getAvatarUrl(), target.getRole().name());
    }
}
