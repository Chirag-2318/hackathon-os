package com.hackathonos.backend.room;

import com.hackathonos.backend.auth.CurrentUser;
import com.hackathonos.backend.auth.User;
import com.hackathonos.backend.auth.UserRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Provides GET /api/v1/home — the home dashboard data.
 * Returns the user's rooms (joined as member) as hackathon cards.
 * WeekDays and upcoming events are stubbed until an Events model is built.
 */
@RestController
@RequestMapping("/api/v1/home")
public class HomeController {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final CurrentUser currentUser;

    public HomeController(RoomRepository roomRepository,
                           RoomMemberRepository roomMemberRepository,
                           CurrentUser currentUser) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Map<String, Object> home(@AuthenticationPrincipal OAuth2User principal) {
        User user = currentUser.resolve(principal);

        List<RoomMember> memberships = roomMemberRepository.findByUserId(user.getId());

        List<Map<String, Object>> rooms = memberships.stream()
                .map(m -> roomRepository.findById(m.getRoomId()).map(room -> {
                    String leaderName = room.getLeaderId() != null ? 
                            "Leader" : "Unknown"; // Simplification for now to avoid querying User DB
                    return Map.<String, Object>of(
                            "id",       room.getId().toString(),
                            "name",     room.getName(),
                            "eventTag", "Hackathon",
                            "participantAvatarIds", List.of(leaderName.substring(0, Math.min(2, leaderName.length())).toUpperCase()),
                            "progressPercent", 0,
                            "leaderName", leaderName,
                            "tasksLeft", 0
                    );
                }).orElse(null))
                .filter(h -> h != null)
                .collect(Collectors.toList());

        List<Map<String, Object>> roomList = memberships.stream()
                .map(m -> roomRepository.findById(m.getRoomId()).map(room -> {
                    String leaderName = room.getLeaderId() != null ? 
                            "Leader" : "Unknown";
                    return Map.<String, Object>of(
                            "id",       room.getId().toString(),
                            "status",   "active",
                            "title",    room.getName(),
                            "meta",     Map.of("name", leaderName, "avatarId", leaderName.substring(0, Math.min(2, leaderName.length())).toUpperCase(), "time", "just now"),
                            "progressPercent", 0,
                            "metaIconCounts", Map.of("tasks", 0, "attachments", 0, "comments", 0)
                    );
                }).orElse(null))
                .filter(h -> h != null)
                .collect(Collectors.toList());

        // Build 7 days of week strip (no events yet)
        List<Map<String, Object>> weekDays = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        for (int i = 0; i < 7; i++) {
            LocalDate day = today.plusDays(i - today.getDayOfWeek().getValue() % 7);
            weekDays.add(Map.of("date", day.format(fmt), "hasEvent", false));
        }

        return Map.of(
                "greeting",    "Ready to build?",
                "rooms",       rooms,
                "roomList",    roomList,
                "weekDays",    weekDays,
                "upcoming",    List.of()
        );
    }
}
