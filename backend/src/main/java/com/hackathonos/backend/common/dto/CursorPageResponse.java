package com.hackathonos.backend.common.dto;

import java.util.List;

public record CursorPageResponse<T>(List<T> items, String nextCursor) {}
