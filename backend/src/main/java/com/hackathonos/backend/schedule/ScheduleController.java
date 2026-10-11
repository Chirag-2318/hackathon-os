package com.hackathonos.backend.schedule;

import com.hackathonos.backend.users.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller for sprint phases timeline, checkpoints, and custom schedule events.
 */
@RestController
@RequestMapping("/api/v1/rooms/{roomId}/schedule")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ScheduleDtos.ScheduleResponse getSchedule(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user
    ) {
        return scheduleService.getSchedule(roomId, user);
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleDtos.ScheduleEventDto createEvent(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user,
            @RequestBody ScheduleDtos.CreateEventRequest req
    ) {
        return scheduleService.createEvent(roomId, user, req);
    }

    @PatchMapping("/events/{id}")
    public ScheduleDtos.ScheduleEventDto updateEvent(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody ScheduleDtos.UpdateEventRequest req
    ) {
        return scheduleService.updateEvent(roomId, id, user, req);
    }

    @DeleteMapping("/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
            @PathVariable UUID roomId,
            @PathVariable UUID id,
            @AuthenticationPrincipal User user
    ) {
        scheduleService.deleteEvent(roomId, id, user);
    }
}
