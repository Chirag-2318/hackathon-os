package com.hackathonos.backend.pitch;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service managing pitch Q&A prep, code defense drills, and AI question generation.
 */
@Service
public class PitchQaService {

    private static final List<String> REQUIRED_QUESTIONS = List.of(
            "What did you build this weekend?",
            "Who exactly is this for?",
            "What breaks first?"
    );

    private final PitchQaRepository qaRepository;
    private final CodeDefenseDrillRepository drillRepository;
    private final UserRepository userRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final RoomAccess roomAccess;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public PitchQaService(
            PitchQaRepository qaRepository,
            CodeDefenseDrillRepository drillRepository,
            UserRepository userRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            RoomAccess roomAccess,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.qaRepository = qaRepository;
        this.drillRepository = drillRepository;
        this.userRepository = userRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.roomAccess = roomAccess;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    /**
     * Lists Q&A defense questions, code defense drills, and required question checklist.
     */
    @Transactional(readOnly = true)
    public PitchDtos.QaResponse getQa(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<PitchQa> items = qaRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<PitchDtos.QaItemDto> dtos = items.stream().map(this::toQaDto).toList();

        List<CodeDefenseDrill> drills = drillRepository.findByRoomIdOrderByModuleAsc(roomId);
        List<PitchDtos.CodeDefenseDto> drillDtos = drills.stream().map(this::toDrillDto).toList();

        List<PitchDtos.RequiredQuestionDto> reqList = new ArrayList<>();
        for (String reqQ : REQUIRED_QUESTIONS) {
            boolean present = items.stream().anyMatch(i -> i.getQuestion().trim().equalsIgnoreCase(reqQ.trim()));
            reqList.add(new PitchDtos.RequiredQuestionDto(reqQ, present));
        }

        return new PitchDtos.QaResponse(dtos, dtos, drillDtos, reqList);
    }

    /**
     * Adds a new Q&A item.
     */
    @Transactional
    public PitchDtos.QaItemDto createQa(UUID roomId, User user, PitchDtos.CreateQaRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.question() == null || req.question().isBlank()) {
            throw new BadRequestException("INVALID_QUESTION", "Question cannot be empty");
        }

        List<PitchQa> existing = qaRepository.findByRoomIdOrderByPositionAsc(roomId);
        PitchQa item = new PitchQa(
                roomId,
                existing.size(),
                req.question().trim(),
                req.answer() != null ? req.answer().trim() : "",
                req.category() != null ? req.category().trim().toUpperCase(Locale.ROOT) : "PRODUCT",
                "MANUAL",
                false,
                req.ownerId()
        );
        PitchQa saved = qaRepository.save(item);
        return toQaDto(saved);
    }

    /**
     * Updates an existing Q&A item.
     */
    @Transactional
    public PitchDtos.QaItemDto updateQa(UUID roomId, UUID id, User user, PitchDtos.UpdateQaRequest req) {
        roomAccess.requireMember(roomId, user);
        PitchQa item = qaRepository.findById(id)
                .filter(q -> q.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("QA_NOT_FOUND", "Q&A item not found"));

        if (req.question() != null) item.setQuestion(req.question().trim());
        if (req.answer() != null) item.setAnswer(req.answer().trim());
        if (req.category() != null) item.setCategory(req.category().trim().toUpperCase(Locale.ROOT));
        if (req.ownerId() != null) item.setOwnerId(req.ownerId());

        PitchQa saved = qaRepository.save(item);
        return toQaDto(saved);
    }

