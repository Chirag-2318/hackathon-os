package com.hackathonos.backend.room.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateRoomRequest(@NotBlank String name) {}
