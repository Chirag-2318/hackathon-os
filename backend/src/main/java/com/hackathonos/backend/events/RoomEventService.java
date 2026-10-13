package com.hackathonos.backend.events;

import com.hackathonos.backend.events.dto.RoomEventDto;
import com.hackathonos.backend.events.dto.RoomEventDto.FeedResponse;
import com.hackathonos.backend.events.dto.RoomEventDto.LatestEventResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Service managing room change feeds and Server-Sent Events.
 */
@Service
public class RoomEventService {

    private final RoomEventRepository eventRepository;
    private final RoomSseBroadcaster sseBroadcaster;

    public RoomEventService(RoomEventRepository eventRepository, RoomSseBroadcaster sseBroadcaster) {
        this.eventRepository = eventRepository;
        this.sseBroadcaster = sseBroadcaster;
    }

    /**
     * Records a room mutation event in the database and broadcasts to connected SSE subscribers.
     * Must be called within the same transactional boundary as the mutation.
     */
    @Transactional
    public RoomEvent recordEvent(UUID roomId, String type, String entityType, String entityId, UUID actorUserId) {
        RoomEvent event = new RoomEvent(roomId, type, entityType, entityId, actorUserId);
        RoomEvent saved = eventRepository.save(event);
        sseBroadcaster.broadcast(saved);
        return saved;
    }

    /**
     * Subscribes to live Server-Sent Events for a room with optional Last-Event-ID replay.
     */
    public SseEmitter subscribe(UUID roomId, UUID userId, Long lastEventId) {
        SseEmitter emitter = sseBroadcaster.subscribe(roomId, userId);

        // If client provided Last-Event-ID on reconnect, replay missed events
        if (lastEventId != null && lastEventId > 0) {
            List<RoomEvent> missed = eventRepository.findEventsAfter(roomId, lastEventId, PageRequest.of(0, 50));
            for (RoomEvent ev : missed) {
                try {
                    emitter.send(SseEmitter.event()
                            .id(String.valueOf(ev.getId()))
                            .name("room-event")
                            .data(new RoomEventDto.SsePayload(
                                    ev.getId(), ev.getType(), ev.getEntityType(), ev.getEntityId(), ev.getActorUserId()
                            )));
                } catch (IOException ignored) {
                    break;
                }
            }
        }

        return emitter;
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
}
