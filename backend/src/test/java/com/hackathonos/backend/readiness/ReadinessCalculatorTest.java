package com.hackathonos.backend.readiness;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReadinessCalculatorTest {

    @Test
    void testAllItemsPassingProduces100ScoreAndNoWeakSpots() {
        List<ReadinessCalculator.ReadinessItem> perfectItems = List.of(
                new ReadinessCalculator.ReadinessItem("Checked item 1", true, "/test"),
                new ReadinessCalculator.ReadinessItem("Checked item 2", true, "/test")
        );

        ReadinessCalculator.CalculationResult result = ReadinessCalculator.calculate(
                perfectItems, perfectItems, perfectItems,
                perfectItems, perfectItems, perfectItems, perfectItems
        );

        assertEquals(100, result.score());
        assertTrue(result.weakSpots().isEmpty());
        assertEquals(7, result.categories().size());
        assertEquals(7, result.rings().size());
        for (ReadinessCalculator.ReadinessRing ring : result.rings()) {
            assertEquals(1.0, ring.progress(), 0.001);
            assertEquals("2/2", ring.valueText());
        }
    }

    @Test
    void testWeakSpotsExtractedFromLowestCategories() {
        List<ReadinessCalculator.ReadinessItem> failedItems = List.of(
                new ReadinessCalculator.ReadinessItem("Failing item A", false, "/failed-a"),
                new ReadinessCalculator.ReadinessItem("Failing item B", false, "/failed-b")
        );
        List<ReadinessCalculator.ReadinessItem> passingItems = List.of(
                new ReadinessCalculator.ReadinessItem("Passing item 1", true, "/pass-1"),
                new ReadinessCalculator.ReadinessItem("Passing item 2", true, "/pass-2")
        );

        ReadinessCalculator.CalculationResult result = ReadinessCalculator.calculate(
                failedItems,  // rubric 0%
                passingItems, // mvp 100%
                passingItems, // demo 100%
                passingItems, // sub 100%
                passingItems, // team 100%
                passingItems, // repo 100%
                passingItems  // delivery 100%
        );

        assertFalse(result.weakSpots().isEmpty());
        assertEquals("Failing item A", result.weakSpots().get(0).title());
        assertEquals("/failed-a", result.weakSpots().get(0).route());
        assertEquals("high", result.weakSpots().get(0).severity());
    }

    @Test
    void testEmptyCategoriesHandledGracefully() {
        ReadinessCalculator.CalculationResult result = ReadinessCalculator.calculate(
                List.of(), List.of(), List.of(),
                List.of(), List.of(), List.of(), List.of()
        );

        assertEquals(0, result.score());
        assertEquals(7, result.categories().size());
        for (ReadinessCalculator.ReadinessCategory cat : result.categories()) {
            assertEquals(0, cat.passed());
            assertEquals(1, cat.total());
            assertEquals(0, cat.percent());
        }
    }
}
