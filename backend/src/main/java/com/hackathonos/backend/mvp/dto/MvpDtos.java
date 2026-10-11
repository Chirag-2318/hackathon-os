package com.hackathonos.backend.mvp.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class MvpDtos {

    public record MvpTaskRefDto(
            UUID id,
            String key
    ) {}

    public record MvpOwnerDto(
            UUID id,
            String name,
            String avatarUrl
    ) {}

    public record CoreFlowStepDto(
            UUID id,
            String title,
            String status, // "working", "notyet", "mocked"
            MvpTaskRefDto task
    ) {}

    public record LedgerRowDto(
            UUID id,
            String part,
            String status, // "built", "existing", "mocked", "planned"
            MvpOwnerDto owner,
            MvpTaskRefDto task,
            String notes
    ) {}

    public record MvpHealthDto(
            boolean runs,
            boolean stable,
            boolean clear30,
            boolean wow60,
            int passed,
            int total
    ) {}

    public record CutItemDto(
            UUID id,
            String text,
            boolean cut
    ) {}

    public record MvpStateResponseDto(
            String identity,
            String wow,
            List<CoreFlowStepDto> coreFlow,
            List<LedgerRowDto> ledger,
            MvpHealthDto health,
            String differentiation,
            String breaksFirst,
            List<CutItemDto> cutList,
            Instant updatedAt
    ) {}

    public record UpdatePitchRequest(
            String identity,
            String wow
    ) {}

    public record CoreFlowStepInput(
            UUID id,
            String title,
            String status,
            UUID taskId
    ) {}

    public record UpdateCoreFlowRequest(
            List<CoreFlowStepInput> steps
    ) {}

    public record LedgerRowInput(
            UUID id,
            String part,
            String status,
            UUID ownerId,
            UUID taskId,
            String notes
    ) {}

    public record UpdateLedgerRequest(
            List<LedgerRowInput> rows
    ) {}

    public record UpdateHealthRequest(
            Boolean runs,
            Boolean stable,
            Boolean clear30,
            Boolean wow60
    ) {}

    public record UpdateJudgePrepRequest(
            String differentiation,
            String breaksFirst
    ) {}

    public record CutItemInput(
            UUID id,
            String text,
            Boolean cut
    ) {}

    public record UpdateCutListRequest(
            List<CutItemInput> items
    ) {}

    public record UpdateFullMvpRequest(
            String identity,
            String wow,
            List<CoreFlowStepInput> coreFlow,
            List<LedgerRowInput> ledger,
            UpdateHealthRequest health,
            String differentiation,
            String breaksFirst,
            List<CutItemInput> cutList
    ) {}
}
