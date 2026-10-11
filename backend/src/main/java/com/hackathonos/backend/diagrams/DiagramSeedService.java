package com.hackathonos.backend.diagrams;

import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Seeds a system architecture diagram from the validated tech plan step if a mermaid block exists.
 */
@Service
public class DiagramSeedService {

    private static final Pattern MERMAID_PATTERN = Pattern.compile("```mermaid\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);

    private final DiagramRepository diagramRepository;
    private final PlanStepRepository planStepRepository;

    public DiagramSeedService(
            DiagramRepository diagramRepository,
            PlanStepRepository planStepRepository
    ) {
        this.diagramRepository = diagramRepository;
        this.planStepRepository = planStepRepository;
    }

    /**
     * Seeds the system architecture diagram from the plan's tech answer.
     */
    @Transactional
    public void seedFromPlan(Room room) {
        Optional<PlanStep> techStep = planStepRepository.findByRoomIdAndStepKey(room.getId(), "tech");
        if (techStep.isEmpty() || !techStep.get().isValidated() || techStep.get().getAnswer() == null) {
            return;
        }

        String answer = techStep.get().getAnswer();
        Matcher matcher = MERMAID_PATTERN.matcher(answer);
        if (!matcher.find()) {
            return;
        }

        String mermaidSource = matcher.group(1).trim();
        if (mermaidSource.isBlank()) {
            return;
        }

        Optional<Diagram> existing = diagramRepository.findByRoomIdAndTitle(room.getId(), "System architecture");
        Instant now = Instant.now();
        if (existing.isPresent()) {
            Diagram diagram = existing.get();
            diagram.setMermaidSource(mermaidSource);
            diagram.setUpdatedAt(now);
            diagramRepository.save(diagram);
        } else {
            Diagram diagram = new Diagram(
                    room.getId(),
                    "System architecture",
                    "architecture",
                    mermaidSource,
                    room.getOwnerId(),
                    now,
                    now
            );
            diagramRepository.save(diagram);
        }
    }
}
