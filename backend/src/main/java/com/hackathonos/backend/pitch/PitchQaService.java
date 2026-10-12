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
        if (req.whyAsked() != null) item.setWhyAsked(req.whyAsked());
        if (req.riskPoint() != null) item.setRiskPoint(req.riskPoint());
        if (req.difficulty() != null) item.setDifficulty(Math.max(1, Math.min(3, req.difficulty())));

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
        if (req.whyAsked() != null) item.setWhyAsked(req.whyAsked());
        if (req.riskPoint() != null) item.setRiskPoint(req.riskPoint());
        if (req.difficulty() != null) item.setDifficulty(Math.max(1, Math.min(3, req.difficulty())));

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
     * Generates rich Q&A defense questions using project context and level, saves as GENERATED, ensures required questions.
     */
    @Transactional
    public List<PitchDtos.QaItemDto> generateQa(UUID roomId, User user, PitchDtos.GenerateQaRequest req) {
        roomAccess.requireMember(roomId, user);

        String level = (req != null && req.level() != null && !req.level().isBlank()) ? req.level().toLowerCase() : "mixed";
        int targetCount = (req != null && req.count() != null && req.count() >= 8 && req.count() <= 16) ? req.count() : 10;

        String prd = getDocContent(roomId, "PRD.md");
        String tech = getDocContent(roomId, "TECH_STACK.md");
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String briefText = brief != null ? brief.getRawText() : "";
        List<BriefRubricItem> rubrics = brief != null
                ? rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId())
                : Collections.emptyList();
        String rubricSummary = rubrics.stream().map(r -> r.getCriterion() + " (weight: " + r.getWeight() + ")").toList().toString();

        String prompt = "You are a seasoned hackathon judge and venture mentor.\n" +
                "Hackathon Project Context:\n" +
                "Brief: " + (briefText.length() > 2000 ? briefText.substring(0, 2000) : briefText) + "\n" +
                "PRD: " + (prd.length() > 2000 ? prd.substring(0, 2000) : prd) + "\n" +
                "Tech Stack: " + (tech.length() > 1000 ? tech.substring(0, 1000) : tech) + "\n" +
                "Rubric: " + rubricSummary + "\n\n" +
                "Grill Level: " + level + " (friendly = constructive; mixed = realistic competition; grill = tough, adversarial probing edge cases and failures).\n" +
                "Generate exactly " + targetCount + " judge questions with counter answers, rationale, risk points, category (one of: PRODUCT, TECH, IMPACT, TEAM, RISK), and difficulty (1 to 3).\n" +
                "Return ONLY a JSON array of objects with keys: \"question\", \"whyAsked\", \"riskPoint\", \"counterAnswer\", \"category\", \"difficulty\".";

        String json = aiService.complete(user.getId(), prompt);
        List<Map<String, Object>> parsed = new ArrayList<>();
        if (json != null && !json.isBlank()) {
            try {
                String cleaned = extractJsonArray(json);
                parsed = objectMapper.readValue(cleaned, new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        // Delete previous GENERATED questions that are not practiced
        qaRepository.deleteByRoomIdAndSourceAndPracticedFalse(roomId, "GENERATED");

        List<PitchQa> current = qaRepository.findByRoomIdOrderByPositionAsc(roomId);
        int pos = current.size();

        // Save new generated questions
        List<PitchQa> toSave = new ArrayList<>();
        for (Map<String, Object> map : parsed) {
            String question = String.valueOf(map.getOrDefault("question", "")).trim();
            if (question.isBlank()) continue;
            String whyAsked = String.valueOf(map.getOrDefault("whyAsked", ""));
            String riskPoint = String.valueOf(map.getOrDefault("riskPoint", ""));
            String answer = String.valueOf(map.getOrDefault("counterAnswer", map.getOrDefault("answer", "")));
            String category = String.valueOf(map.getOrDefault("category", "PRODUCT")).toUpperCase(Locale.ROOT);
            int difficulty = 1;
            Object diffObj = map.get("difficulty");
            if (diffObj instanceof Number n) {
                difficulty = Math.max(1, Math.min(3, n.intValue()));
            }

            PitchQa q = new PitchQa(roomId, pos++, question, answer, category, "GENERATED", false, null);
            q.setWhyAsked(whyAsked);
            q.setRiskPoint(riskPoint);
            q.setDifficulty(difficulty);
            toSave.add(q);
        }

        // Always include the three required questions if not already present
        for (String reqQ : REQUIRED_QUESTIONS) {
            boolean present = current.stream().anyMatch(q -> q.getQuestion().equalsIgnoreCase(reqQ))
                    || toSave.stream().anyMatch(q -> q.getQuestion().equalsIgnoreCase(reqQ));
            if (!present) {
                PitchQa reqItem = new PitchQa(roomId, pos++, reqQ, "Prepare a clear and convincing response.", "PRODUCT", "GENERATED", false, null);
                reqItem.setWhyAsked("Judges assess basic clarity and risk awareness.");
                reqItem.setRiskPoint("Failing to state what was built and what breaks signals lack of engineering depth.");
                reqItem.setDifficulty(2);
                toSave.add(reqItem);
            }
        }

        if (!toSave.isEmpty()) {
            qaRepository.saveAll(toSave);
        }
        return qaRepository.findByRoomIdOrderByPositionAsc(roomId).stream().map(this::toQaDto).toList();
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
                ownerSummary,
                q.getWhyAsked(),
                q.getRiskPoint(),
                q.getDifficulty()
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
