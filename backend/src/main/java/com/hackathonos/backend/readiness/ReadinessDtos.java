package com.hackathonos.backend.readiness;

import java.time.Instant;
import java.util.List;

public class ReadinessDtos {

    public record SnapshotHistoryPointDto(
            Instant at,
            int score
    ) {}

    public record SimulationScoreDto(
            String criterion,
            int weight,
            int score
    ) {}

    public record SimulatorDataDto(
            String mode,
            String bridgeStep,
            List<SimulationScoreDto> scores,
            List<String> likelyQuestions
    ) {}

    public record ReadinessResponse(
            int score,
            String label,
            List<ReadinessCalculator.ReadinessCategory> categories,
            List<ReadinessCalculator.WeakSpotItem> weakSpots,
            List<ReadinessCalculator.ReadinessRing> rings,
            List<SnapshotHistoryPointDto> history,
            HeuristicJudge.EvaluationResult lastSimulation,
            SimulatorDataDto simulator,
            Instant serverNow
    ) {}

    public record QuestionDto(
            String questionId,
            String criterion,
            String question
    ) {}

    public record SimulateAnswerItem(
            String questionId,
            String criterion,
            String answer
    ) {}

    public record ValidateSimulationRequest(
            List<SimulateAnswerItem> answers,
            String answer,
            Boolean useAi
    ) {}

    public record ValidateSimulationResponse(
            List<HeuristicJudge.CriterionScore> criteria,
            int total,
            String estimateNote,
            boolean success
    ) {}
}
