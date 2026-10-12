package com.hackathonos.backend.users.dto;

public record UsernameAvailableResponse(
        boolean available,
        String reason
) {
    public static UsernameAvailableResponse ok() {
        return new UsernameAvailableResponse(true, null);
    }

    public static UsernameAvailableResponse fail(String reason) {
        return new UsernameAvailableResponse(false, reason);
    }
}