    /**
     * Deletes a Q&A item.
     */
    @Transactional
    public void deleteQa(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);
        PitchQa item = qaRepository.findById(id)
                .filter(q -> q.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("QA_NOT_FOUND", "Q&A item not found"));
        qaRepository.delete(item);
    }

    /**
     * Toggles the practiced flag for a Q&A item.
     */
    @Transactional
    public PitchDtos.QaItemDto togglePracticed(UUID roomId, UUID id, User user, PitchDtos.TogglePracticedRequest req) {
        roomAccess.requireMember(roomId, user);
        PitchQa item = qaRepository.findById(id)
                .filter(q -> q.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("QA_NOT_FOUND", "Q&A item not found"));

        boolean newState = req.practiced() != null ? req.practiced() : !item.isPracticed();
        item.setPracticed(newState);
        PitchQa saved = qaRepository.save(item);
        return toQaDto(saved);
    }

    /**
     * Proposes 6 challenging judge Q&A questions with model answers using AI.
     */
    @Transactional(readOnly = true)
    public PitchDtos.GenerateQaResponse generateQa(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        String prd = getDocContent(roomId, "PRD.md");
        String tech = getDocContent(roomId, "TECH_STACK.md");
        List<BriefRubricItem> rubrics = briefRepository.findByRoomId(roomId)
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        String rubricSummary = rubrics.stream().map(r -> r.getCriterion() + " (weight: " + r.getWeight() + ")").toList().toString();

        String prompt = "You are a seasoned hackathon judge and venture mentor.\n" +
                "Project PRD:\n" + prd + "\n\n" +
                "Tech Stack:\n" + tech + "\n\n" +
                "Judging Rubric:\n" + rubricSummary + "\n\n" +
                "Propose 6 incisive, challenging judge questions and concise winning answers.\n" +
                "Return ONLY a JSON array of objects with keys: \"question\", \"answer\", and \"category\" (one of: PRODUCT, TECH, IMPACT, TEAM, PROCESS).\n" +
                "Example format: [{\"question\": \"...\", \"answer\": \"...\", \"category\": \"TECH\"}]";

        String json = aiService.complete(user.getId(), prompt);
        List<PitchDtos.GeneratedQaProposalDto> proposals = new ArrayList<>();
        if (json != null && !json.isBlank()) {
            try {
                String cleaned = extractJsonArray(json);
                proposals = objectMapper.readValue(cleaned, new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        if (proposals.isEmpty()) {
            proposals = List.of(
                    new PitchDtos.GeneratedQaProposalDto("What was the hardest technical bug you solved this weekend?", "We had synchronization latency on our realtime updates which we mitigated with local optimistic updates.", "TECH"),
                    new PitchDtos.GeneratedQaProposalDto("How will you acquire your first 50 pilot users next week?", "We partnered with our campus department head to test directly in Monday classes.", "IMPACT")
            );
        }

        return new PitchDtos.GenerateQaResponse(proposals);
    }

    /**
     * Adds a code defense drill item.
     */
    @Transactional
    public PitchDtos.CodeDefenseDto createCodeDefense(UUID roomId, User user, PitchDtos.CreateCodeDefenseRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req.module() == null || req.module().isBlank()) {
            throw new BadRequestException("INVALID_MODULE", "Module name cannot be empty");
        }

        CodeDefenseDrill drill = new CodeDefenseDrill(
                roomId,
                req.module().trim(),
                req.question() != null ? req.question().trim() : "Explain how this component is structured and why.",
                req.ownerId() != null ? req.ownerId() : user.getId(),
                null
        );
        CodeDefenseDrill saved = drillRepository.save(drill);
        return toDrillDto(saved);
    }

    /**
     * Deletes a code defense drill.
     */
    @Transactional
    public void deleteCodeDefense(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);
        CodeDefenseDrill drill = drillRepository.findById(id)
                .filter(d -> d.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("DRILL_NOT_FOUND", "Code defense drill not found"));
        drillRepository.delete(drill);
    }

    /**
     * Toggles whether a code defense drill has been practiced.
     */
    @Transactional
    public PitchDtos.CodeDefenseDto toggleDefensePracticed(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);
        CodeDefenseDrill drill = drillRepository.findById(id)
                .filter(d -> d.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("DRILL_NOT_FOUND", "Code defense drill not found"));

        if (drill.getPracticedAt() == null) {
            drill.setPracticedAt(Instant.now());
        } else {
            drill.setPracticedAt(null);
        }
        CodeDefenseDrill saved = drillRepository.save(drill);
        return toDrillDto(saved);
    }

    private PitchDtos.QaItemDto toQaDto(PitchQa q) {
        PitchDtos.UserSummaryDto ownerSummary = q.getOwnerId() != null
                ? userRepository.findById(q.getOwnerId())
                    .map(u -> new PitchDtos.UserSummaryDto(u.getId(), u.getName(), u.getAvatarUrl()))
                    .orElse(null)
                : null;

        return new PitchDtos.QaItemDto(
                q.getId(),
                q.getQuestion(),
                q.getQuestion(),
                q.getAnswer(),
                q.getCategory(),
                q.getSource(),
                q.isPracticed(),
                q.isPracticed() ? "answered" : "needs_work",
                ownerSummary
        );
    }

    private PitchDtos.CodeDefenseDto toDrillDto(CodeDefenseDrill d) {
        PitchDtos.UserSummaryDto ownerSummary = d.getOwnerId() != null
                ? userRepository.findById(d.getOwnerId())
                    .map(u -> new PitchDtos.UserSummaryDto(u.getId(), u.getName(), u.getAvatarUrl()))
                    .orElse(null)
                : null;

        return new PitchDtos.CodeDefenseDto(
                d.getId(),
                d.getModule(),
                d.getQuestion(),
                ownerSummary,
                d.getPracticedAt()
        );
    }

    private String getDocContent(UUID roomId, String fileName) {
        return docRepository.findByRoomIdAndFileName(roomId, fileName)
                .flatMap(d -> docVersionRepository.findByDocIdAndVersion(d.getId(), d.getCurrentVersion()))
                .map(DocVersion::getContent)
                .orElse("");
    }

    private String extractJsonArray(String text) {
        int start = text.indexOf('[');
        int end = text.lastIndexOf(']');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
