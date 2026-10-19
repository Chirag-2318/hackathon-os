package com.hackathonos.backend.plan;

import com.hackathonos.backend.plan.validators.*;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class PlanValidatorTest {

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
    private final PrdValidator prdValidator = new PrdValidator();
    private final TechValidator techValidator = new TechValidator();
    private final PhasesValidator phasesValidator = new PhasesValidator(objectMapper);
    private final TasksValidator tasksValidator = new TasksValidator(objectMapper);
    private final DemoValidator demoValidator = new DemoValidator();

    private String readSample(String filename) {
        try (InputStream is = getClass().getResourceAsStream("/plan-samples/" + filename)) {
            assertNotNull(is, "Sample file not found: " + filename);
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testPrdValidator() {
        ValidationResult good = prdValidator.validate(readSample("prd-good.md"));
        assertTrue(good.errors().isEmpty(), "PRD good should have no errors: " + good.errors());

        ValidationResult warn = prdValidator.validate(readSample("prd-warnings.md"));
        assertTrue(warn.errors().isEmpty(), "PRD warnings should have no errors");
        assertFalse(warn.warnings().isEmpty(), "PRD warnings should have warnings");

        ValidationResult broken = prdValidator.validate(readSample("prd-broken.md"));
        assertFalse(broken.errors().isEmpty(), "PRD broken should have errors");
    }

    @Test
    void testTechValidator() {
        ValidationResult good = techValidator.validate(readSample("tech-good.md"));
        assertTrue(good.errors().isEmpty(), "Tech good should have no errors: " + good.errors());

        ValidationResult warn = techValidator.validate(readSample("tech-warnings.md"));
        assertTrue(warn.errors().isEmpty(), "Tech warnings should have no errors");
        assertFalse(warn.warnings().isEmpty(), "Tech warnings should have warnings");

        ValidationResult broken = techValidator.validate(readSample("tech-broken.md"));
        assertFalse(broken.errors().isEmpty(), "Tech broken should have errors");
    }

    @Test
    void testPhasesValidatorAndNormalization() {
        ValidationResult good = phasesValidator.validate(readSample("phases-good.json"));
        assertTrue(good.errors().isEmpty(), "Phases good should have no errors: " + good.errors());

        ValidationResult warn = phasesValidator.validate(readSample("phases-warnings.json"));
        assertTrue(warn.errors().isEmpty(), "Phases warnings should have no errors");
        assertFalse(warn.warnings().isEmpty(), "Phases warnings should have warnings for normalization & keywords");

        // Verify normalization on warn result: sorted, snapped, last end is 100
        @SuppressWarnings("unchecked")
        List<PhasesValidator.NormalizedPhase> parsed = (List<PhasesValidator.NormalizedPhase>) warn.parsed();
        assertNotNull(parsed);
        assertEquals(3, parsed.size());
        assertEquals(0.0, parsed.get(0).startPct);
        assertEquals(100.0, parsed.get(parsed.size() - 1).endPct);

        ValidationResult broken = phasesValidator.validate(readSample("phases-broken.json"));
        assertFalse(broken.errors().isEmpty(), "Phases broken should have errors");
    }

    @Test
    void testTasksValidator() {
        var knownPhases = Set.of("p1", "p2", "p3", "p4", "p5");
        var knownRoles = Set.of("Frontend", "Backend", "Design");
        ValidationResult good = tasksValidator.validate(readSample("tasks-good.json"), knownPhases, knownRoles, 4, 36);
        assertTrue(good.errors().isEmpty(), "Tasks good should have no errors: " + good.errors());

        ValidationResult warn = tasksValidator.validate(readSample("tasks-warnings.json"), knownPhases, knownRoles, 4, 36);
        assertTrue(warn.errors().isEmpty(), "Tasks warnings should have no errors");
        assertFalse(warn.warnings().isEmpty(), "Tasks warnings should have warnings");

        ValidationResult broken = tasksValidator.validate(readSample("tasks-broken.json"), knownPhases, knownRoles, 4, 36);
        assertFalse(broken.errors().isEmpty(), "Tasks broken should have errors");
    }

    @Test
    void testDemoValidatorAndQaParser() {
        ValidationResult good = demoValidator.validate(readSample("demo-good.md"));
        assertTrue(good.errors().isEmpty(), "Demo good should have no errors: " + good.errors());

        ValidationResult warn = demoValidator.validate(readSample("demo-warnings.md"));
        assertTrue(warn.errors().isEmpty(), "Demo warnings should have no errors");
        assertFalse(warn.warnings().isEmpty(), "Demo warnings should have warnings for count and missing questions");

        ValidationResult broken = demoValidator.validate(readSample("demo-broken.md"));
        assertFalse(broken.errors().isEmpty(), "Demo broken should have errors");

        // Verify tolerant QA parsing directly
        String text = """
                # Likely judge Q&A
                1. Q: What did you build this weekend?
                A: We built the [brackit] platform.
                
                2. **Q:** What breaks first?
                **A:** Network timeouts.
                
                Q3: How much does it cost?
                A: Completely free and open source.
                """;
        List<DemoValidator.QaPair> pairs = demoValidator.parseQaPairs(text);
        assertEquals(3, pairs.size());
        assertTrue(pairs.get(0).question().contains("What did you build this weekend?"));
        assertTrue(pairs.get(1).question().contains("What breaks first?"));
        assertTrue(pairs.get(2).question().contains("How much does it cost?"));
    }

    @Test
    void testMarkdownSectionsHelper() {
        String md = """
                # Top
                Content top
                ## Section 1
                Content 1
                ## Section 2
                Content 2
                """;
        Map<String, String> sections = MarkdownSections.parse(md).getSections();
        assertTrue(sections.containsKey("# Top"));
        assertTrue(sections.containsKey("## Section 1"));
        assertTrue(sections.containsKey("## Section 2"));
        assertEquals("Content 1", sections.get("## Section 1"));
    }
}
