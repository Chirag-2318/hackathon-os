package com.hackathonos.backend.crowdcheck;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service evaluating hackathon idea distinctiveness against common cliches and competitors.
 */
@Service
public class CrowdCheckService {

    private static final List<CrowdCheckDtos.ClicheDto> COMMON_CLICHES = List.of(
            new CrowdCheckDtos.ClicheDto("AI Chatbot", List.of("chatbot", "chat", "assistant", "bot", "gpt", "rag"), "Differentiate with unique data, custom workflow actions, or offline execution."),
            new CrowdCheckDtos.ClicheDto("Expense Tracker", List.of("expense", "budget", "finance", "money tracker", "spending"), "Focus on group resolution, invoice OCR, or predictive recurring bills."),
            new CrowdCheckDtos.ClicheDto("To-Do / Task App", List.of("todo", "to-do", "task manager", "checklist", "planner"), "Show automated scheduling, dependency unblocking, or real-time pairing."),
            new CrowdCheckDtos.ClicheDto("Food Delivery Clone", List.of("food delivery", "meal delivery", "restaurant order", "canteen order"), "Address kitchen batching, food waste reduction, or dynamic surge pricing."),
            new CrowdCheckDtos.ClicheDto("Attendance System", List.of("attendance", "facial attendance", "biometric", "qr attendance", "roll call"), "Integrate with real mess/classroom decisions or offline BLE verification."),
            new CrowdCheckDtos.ClicheDto("Health Tracker", List.of("health tracker", "fitness", "calorie", "workout", "step counter"), "Provide clinical doctor export or biometric anomaly detection."),
            new CrowdCheckDtos.ClicheDto("Student Marketplace", List.of("student marketplace", "campus marketplace", "buy sell books", "peer store"), "Solve escrow safety, campus verification, or hostel delivery lockers."),
            new CrowdCheckDtos.ClicheDto("Resume Builder", List.of("resume builder", "cv maker", "portfolio generator", "job bot"), "Demonstrate verifiable GitHub proof-of-work or real interviewer scoring."),
            new CrowdCheckDtos.ClicheDto("Weather App", List.of("weather app", "forecast", "climate alert", "rain radar"), "Couple with agricultural advice, solar generation, or event logistics."),
            new CrowdCheckDtos.ClicheDto("E-Commerce Site", List.of("ecommerce", "e-commerce", "shopping cart", "storefront", "online shop"), "Highlight localized supply chains, AR sizing, or instant peer bargaining.")
    );

    private final CrowdRowRepository crowdRowRepository;
    private final IdeaRepository ideaRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final ObjectMapper objectMapper;

    public CrowdCheckService(
            CrowdRowRepository crowdRowRepository,
            IdeaRepository ideaRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            ObjectMapper objectMapper
    ) {
        this.crowdRowRepository = crowdRowRepository;
        this.ideaRepository = ideaRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.objectMapper = objectMapper;
    }

    /**
     * Lists crowd check rows, pre-filling from approved ideas if ideation is completed.
     */
    @Transactional
    public CrowdCheckDtos.CrowdCheckResponse getCrowdCheck(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomRepository.findById(roomId).orElseThrow();

        // Pre-fill from approved ideas if ideation is done
        if (room.isIdeateDone()) {
            List<Idea> approved = ideaRepository.findByRoomIdAndStatusOrderByCreatedAtDesc(roomId, "APPROVED");
            for (Idea idea : approved) {
                if (crowdRowRepository.findByRoomIdAndIdeaId(roomId, idea.getId()).isEmpty()) {
                    String title = idea.getText().split("\\n")[0].trim();
                    CrowdRow row = new CrowdRow(roomId, idea.getId(), title, "[]", 2, "Imported from approved ideation");
                    crowdRowRepository.save(row);
                }
            }
        }

        List<CrowdRow> rows = crowdRowRepository.findByRoomIdOrderByTitleAsc(roomId);
        List<CrowdCheckDtos.CrowdRowDto> dtos = rows.stream().map(this::toDto).toList();

        return new CrowdCheckDtos.CrowdCheckResponse(dtos, COMMON_CLICHES, Instant.now());
    }

    /**
     * Adds a crowd check competitor evaluation row.
     */
    @Transactional
    public CrowdCheckDtos.CrowdRowDto createRow(UUID roomId, User user, CrowdCheckDtos.CreateCrowdRowRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("INVALID_TITLE", "Title cannot be empty");
        }

        int crowdedness = req.crowdedness() != null ? Math.min(Math.max(1, req.crowdedness()), 5) : 3;
        String compJson = "[]";
        if (req.competitors() != null) {
            try {
                compJson = objectMapper.writeValueAsString(req.competitors());
            } catch (Exception ignored) {}
        }

        CrowdRow row = new CrowdRow(
                roomId,
                req.ideaId(),
                req.title().trim(),
                compJson,
                crowdedness,
                req.notes() != null ? req.notes().trim() : ""
        );
        CrowdRow saved = crowdRowRepository.save(row);
        return toDto(saved);
    }

    /**
     * Updates an existing crowd check row.
     */
    @Transactional
    public CrowdCheckDtos.CrowdRowDto updateRow(UUID roomId, UUID rowId, User user, CrowdCheckDtos.UpdateCrowdRowRequest req) {
        roomAccess.requireMember(roomId, user);
        CrowdRow row = crowdRowRepository.findById(rowId)
                .filter(r -> r.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ROW_NOT_FOUND", "Crowd row not found"));

        if (req.title() != null && !req.title().isBlank()) row.setTitle(req.title().trim());
        if (req.crowdedness() != null) row.setCrowdedness(Math.min(Math.max(1, req.crowdedness()), 5));
        if (req.notes() != null) row.setNotes(req.notes().trim());
        if (req.competitors() != null) {
            try {
                row.setCompetitors(objectMapper.writeValueAsString(req.competitors()));
            } catch (Exception ignored) {}
        }

        CrowdRow saved = crowdRowRepository.save(row);
        return toDto(saved);
    }

    /**
     * Deletes a crowd check row.
     */
    @Transactional
    public void deleteRow(UUID roomId, UUID rowId, User user) {
        roomAccess.requireMember(roomId, user);
        CrowdRow row = crowdRowRepository.findById(rowId)
                .filter(r -> r.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ROW_NOT_FOUND", "Crowd row not found"));
        crowdRowRepository.delete(row);
    }

    private CrowdCheckDtos.CrowdRowDto toDto(CrowdRow r) {
        List<String> competitors = new ArrayList<>();
        if (r.getCompetitors() != null && !r.getCompetitors().isBlank()) {
            try {
                competitors = objectMapper.readValue(r.getCompetitors(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        List<String> clicheMatches = new ArrayList<>();
        String titleLower = r.getTitle().toLowerCase(Locale.ROOT);
        for (CrowdCheckDtos.ClicheDto c : COMMON_CLICHES) {
            for (String kw : c.keywords()) {
                if (titleLower.contains(kw)) {
                    clicheMatches.add(c.label());
                    break;
                }
            }
        }

        String level = r.getCrowdedness() <= 2 ? "LOW" : (r.getCrowdedness() <= 3 ? "MEDIUM" : "HIGH");
        String likelyCompeting = String.join(", ", competitors);

        return new CrowdCheckDtos.CrowdRowDto(
                r.getId(),
                r.getIdeaId(),
                r.getTitle(),
                r.getTitle(),
                competitors,
                likelyCompeting,
                r.getCrowdedness(),
                level,
                r.getNotes(),
                clicheMatches
        );
    }
}
