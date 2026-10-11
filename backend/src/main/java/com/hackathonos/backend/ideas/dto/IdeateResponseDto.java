package com.hackathonos.backend.ideas.dto;

import java.util.List;

public record IdeateResponseDto(
        IdeateTopicDto topic,
        List<IdeaDto> ideas,
        IdeaCountsDto counts,
        boolean ideationDone,
        String primaryIdeaId,
        List<ContributorDto> contributors,
        IdeatePermissionsDto permissions
) {}
