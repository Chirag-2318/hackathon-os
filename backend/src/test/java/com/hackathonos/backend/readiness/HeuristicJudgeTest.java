package com.hackathonos.backend.readiness;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HeuristicJudgeTest {

    @Test
    void testShortAnswerWithoutNumbersScores1() {
        HeuristicJudge.CriterionScore score =
                HeuristicJudge.evaluateAnswer("Innovation", 20, "Short reply.");

        assertEquals(1, score.score());
        assertTrue(score.feedback().contains("concrete number"));
    }

    @Test
    void testShortAnswerWithNumberScores2() {
        HeuristicJudge.CriterionScore score =
                HeuristicJudge.evaluateAnswer("Innovation", 20, "Saved 5 hours.");

        assertEquals(2, score.score());
        assertTrue(score.feedback().contains("Good specifics"));
    }

    @Test
    void testMediumAnswerWithoutNumbersScores2() {
        String answer = "We built a specialized distributed pipeline that connects multiple services and caches query results.";
        assertTrue(answer.length() >= 40 && answer.length() <= 120);

        HeuristicJudge.CriterionScore score =
                HeuristicJudge.evaluateAnswer("Technical Depth", 30, answer);

        assertEquals(2, score.score());
        assertTrue(score.feedback().contains("concrete number"));
    }

    @Test
    void testLongAnswerWithMetricsScores5() {
        String answer = "Our system handled 500 requests per second with under 15ms latency across 3 distributed nodes. " +
                "By using PostgreSQL connection pooling and in-memory caches, we reduced database load by 80%, " +
                "ensuring that sudden bursts during judge demos will not cause downtime or thread exhaustion in our microservices.";
        assertTrue(answer.length() > 250);

        HeuristicJudge.CriterionScore score =
                HeuristicJudge.evaluateAnswer("Architecture", 40, answer);

        assertEquals(5, score.score());
        assertTrue(score.feedback().contains("Solid evidence"));
    }

    @Test
    void testEvaluateAllWeightedScore() {
        List<HeuristicJudge.CriterionInput> inputs = List.of(
                new HeuristicJudge.CriterionInput("UX", 50, "We interviewed 10 beta testers and fixed 3 usability flaws during testing."),
                new HeuristicJudge.CriterionInput("Tech", 50, "Too brief.")
        );

        HeuristicJudge.EvaluationResult result = HeuristicJudge.evaluateAll(inputs);

        assertNotNull(result);
        assertEquals(2, result.criteria().size());
        assertEquals("Estimate, not a prediction", result.estimateNote());
        assertTrue(result.totalScore() > 0 && result.totalScore() <= 100);
    }

    @Test
    void testEvaluateAllEmptyInputs() {
        HeuristicJudge.EvaluationResult result = HeuristicJudge.evaluateAll(List.of());

        assertEquals(50, result.totalScore());
        assertTrue(result.criteria().isEmpty());
    }
}
