package com.hackathonos.backend.activity;

import com.hackathonos.backend.activity.dto.ActivityItemDto;
import com.hackathonos.backend.activity.dto.ActorDto;
import com.hackathonos.backend.common.dto.CursorPageResponse;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ActivityService {

    private final ActivityEventRepository activityRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;

    public ActivityService(ActivityEventRepository activityRepository,
                           UserRepository userRepository,
                           RoomAccess roomAccess) {
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
    }

    /**
     * Lists cursor-paginated activity events for a room.
     * Ensures caller is a room member and attaches actor details.
     */
    public CursorPageResponse<ActivityItemDto> listRoomActivity(User user, UUID roomId, Integer limit, String cursor) {
        roomAccess.requireMember(roomId, user);

        int pageSize = (limit != null && limit > 0 && limit <= 100) ? limit : 20;
        PageRequest pageRequest = PageRequest.of(0, pageSize);
        Instant cursorInstant = (cursor != null && !cursor.isBlank()) ? Instant.parse(cursor) : null;

        List<ActivityEvent> events = (cursorInstant != null)
                ? activityRepository.findByRoomIdAndCreatedAtLessThanOrderByCreatedAtDesc(roomId, cursorInstant, pageRequest)
                : activityRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageRequest);

        Map<UUID, User> actors = loadActors(events);
        List<ActivityItemDto> dtos = new ArrayList<>();
        for (ActivityEvent e : events) {
            User actorUser = e.getActorId() != null ? actors.get(e.getActorId()) : null;
            ActorDto actorDto = toActorDto(actorUser);
            dtos.add(new ActivityItemDto(e.getId(), actorDto, e.getType(), e.getSummary(), e.getCreatedAt()));
        }

        String nextCursor = (events.size() == pageSize)
                ? events.get(events.size() - 1).getCreatedAt().toString()
                : null;
        return new CursorPageResponse<>(dtos, nextCursor);
    }

    private Map<UUID, User> loadActors(List<ActivityEvent> events) {
        Set<UUID> actorIds = new HashSet<>();
        for (ActivityEvent e : events) {
            if (e.getActorId() != null) actorIds.add(e.getActorId());
        }
        if (actorIds.isEmpty()) return Collections.emptyMap();

        Map<UUID, User> map = new HashMap<>();
        List<User> users = userRepository.findAllById(actorIds);
        for (User u : users) {
            map.put(u.getId(), u);
        }
        return map;
    }

    private ActorDto toActorDto(User actor) {
        if (actor == null) {
            return new ActorDto(null, "System", "SYS", null);
        }
        String initials = computeInitials(actor.getName());
        return new ActorDto(actor.getId(), actor.getName(), initials, actor.getAvatarUrl());
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "?";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        String first = parts[0].substring(0, 1).toUpperCase();
        String last = parts[parts.length - 1].substring(0, 1).toUpperCase();
        return first + last;
    }
}
