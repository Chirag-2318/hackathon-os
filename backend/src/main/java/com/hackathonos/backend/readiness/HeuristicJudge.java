package com.hackathonos.backend.readiness;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure calculator evaluating answer depth and scoring rubric criteria from 1 to 5 with feedback.
 */
public class HeuristicJudge {

    public record CriterionScore(
            String criterion,
            int weight,
            int score, // 1 to 5
            String feedback
    ) {}

    public record EvaluationResult(
            List<CriterionScore> criteria,
            int totalScore, // 0 to 100
            String estimateNote
    ) {}

    public static CriterionScore evaluateAnswer(String criterion, int weight, String answer) {
        if (answer == null) answer = "";
        String trimmed = answer.trim();
        int len = trimmed.length();

        int baseScore;
        if (len < 40) {
            baseScore = 1;
        } else if (len <= 120) {
            baseScore = 2;
        } else if (len <= 250) {
            baseScore = 3;
        } else {
            baseScore = 4;
        }

        boolean hasNumberOrPct = trimmed.matches(".*[0-9%].*");
        int finalScore = baseScore;
        if (hasNumberOrPct && finalScore < 5) {
            finalScore++;
        }

        String feedback;
        if (!hasNumberOrPct) {
            feedback = "Add a concrete number, metric, or user statistic to support your claim.";
        } else if (len < 120) {
            feedback = "Good specifics. Expand slightly on the trade-offs or technical details.";
        } else {
            feedback = "Solid evidence and clear technical defense.";
        }

        return new CriterionScore(criterion, weight, finalScore, feedback);
    }

    public static EvaluationResult evaluateAll(List<CriterionInput> inputs) {
        List<CriterionScore> scores = new ArrayList<>();
        int totalWeight = 0;
        double weightedSum = 0;

        for (CriterionInput in : inputs) {
            CriterionScore score = evaluateAnswer(in.criterion(), in.weight(), in.answer());
            scores.add(score);
            totalWeight += in.weight();
            weightedSum += (score.score() / 5.0) * in.weight();
        }

        int totalOutOf100;
        if (totalWeight > 0) {
            totalOutOf100 = (int) Math.round((weightedSum / totalWeight) * 100.0);
        } else {
            totalOutOf100 = 50;
        }

        return new EvaluationResult(scores, totalOutOf100, "Estimate, not a prediction");
    }

    public record CriterionInput(String criterion, int weight, String answer) {}
}
