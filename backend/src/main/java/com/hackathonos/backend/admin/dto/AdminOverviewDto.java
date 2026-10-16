package com.hackathonos.backend.admin.dto;

public record AdminOverviewDto(
        long users,
        int cap,
        Integer spotsLeft,
        long signups24h,
        long waitlistCount,
        long rooms,
        long roomsActive24h,
        long members,
        long emailsSentToday,
        long emailsFailed24h,
        long outboxPending,
        long usersWithAiKey,
        long aiCallsToday,
        long aiFailures24h,
        long clientErrors24h,
        String databaseSize,
        boolean signupsOpen
) {}
