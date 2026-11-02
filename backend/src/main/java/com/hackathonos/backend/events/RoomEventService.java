package com.hackathonos.backend.events;

import com.hackathonos.backend.events.dto.RoomEventDto;
import com.hackathonos.backend.events.dto.RoomEventDto.FeedResponse;
import com.hackathonos.backend.events.dto.RoomEventDto.LatestEventResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service managing room change feeds and persisting mutation events to the database.
 * Broadcasts events through the unified RoomEventHub.
 */
@Service
public class RoomEventService {

    private final RoomEventRepository eventRepository;
    private final RoomEventHub eventHub;

    public RoomEventService(RoomEventRepository eventRepository, @Lazy RoomEventHub eventHub) {
        this.eventRepository = eventRepository;
        this.eventHub = eventHub;
    }

    /**
     * Records a room mutation event in the database and broadcasts to connected SSE subscribers.
     */
    @Transactional
    public RoomEvent recordEvent(UUID roomId, String type, String entityType, String entityId, UUID actorUserId) {
        RoomEvent event = new RoomEvent(roomId, type, entityType, entityId, actorUserId);
        RoomEvent saved = eventRepository.save(event);
        String topic = mapTypeToTopic(type);
        eventHub.publish(roomId, new RoomEventHub.RoomEvent(
                saved.getId(),
                topic,
                roomId,
                actorUserId,
                "Member",
                entityId,
                saved.getCreatedAt()
        ));
        return saved;
    }

    /**
     * Retrieves events newer than lastEventId up to the specified limit.
     */
    @Transactional(readOnly = true)
    public FeedResponse getEvents(UUID roomId, Long after, Integer limit) {
        long afterId = after != null ? after : 0L;
        int pageSize = (limit != null && limit > 0 && limit <= 100) ? limit : 50;

        List<RoomEvent> events = eventRepository.findEventsAfter(roomId, afterId, PageRequest.of(0, pageSize + 1));
        boolean hasMore = events.size() > pageSize;
        if (hasMore) {
            events = events.subList(0, pageSize);
        }

        List<RoomEventDto> dtos = events.stream()
                .map(e -> new RoomEventDto(e.getId(), e.getType(), e.getEntityType(), e.getEntityId(), e.getActorUserId(), e.getCreatedAt()))
                .toList();

        long latestId = eventRepository.findLatestEventId(roomId).orElse(afterId);
        return new FeedResponse(dtos, latestId, hasMore);
    }

    /**
     * Fast, lightweight endpoint returning only the highest event ID in the room for polling.
     */
    @Transactional(readOnly = true)
    public LatestEventResponse getLatestEventId(UUID roomId) {
        long latestId = eventRepository.findLatestEventId(roomId).orElse(0L);
        return new LatestEventResponse(latestId);
    }

    private String mapTypeToTopic(String type) {
        if (type == null) return "room";
        String lower = type.toLowerCase();
        if (lower.startsWith("task")) return "board";
        if (lower.startsWith("idea")) return "ideas";
        if (lower.startsWith("doc")) return "docs";
        if (lower.startsWith("checkpoint")) return "checkpoints";
        if (lower.startsWith("member")) return "members";
        if (lower.startsWith("phase")) return "stage";
        if (lower.startsWith("submission") || lower.startsWith("reopened")) return "submission";
        if (lower.startsWith("demo")) return "demo";
        if (lower.startsWith("pitch")) return "pitch";
        return "room";
    }
}
