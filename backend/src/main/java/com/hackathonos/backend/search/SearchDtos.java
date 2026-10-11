package com.hackathonos.backend.search;

import java.util.List;
import java.util.UUID;

public class SearchDtos {

    public record SearchResponseDto(
            List<SearchTaskDto> tasks,
            List<SearchDocDto> docs,
            List<SearchRuleDto> rules,
            List<SearchRoomDto> rooms
    ) {}

    public record SearchTaskDto(
            UUID roomId,
            String roomName,
            String key,
            String summary,
            String status
    ) {}

    public record SearchDocDto(
            UUID roomId,
            String roomName,
            String fileName,
            String title
    ) {}

    public record SearchRuleDto(
            UUID roomId,
            String roomName,
            String field,
            String snippet
    ) {}

    public record SearchRoomDto(
            UUID id,
            String name
    ) {}
}
