package com.hackathonos.backend.pitch;

import java.util.List;

public class PitchDocDtos {

    public record PitchDocStatusDto(
            boolean hasDemoScript,
            int demoScriptVersion,
            boolean hasQnaDoc,
            int qnaDocVersion,
            String scriptSource, // "DOC" or "GENERATED"
            int currentScriptDocVersion,
            int planStep
    ) {}

    public record QnaQuestionItemDto(
            String hash,
            String question,
            String ownerHandle,
            String answer,
            String followUp,
            String counter,
            String proof,
            boolean practiced
    ) {}

    public record QnaCategoryDto(
            String name,
            List<QnaQuestionItemDto> questions
    ) {}

    public record SimpleListItemDto(
            String title,
            String text
    ) {}

    public record AiDraftQuestionDto(
            String id,
            String question,
            String answer,
            String category
    ) {}

    public record QnaDocResponseDto(
            boolean exists,
            int docVersion,
            boolean parseFailed,
            String rawMarkdown,
            int practicedCount,
            int totalCount,
            List<QnaCategoryDto> categories,
            List<SimpleListItemDto> codeDefenseDrills,
            List<SimpleListItemDto> hardTruths,
            List<SimpleListItemDto> questionsToAskJudges,
            List<AiDraftQuestionDto> aiDraftQuestions,
            int planStep
    ) {}

    public record ToggleQnaPracticeRequest(
            String questionHash,
            boolean practiced
    ) {}
}
