package com.hackathonos.backend.activity;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ActivityLogger {

    private final ActivityEventRepository activityRepository;

    public ActivityLogger(ActivityEventRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public void log(Room room, User actor, String type, String summary) {
        log(room, actor, type, summary, null);
    }

    public void log(Room room, User actor, String type, String summary, String data) {
        UUID actorId = actor != null ? actor.getId() : null;
        ActivityEvent event = new ActivityEvent(room.getId(), actorId, type, summary, data);
        activityRepository.save(event);
    }
}
