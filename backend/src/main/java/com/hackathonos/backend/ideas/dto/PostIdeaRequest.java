package com.hackathonos.backend.ideas.dto;

import java.util.List;

public record PostIdeaRequest(
        String text,
        List<IdeaLinkDto> links,
        List<String> notes
) {}
