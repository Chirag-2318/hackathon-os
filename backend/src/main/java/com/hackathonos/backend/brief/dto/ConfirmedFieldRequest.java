package com.hackathonos.backend.brief.dto;

public record ConfirmedFieldRequest(
        String fieldName,
        boolean confirmed
) {}
