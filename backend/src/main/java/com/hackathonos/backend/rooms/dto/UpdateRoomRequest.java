package com.hackathonos.backend.rooms.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateRoomRequest(
        @Size(min = 3, max = 60, message = "Name must be between 3 and 60 characters")
        String name,

        @Size(max = 200, message = "Description must be 200 characters or fewer")
        String description,

        @Size(max = 500, message = "Project description must be 500 characters or fewer")
        String projectDescription,

        String eventStart,
        String timezone,

        @Min(value = 1, message = "Duration must be at least 1 hour")
        @Max(value = 168, message = "Duration cannot exceed 168 hours")
        Integer durationHours,

        String startsAt,
        String freezeAt,
        String endsAt,
        Boolean deadlineOverridden
) {}
