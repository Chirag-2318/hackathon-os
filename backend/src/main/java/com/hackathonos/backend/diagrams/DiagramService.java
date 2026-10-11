package com.hackathonos.backend.diagrams;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Service managing Mermaid diagrams and built-in templates.
 */
@Service
public class DiagramService {

    private static final List<String> VALID_PREFIXES = List.of(
            "flowchart", "graph", "sequencediagram", "erdiagram",
            "gantt", "classdiagram", "statediagram", "journey"
    );

    private static final List<DiagramDtos.DiagramTemplateDto> BUILT_IN_TEMPLATES = List.of(
            new DiagramDtos.DiagramTemplateDto(
                    "architecture",
                    "System Architecture",
                    "flowchart TD\n  Client[Web Client] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Core[Core API]\n  Core --> DB[(PostgreSQL)]\n  Core --> Cache[(Redis Cache)]"
            ),
            new DiagramDtos.DiagramTemplateDto(
                    "userflow",
                    "User Flow Journey",
                    "journey\n  title User Onboarding Journey\n  section Discovery\n    Landing Page: 5: User\n    Join Room via Invite: 4: User\n  section Build\n    Claim Board Task: 5: User\n    Sync GitHub Branch: 4: User"
            ),
            new DiagramDtos.DiagramTemplateDto(
                    "sequence",
                    "API Sequence Diagram",
                    "sequenceDiagram\n  autonumber\n  actor User\n  participant Web as Frontend\n  participant API as Backend API\n  participant DB as Database\n  User->>Web: Request Data\n  Web->>API: GET /api/v1/resource\n  API->>DB: Query\n  DB-->>API: Rows\n  API-->>Web: JSON Response\n  Web-->>User: Render View"
            ),
            new DiagramDtos.DiagramTemplateDto(
                    "er",
                    "Entity Relationship Diagram",
                    "erDiagram\n  ROOM ||--o{ ROOM_MEMBER : has\n  ROOM ||--o{ TASK : contains\n  TASK ||--o{ TASK_DEPENDENCY : depends_on\n  USER ||--o{ ROOM_MEMBER : joins"
            ),
            new DiagramDtos.DiagramTemplateDto(
                    "roadmap",
                    "Sprint Roadmap",
                    "gantt\n  title Hackathon Timeline\n  dateFormat HH:mm\n  axisFormat %H:%M\n  section Planning\n  Ideation & PRD :00:00, 4h\n  section Execution\n  Core MVP Flow :04:00, 16h\n  section Review\n  Pitch & Rehearsal :20:00, 4h"
            )
    );

    private final DiagramRepository diagramRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomAccess roomAccess;

    public DiagramService(
            DiagramRepository diagramRepository,
            RoomMemberRepository memberRepository,
            RoomAccess roomAccess
    ) {
        this.diagramRepository = diagramRepository;
        this.memberRepository = memberRepository;
        this.roomAccess = roomAccess;
    }

    /**
     * Lists diagrams for a room alongside built-in templates.
     */
    @Transactional(readOnly = true)
    public DiagramDtos.DiagramsResponse getDiagrams(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<Diagram> diagrams = diagramRepository.findByRoomIdOrderByUpdatedAtDesc(roomId);
        List<DiagramDtos.DiagramItemDto> dtos = diagrams.stream().map(this::toDto).toList();
        return new DiagramDtos.DiagramsResponse(dtos, BUILT_IN_TEMPLATES);
    }

    /**
     * Creates a new diagram after validating Mermaid syntax prefix and constraints.
     */
    @Transactional
    public DiagramDtos.DiagramItemDto createDiagram(UUID roomId, User user, DiagramDtos.CreateDiagramRequest req) {
        roomAccess.requireMember(roomId, user);
        validateDiagramRequest(req.title(), req.mermaidSource());

        Instant now = Instant.now();
        Diagram diagram = new Diagram(
                roomId,
                req.title().trim(),
                req.kind() != null ? req.kind().trim() : "architecture",
                req.mermaidSource().trim(),
                user.getId(),
                now,
                now
        );
        Diagram saved = diagramRepository.save(diagram);
        return toDto(saved);
    }

    /**
     * Updates an existing diagram's title, kind, or Mermaid source.
     */
    @Transactional
    public DiagramDtos.DiagramItemDto updateDiagram(UUID roomId, UUID diagramId, User user, DiagramDtos.UpdateDiagramRequest req) {
        roomAccess.requireMember(roomId, user);
        validateDiagramRequest(req.title(), req.mermaidSource());

        Diagram diagram = diagramRepository.findById(diagramId)
                .filter(d -> d.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("DIAGRAM_NOT_FOUND", "Diagram not found"));

        diagram.setTitle(req.title().trim());
        if (req.kind() != null) {
            diagram.setKind(req.kind().trim());
        }
        diagram.setMermaidSource(req.mermaidSource().trim());
        diagram.setUpdatedAt(Instant.now());

        Diagram saved = diagramRepository.save(diagram);
        return toDto(saved);
    }

    /**
     * Deletes a diagram; creator or room leader only.
     */
    @Transactional
    public void deleteDiagram(UUID roomId, UUID diagramId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Diagram diagram = diagramRepository.findById(diagramId)
                .filter(d -> d.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("DIAGRAM_NOT_FOUND", "Diagram not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isCreator = user.getId().equals(diagram.getCreatedBy());

        if (!isLeader && !isCreator) {
            throw new ForbiddenException("CANNOT_DELETE_DIAGRAM", "Only the creator or room leader can delete this diagram");
        }

        diagramRepository.delete(diagram);
    }

    public static void validateMermaidSource(String source) {
        if (source == null || source.isBlank()) {
            throw new BadRequestException("INVALID_DIAGRAM", "Mermaid source cannot be empty");
        }
        if (source.length() > 20000) {
            throw new BadRequestException("DIAGRAM_TOO_LARGE", "Mermaid source exceeds 20,000 characters");
        }

        String cleaned = removeLeadingComments(source).trim().toLowerCase(Locale.ROOT);
        boolean startsWithValid = false;
        for (String prefix : VALID_PREFIXES) {
            if (cleaned.startsWith(prefix)) {
                startsWithValid = true;
                break;
            }
        }

        if (!startsWithValid) {
            throw new BadRequestException("INVALID_DIAGRAM", "Mermaid source must start with a valid diagram type (flowchart, graph, sequenceDiagram, erDiagram, gantt, classDiagram, stateDiagram, journey)");
        }
    }

    private void validateDiagramRequest(String title, String source) {
        if (title == null || title.isBlank() || title.trim().length() > 80) {
            throw new BadRequestException("INVALID_TITLE", "Title must be between 1 and 80 characters");
        }
        validateMermaidSource(source);
    }

    private static String removeLeadingComments(String input) {
        String[] lines = input.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        boolean passedLeading = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (!passedLeading && trimmed.startsWith("%%")) {
                continue;
            }
            passedLeading = true;
            sb.append(line).append("\n");
        }
        return sb.toString();
    }

    private DiagramDtos.DiagramItemDto toDto(Diagram d) {
        return new DiagramDtos.DiagramItemDto(
                d.getId(),
                d.getTitle(),
                d.getKind(),
                d.getMermaidSource(),
                d.getUpdatedAt()
        );
    }
}
