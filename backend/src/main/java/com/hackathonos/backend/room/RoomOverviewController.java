package com.hackathonos.backend.room;

import com.hackathonos.backend.auth.CurrentUser;
import com.hackathonos.backend.auth.User;
import com.hackathonos.backend.auth.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Provides GET /api/v1/rooms/{roomId}/overview — the room command-center page data.
 * Returns minimal live data from the DB. The frontend's RoomOverviewPage renders
 * this data (clockStrip, kpis, teamMembers). Fields that require task tracking
 * are stubbed with sensible defaults until those features are built out.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/overview")
public class RoomOverviewController {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final RoomAuthorization roomAuthorization;

    public RoomOverviewController(RoomRepository roomRepository,
                                   RoomMemberRepository roomMemberRepository,
                                   UserRepository userRepository,
                                   CurrentUser currentUser,
                                   RoomAuthorization roomAuthorization) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
        this.roomAuthorization = roomAuthorization;
    }

    @GetMapping
    public Map<String, Object> getOverview(@AuthenticationPrincipal OAuth2User principal,
                                            @PathVariable Long roomId) {
        User user = currentUser.resolve(principal);
        roomAuthorization.requireMember(roomId, user.getId());

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalStateException("Room not found"));

        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        List<Map<String, Object>> teamMembers = members.stream()
                .map(m -> {
                    User u = userRepository.findById(m.getUserId()).orElseThrow();
                    return Map.<String, Object>of(
                            "id", u.getId(),
                            "name", u.getDisplayName(),
                            "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : "",
                            "role", m.getRole().name()
                    );
                })
                .collect(Collectors.toList());

        // Stub values for fields that depend on features not yet implemented
        Map<String, Object> kpis = Map.of(
                "checkpointsPassed", Map.of("value", "0", "label", "Checkpoints"),
                "tasksOpen",         Map.of("value", "0", "label", "Tasks open"),
                "blockedTasksCount", 0
        );
        Map<String, Object> clockStrip = Map.of(
                "nowPercent",    0,
                "freezeInText",  "–",
                "submitInText",  "–",
                "freezeCrossed", false,
                "lastHour",      false,
                "phaseSegments", List.of()
        );

        return Map.of(
                "roomId",      roomId,
                "roomName",    room.getName(),
                "teamMembers", teamMembers,
                "kpis",        kpis,
                "clockStrip",  clockStrip,
                "progressChart", List.of(),
                "heatmap",     List.of(),
                "myTasks",     List.of(),
                "decisionTimer", null
        );
    }
}
