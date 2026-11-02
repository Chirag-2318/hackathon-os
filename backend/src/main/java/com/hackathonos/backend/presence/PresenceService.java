package com.hackathonos.backend.presence;

import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Database-backed presence tracking service.
 * Heartbeat every 60s, online = seen within 90s.
 * Ensures consistent presence across application restarts and horizontal instances.
 */
@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);
    public static final long PRESENCE_ONLINE_WINDOW_SECONDS = 90L;

    private final RoomPresenceRepository presenceRepository;
    private final UserRepository userRepository;

    public PresenceService(RoomPresenceRepository presenceRepository, UserRepository userRepository) {
        this.presenceRepository = presenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void heartbeat(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return;
        try {
            presenceRepository.upsertHeartbeat(roomId, userId, Instant.now());
        } catch (Exception e) {
            log.warn("Failed to record room presence heartbeat: roomId={}, userId={}, error={}", roomId, userId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Set<UUID> getOnlineUserIds(UUID roomId) {
        if (roomId == null) return Collections.emptySet();
        Instant cutoff = Instant.now().minusSeconds(PRESENCE_ONLINE_WINDOW_SECONDS);
        return new HashSet<>(presenceRepository.findActiveUserIds(roomId, cutoff));
    }

    @Transactional(readOnly = true)
    public boolean isUserOnline(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return false;
        Instant cutoff = Instant.now().minusSeconds(PRESENCE_ONLINE_WINDOW_SECONDS);
        return presenceRepository.isUserOnline(roomId, userId, cutoff);
    }

    @Transactional(readOnly = true)
    public boolean isUserOnlineAnywhere(UUID userId) {
        if (userId == null) return false;
        Instant cutoff = Instant.now().minusSeconds(PRESENCE_ONLINE_WINDOW_SECONDS);
        return presenceRepository.isUserOnlineAnywhere(userId, cutoff);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getOnlineMembers(UUID roomId) {
        if (roomId == null) return Collections.emptyList();
        Instant cutoff = Instant.now().minusSeconds(PRESENCE_ONLINE_WINDOW_SECONDS);
        List<UUID> activeIds = presenceRepository.findActiveUserIds(roomId, cutoff);
        if (activeIds.isEmpty()) return Collections.emptyList();

        List<User> users = userRepository.findAllById(activeIds);
        return users.stream()
                .map(UserSummaryDto::from)
                .toList();
    }

    @Transactional
    public int pruneExpiredPresence() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        return presenceRepository.pruneOlderThan(cutoff);
    }
}
