package com.hackathonos.backend.ideas.dto;

import java.util.List;

public record PostIdeaRequest(
        String text,
        List<IdeaLinkDto> links,
        List<String> notes,
        Boolean anonymous
) {
    public PostIdeaRequest(String text, List<IdeaLinkDto> links, List<String> notes) {
        this(text, links, notes, false);
    }
}
