package com.hackathonos.backend.tasks.dto;

public record UpdateSubtaskRequest(
        String text,
        Boolean done
) {}
