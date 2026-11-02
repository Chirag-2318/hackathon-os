package com.hackathonos.backend.plan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanStepPromptRepository extends JpaRepository<PlanStepPrompt, UUID> {
    Optional<PlanStepPrompt> findByRoomIdAndStepIndex(UUID roomId, int stepIndex);
    List<PlanStepPrompt> findByRoomId(UUID roomId);
    void deleteByRoomId(UUID roomId);

    @Transactional
    @Modifying
    @Query(value = """
        INSERT INTO plan_step_prompts (
            id, room_id, step_index, step_key, prompt, char_count, mode, idea_verdict,
            missing_inputs, stale, input_hash, assessment_locked, generated_at, updated_at
        ) VALUES (
            gen_random_uuid(), :roomId, :stepIndex, :stepKey, :prompt, :charCount, :mode, :ideaVerdict,
            CAST(:missingInputs AS jsonb), :stale, :inputHash, :assessmentLocked, :now, :now
        )
        ON CONFLICT (room_id, step_index) DO UPDATE
        SET prompt = EXCLUDED.prompt,
            char_count = EXCLUDED.char_count,
            mode = EXCLUDED.mode,
            idea_verdict = EXCLUDED.idea_verdict,
            input_hash = EXCLUDED.input_hash,
            assessment_locked = EXCLUDED.assessment_locked,
            stale = EXCLUDED.stale,
            updated_at = EXCLUDED.updated_at
    """, nativeQuery = true)
    int upsertPrompt(
            @Param("roomId") UUID roomId,
            @Param("stepIndex") int stepIndex,
            @Param("stepKey") String stepKey,
            @Param("prompt") String prompt,
            @Param("charCount") int charCount,
            @Param("mode") String mode,
            @Param("ideaVerdict") String ideaVerdict,
            @Param("missingInputs") String missingInputs,
            @Param("stale") boolean stale,
            @Param("inputHash") String inputHash,
            @Param("assessmentLocked") String assessmentLocked,
            @Param("now") Instant now
    );
}
