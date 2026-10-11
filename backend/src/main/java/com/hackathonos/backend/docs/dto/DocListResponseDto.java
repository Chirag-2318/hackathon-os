package com.hackathonos.backend.docs.dto;

import java.util.List;

public record DocListResponseDto(
        List<DocItemDto> items
) {}
