package com.hackathonos.backend.room.dto;

public record RoomMemberResponse(Long userId, String displayName, String avatarUrl, String role) {}
