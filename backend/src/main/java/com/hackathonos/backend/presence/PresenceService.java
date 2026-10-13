package com.hackathonos.backend.presence;

import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lightweight in-memory presence tracking service with a 45-second TTL per member.
 */
@Service
public class PresenceService {

    private static final long PRESENCE_TTL_SECONDS = 45;

    // roomId -> (userId -> lastSeenInstant)
    private final Map<UUID, Map<UUID, Instant>> roomPresence = new ConcurrentHashMap<>();
    private final UserRepository userRepository;

    public PresenceService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void heartbeat(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return;
        roomPresence.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(userId, Instant.now());
    }

    public List<UserSummaryDto> getOnlineMembers(UUID roomId) {
        if (roomId == null) return Collections.emptyList();
        Map<UUID, Instant> map = roomPresence.get(roomId);
        if (map == null || map.isEmpty()) return Collections.emptyList();

        Instant cutoff = Instant.now().minusSeconds(PRESENCE_TTL_SECONDS);
        List<UUID> activeUserIds = new ArrayList<>();
        map.entrySet().removeIf(entry -> {
            if (entry.getValue().isBefore(cutoff)) {
                return true;
            }
            activeUserIds.add(entry.getKey());
            return false;
        });

        if (activeUserIds.isEmpty()) return Collections.emptyList();

        List<User> users = userRepository.findAllById(activeUserIds);
        return users.stream()
                .map(UserSummaryDto::from)
                .toList();
    }
}
