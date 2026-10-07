package com.hackathonos.backend.room;

import com.hackathonos.backend.auth.CurrentUser;
import com.hackathonos.backend.auth.User;
import com.hackathonos.backend.auth.UserRepository;
import com.hackathonos.backend.room.dto.RoomResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/invites")
public class InviteController {

    private final InviteRepository inviteRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public InviteController(InviteRepository inviteRepository, RoomRepository roomRepository,
                            RoomMemberRepository roomMemberRepository, UserRepository userRepository,
                            CurrentUser currentUser) {
        this.inviteRepository = inviteRepository;
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    @GetMapping("/{token}")
    public Map<String, Object> getInvite(@PathVariable String token) {
        Optional<Invite> inviteOpt = inviteRepository.findByToken(token);
        if (inviteOpt.isEmpty() || inviteOpt.get().getExpiresAt().isBefore(OffsetDateTime.now())) {
            return Map.of("status", "expired_or_invalid");
        }

        Invite invite = inviteOpt.get();
        Room room = roomRepository.findById(invite.getRoomId())
                .orElse(null);
        if (room == null) {
            return Map.of("status", "expired_or_invalid");
        }

        User leader = userRepository.findById(room.getLeaderId()).orElse(null);
        String leaderName = leader != null ? leader.getDisplayName() : "Leader";
        String leaderAvatar = leader != null ? leader.getAvatarUrl() : "";

        List<RoomMember> members = roomMemberRepository.findByRoomId(room.getId());
        List<Map<String, String>> memberList = members.stream()
                .map(m -> {
                    User u = userRepository.findById(m.getUserId()).orElse(null);
                    Map<String, String> map = new HashMap<>();
                    map.put("name", u != null ? u.getDisplayName() : "Member");
                    map.put("avatarUrl", u != null && u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
                    return map;
                })
                .collect(Collectors.toList());

        List<Map<String, String>> defaultRoles = List.of(
                Map.of("label", "Frontend", "color", "var(--pastel-violet)"),
                Map.of("label", "Backend", "color", "var(--pastel-sky)"),
                Map.of("label", "Design", "color", "var(--pastel-pink)"),
                Map.of("label", "AI/ML", "color", "var(--pastel-lime)")
        );

        Map<String, Object> roomData = new HashMap<>();
        roomData.put("name", room.getName());
        roomData.put("eventName", "Hackathon Room");
        roomData.put("leader", Map.of("name", leaderName, "avatarUrl", leaderAvatar));
        roomData.put("rolesNeeded", defaultRoles);
        roomData.put("members", memberList);
        roomData.put("joinableRoles", defaultRoles);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "valid");
        response.put("token", token);
        response.put("room", roomData);

        return response;
    }

    @PostMapping("/{token}/join")
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
}
