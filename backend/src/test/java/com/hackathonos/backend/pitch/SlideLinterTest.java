package com.hackathonos.backend.pitch;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class SlideLinterTest {

    private final UUID roomId = UUID.randomUUID();

    private PitchSlide createSlide(int position, String kind, String title, String content, UUID id) {
        PitchSlide slide = new PitchSlide(roomId, position, kind, title, "Question?", content);
        slide.setId(id);
        return slide;
    }

    @Test
    void testCountWords() {
        assertEquals(0, SlideLinter.countWords(null));
        assertEquals(0, SlideLinter.countWords(""));
        assertEquals(0, SlideLinter.countWords("    "));
        assertEquals(4, SlideLinter.countWords("One two three four"));
        assertEquals(3, SlideLinter.countWords("  Lots   of    spaces "));
    }

    @Test
    void testEmptyAndWordHeavySlides() {
        UUID slide1Id = UUID.randomUUID();
        PitchSlide emptySlide = createSlide(0, "PROBLEM", "Problem", "", slide1Id);

        UUID slide2Id = UUID.randomUUID();
        StringBuilder heavy = new StringBuilder();
        for (int i = 0; i < 75; i++) {
            heavy.append("word").append(i).append(" ");
        }
        PitchSlide heavySlide = createSlide(1, "NEXT", "Next Steps", heavy.toString(), slide2Id);

        List<SlideLinter.LintIssue> issues = SlideLinter.lint(
                List.of(emptySlide, heavySlide),
                5,
                List.of(),
                Map.of()
        );

        assertTrue(issues.stream().anyMatch(i -> "EMPTY_SLIDE".equals(i.code())));
        assertTrue(issues.stream().anyMatch(i -> "TOO_MUCH_TEXT".equals(i.code())));
    }

    @Test
    void testMissingProblemAndNextSlides() {
        UUID slideId = UUID.randomUUID();
        PitchSlide solutionSlide = createSlide(0, "SOLUTION", "Solution", "We built an engine", slideId);

        List<SlideLinter.LintIssue> issues = SlideLinter.lint(
                List.of(solutionSlide),
                5,
                List.of(),
                Map.of()
        );

        assertTrue(issues.stream().anyMatch(i -> "NO_PROBLEM_SLIDE".equals(i.code())));
        assertTrue(issues.stream().anyMatch(i -> "NO_WHATS_NEXT".equals(i.code())));
    }

    @Test
    void testImpactSlideWithoutNumber() {
        UUID slideId = UUID.randomUUID();
        PitchSlide impactSlide = createSlide(0, "IMPACT", "Impact", "This will change everything for users worldwide", slideId);
        PitchSlide probSlide = createSlide(1, "PROBLEM", "Problem", "Broken workflow", UUID.randomUUID());
        PitchSlide nextSlide = createSlide(2, "NEXT", "Roadmap", "Q1 rollout", UUID.randomUUID());

        List<SlideLinter.LintIssue> issues = SlideLinter.lint(
                List.of(impactSlide, probSlide, nextSlide),
                5,
                List.of(),
                Map.of()
        );

        assertTrue(issues.stream().anyMatch(i -> "NO_IMPACT_NUMBER".equals(i.code())));
    }

    @Test
    void testTooManySlidesAndCoverageGaps() {
        List<PitchSlide> slides = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            String kind = i == 0 ? "PROBLEM" : (i == 1 ? "NEXT" : "TECH");
            slides.add(createSlide(i, kind, "Slide " + i, "Content " + i, UUID.randomUUID()));
        }

        List<String> rubric = List.of("UX", "Technical Depth", "Business Model");
        Map<UUID, List<String>> coverage = Map.of(
                slides.get(0).getId(), List.of("UX")
        );

        List<SlideLinter.LintIssue> issues = SlideLinter.lint(slides, 4, rubric, coverage);

        // Max slides was 4, but 6 slides exist
        assertTrue(issues.stream().anyMatch(i -> "TOO_MANY_SLIDES".equals(i.code())));
        // "Technical Depth" and "Business Model" are uncovered
        assertTrue(issues.stream().anyMatch(i -> "COVERAGE_GAP".equals(i.code()) && i.message().contains("Technical Depth")));
        assertTrue(issues.stream().anyMatch(i -> "COVERAGE_GAP".equals(i.code()) && i.message().contains("Business Model")));
    }
}
