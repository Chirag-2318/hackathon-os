package com.hackathonos.backend.tasks.dto;

public record UpdateAcceptanceRequest(
        String text,
        Boolean done
) {}
