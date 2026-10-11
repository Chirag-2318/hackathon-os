package com.hackathonos.backend.plan.dto;

public record ContextPackDto(
        IdeaContextDto idea,
        RubricContextDto rubric,
        SkillsContextDto skills
) {
    public record IdeaContextDto(boolean ok, long approvedCount) {}
    public record RubricContextDto(boolean ok) {}
    public record SkillsContextDto(boolean ok, int membersWithSkills) {}
}
