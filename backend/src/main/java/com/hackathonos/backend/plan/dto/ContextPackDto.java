package com.hackathonos.backend.plan.dto;

public record ContextPackDto(
        IdeaContextDto idea,
        RubricContextDto rubric,
        SkillsContextDto skills,
        NotesContextDto notes,
        FilesContextDto files
) {
    public record IdeaContextDto(boolean ok, long approvedCount) {}
    public record RubricContextDto(boolean ok) {}
    public record SkillsContextDto(boolean ok, int membersWithSkills, int totalMembers) {}
    public record NotesContextDto(boolean ok, boolean hasNotes) {}
    public record FilesContextDto(boolean ok, int count) {}

    public ContextPackDto(IdeaContextDto idea, RubricContextDto rubric, SkillsContextDto skills) {
        this(idea, rubric, skills, new NotesContextDto(false, false), new FilesContextDto(true, 2));
    }
}
