package com.hackathonos.backend.brief;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.dto.*;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.users.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.time.Instant;
import java.util.*;

/**
 * Manages hackathon brief lifecycle including intake, validation, AI structuring, and confirmation.
 */
@Service
public class BriefService {

    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final UploadedFileRepository uploadedFileRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final SsrfGuard ssrfGuard;
    private final BriefPdfParser pdfParser;
    private final BriefMapper briefMapper;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    public BriefService(
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            UploadedFileRepository uploadedFileRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            RoomStageService stageService,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            SsrfGuard ssrfGuard,
            BriefPdfParser pdfParser,
            BriefMapper briefMapper,
            AiService aiService,
            ObjectMapper objectMapper) {
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.uploadedFileRepository = uploadedFileRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.ssrfGuard = ssrfGuard;
        this.pdfParser = pdfParser;
        this.briefMapper = briefMapper;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieves the room brief, returning empty default metadata if none has been created yet.
     */
    @Transactional(readOnly = true)
    public BriefResponseDto getBrief(UUID roomId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());

        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        if (briefOpt.isEmpty()) {
            Brief emptyBrief = new Brief(roomId, "manual");
            return briefMapper.toDto(emptyBrief, Collections.emptyList(), isLeader, isLeader);
        }

        Brief brief = briefOpt.get();
        List<BriefRubricItem> rubricItems = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubricItems, isLeader, isLeader);
    }

    /**
     * Saves brief content and rubric items, enforcing whole percentage weights summing to 100.
     */
    @Transactional
    public BriefResponseDto saveBrief(UUID roomId, SaveBriefRequest req, User user) {
        RoomMember member = roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Brief cannot be modified once build phase has started");
        }

        BriefFieldsDto fields = req.fields();
        validateRubricSumIfPresent(fields != null ? fields.rubric() : null);

        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, req.source() != null ? req.source() : "manual"));
        boolean wasConfirmed = brief.isConfirmed();

        if (req.source() != null) brief.setSource(req.source());
        if (req.sourceUrl() != null) brief.setSourceUrl(req.sourceUrl());
        if (req.fileName() != null) brief.setFileName(req.fileName());
        if (req.rawText() != null) brief.setRawText(req.rawText());

        if (fields != null) {
            brief.setProblemStatement(fields.problemStatement());
            brief.setTargetAudience(fields.targetAudience());
            brief.setDeadlines(briefMapper.toJson(fields.deadlines()));
            brief.setEligibility(fields.eligibility());
            brief.setTechRules(fields.techRules());
            brief.setAiPolicy(fields.aiPolicy());
            brief.setJudgingFormat(fields.judgingFormat());
            brief.setDeliverables(briefMapper.toJson(fields.deliverables()));
            brief.setTracksAndPrizes(briefMapper.toJson(fields.tracksAndPrizes()));
            brief.setRisks(briefMapper.toJson(fields.risks()));
        } else if (req.risks() != null) {
            brief.setRisks(briefMapper.toJson(req.risks()));
        }

        if (req.confirmedFields() != null) {
            brief.setConfirmedFields(briefMapper.toJson(req.confirmedFields()));
        }

        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        // Update rubric items
        rubricRepository.deleteByBriefId(brief.getId());
        List<BriefRubricItem> savedRubric = new ArrayList<>();
        if (fields != null && fields.rubric() != null) {
            int pos = 0;
            for (RubricCriterionDto r : fields.rubric()) {
                BriefRubricItem item = new BriefRubricItem(brief.getId(), r.criterion(), r.weight(), pos++);
                savedRubric.add(rubricRepository.save(item));
            }
        }

        if (wasConfirmed) {
            activityLogger.log(room, user, "BRIEF_EDITED", "Brief edited");
        }

        return briefMapper.toDto(brief, savedRubric, true, true);
    }

    /**
     * Toggles the confirmed status of an individual brief field.
     */
    @Transactional
    public BriefResponseDto updateConfirmedField(UUID roomId, ConfirmedFieldRequest req, User user) {
        roomAccess.requireLeader(roomId, user);
        Brief brief = briefRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("BRIEF_NOT_FOUND", "Brief not found"));

        Map<String, Boolean> map = new HashMap<>(briefMapper.parseMap(brief.getConfirmedFields()));
        map.put(req.fieldName(), req.confirmed());
        brief.setConfirmedFields(briefMapper.toJson(map));
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Ingests a public URL source using SSRF-safe HTTP client and saves readable raw text.
     */
    @Transactional
    public BriefResponseDto setLinkSource(UUID roomId, String url, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null || room.isIdeateDone()) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once ideation or build has started");
        }

        String rawText = ssrfGuard.fetchReadableText(url);

        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, "link"));
        brief.setSource("link");
        brief.setSourceUrl(url);
        brief.setRawText(rawText);
        brief.setConfirmed(false);
        brief.setConfirmedFields(null);
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Ingests a PDF document up to 10MB, verifies %PDF bytes, extracts text via PDFBox, and saves file.
     */
    @Transactional
    public BriefResponseDto setPdfSource(UUID roomId, MultipartFile file, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null || room.isIdeateDone()) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once ideation or build has started");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BadRequestException("NOT_A_PDF", "Could not read uploaded file");
        }

        String rawText = pdfParser.extractText(bytes);

        // Store file on disk
        String randomName = UUID.randomUUID() + ".pdf";
        File roomUploadDir = new File(uploadDir, "rooms/" + roomId);
        if (!roomUploadDir.exists()) {
            roomUploadDir.mkdirs();
        }
        File targetFile = new File(roomUploadDir, randomName);
        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(bytes);
        } catch (Exception e) {
            throw new BadRequestException("UPLOAD_FAILED", "Failed to store PDF file");
        }

        UploadedFile uploadedFile = new UploadedFile(
                roomId,
                user.getId(),
                file.getOriginalFilename(),
                file.getContentType() != null ? file.getContentType() : "application/pdf",
                file.getSize(),
                targetFile.getAbsolutePath(),
                "brief"
        );
        uploadedFileRepository.save(uploadedFile);

        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, "pdf"));
        brief.setSource("pdf");
        brief.setFileName(file.getOriginalFilename());
        brief.setRawText(rawText);
        brief.setConfirmed(false);
        brief.setConfirmedFields(null);
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Returns the Prompt Bridge extraction prompt incorporating existing raw text.
     */
    @Transactional(readOnly = true)
    public ExtractionPromptResponse getExtractionPrompt(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String rawText = brief != null && brief.getRawText() != null ? brief.getRawText() : "";

        String prompt = "You are reading a hackathon announcement. From the text below, extract the details and reply ONLY with valid JSON with these keys: problemStatement (string), targetAudience (string), rubric (array of {criterion, weight} with weights summing to 100), deadlines ({start, freeze, submission} ISO strings or null), eligibility (string), techRules (string), aiPolicy (string), deliverables (array of strings), tracksAndPrizes (array of strings), judgingFormat (string). Use null when the text does not say. Text: " + rawText;
        return new ExtractionPromptResponse(prompt);
    }

    /**
     * Tolerantly parses JSON extraction output, validates keys, and saves unconfirmed fields if valid.
     */
    @Transactional
    public ValidateExtractResponse validateExtractedJson(UUID roomId, String jsonText, User user) {
        roomAccess.requireLeader(roomId, user);
        Brief brief = briefRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("BRIEF_NOT_FOUND", "Brief not found"));

        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (jsonText == null || jsonText.isBlank()) {
            errors.add("JSON payload is empty");
            return new ValidateExtractResponse(false, errors, warnings, null, null);
        }

        String cleaned = cleanJsonText(jsonText);
        JsonNode root;
        try {
            root = objectMapper.readTree(cleaned);
        } catch (Exception e) {
            errors.add("Invalid JSON syntax: " + e.getMessage());
            return new ValidateExtractResponse(false, errors, warnings, null, null);
        }

        String[] requiredKeys = {"problemStatement", "targetAudience", "rubric", "deadlines"};
        for (String key : requiredKeys) {
            if (!root.has(key)) {
                errors.add("Missing required key: " + key);
            }
        }

        List<RubricCriterionDto> rubric = new ArrayList<>();
        if (root.has("rubric") && root.get("rubric").isArray()) {
            int totalWeight = 0;
            for (JsonNode item : root.get("rubric")) {
                String crit = item.has("criterion") ? item.get("criterion").asText() : "";
                int weight = item.has("weight") ? item.get("weight").asInt() : 0;
                rubric.add(new RubricCriterionDto(crit, weight));
                totalWeight += weight;
            }
            if (totalWeight != 100) {
                warnings.add("Rubric weights sum to " + totalWeight + ", they must add up to 100");
            }
        } else if (root.has("rubric")) {
            errors.add("Key 'rubric' must be an array of {criterion, weight}");
        }

        if (!errors.isEmpty()) {
            return new ValidateExtractResponse(false, errors, warnings, null, null);
        }

        JsonNode deadlinesNode = root.get("deadlines");
        DeadlinesDto deadlines = new DeadlinesDto(
                deadlinesNode != null && deadlinesNode.has("start") && !deadlinesNode.get("start").isNull() ? deadlinesNode.get("start").asText() : null,
                deadlinesNode != null && deadlinesNode.has("freeze") && !deadlinesNode.get("freeze").isNull() ? deadlinesNode.get("freeze").asText() : null,
                deadlinesNode != null && deadlinesNode.has("submission") && !deadlinesNode.get("submission").isNull() ? deadlinesNode.get("submission").asText() : null
        );

        BriefFieldsDto fields = new BriefFieldsDto(
                root.has("problemStatement") && !root.get("problemStatement").isNull() ? root.get("problemStatement").asText() : "",
                root.has("targetAudience") && !root.get("targetAudience").isNull() ? root.get("targetAudience").asText() : "",
                rubric,
                deadlines,
                root.has("eligibility") && !root.get("eligibility").isNull() ? root.get("eligibility").asText() : "",
                root.has("techRules") && !root.get("techRules").isNull() ? root.get("techRules").asText() : "",
                root.has("aiPolicy") && !root.get("aiPolicy").isNull() ? root.get("aiPolicy").asText() : "",
                jsonListToStringList(root.get("deliverables")),
                jsonListToStringList(root.get("tracksAndPrizes")),
                root.has("judgingFormat") && !root.get("judgingFormat").isNull() ? root.get("judgingFormat").asText() : "",
                jsonListToStringList(root.get("risks"))
        );

        // Save fields unconfirmed
        brief.setProblemStatement(fields.problemStatement());
        brief.setTargetAudience(fields.targetAudience());
        brief.setDeadlines(briefMapper.toJson(fields.deadlines()));
        brief.setEligibility(fields.eligibility());
        brief.setTechRules(fields.techRules());
        brief.setAiPolicy(fields.aiPolicy());
        brief.setJudgingFormat(fields.judgingFormat());
        brief.setDeliverables(briefMapper.toJson(fields.deliverables()));
        brief.setTracksAndPrizes(briefMapper.toJson(fields.tracksAndPrizes()));
        brief.setRisks(briefMapper.toJson(fields.risks()));
        brief.setConfirmed(false);
        brief.setConfirmedFields(null);
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        rubricRepository.deleteByBriefId(brief.getId());
        List<BriefRubricItem> savedRubric = new ArrayList<>();
        int pos = 0;
        for (RubricCriterionDto r : rubric) {
            savedRubric.add(rubricRepository.save(new BriefRubricItem(brief.getId(), r.criterion(), r.weight(), pos++)));
        }

        BriefResponseDto briefDto = briefMapper.toDto(brief, savedRubric, true, true);
        return new ValidateExtractResponse(true, errors, warnings, fields, briefDto);
    }

    /**
     * Performs automated AI extraction using user's saved API key and parses structured brief fields.
     */
    @Transactional
    public ValidateExtractResponse autoExtract(UUID roomId, User user) {
        ExtractionPromptResponse promptResp = getExtractionPrompt(roomId, user);
        String completion = aiService.complete(user.getId(), promptResp.prompt());
        return validateExtractedJson(roomId, completion, user);
    }

    /**
     * Confirms the brief, verifying completeness and rubric balance, advancing room stage.
     */
    @Transactional
    public BriefResponseDto confirmBrief(UUID roomId, ConfirmBriefRequest req, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Brief brief = briefRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("BRIEF_NOT_FOUND", "Brief not found"));
        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());

        List<String> unconfirmedOrMissing = new ArrayList<>();
        if (brief.getProblemStatement() == null || brief.getProblemStatement().isBlank()) {
            unconfirmedOrMissing.add("problemStatement");
        }

        Map<String, Boolean> confirmedFields = briefMapper.parseMap(brief.getConfirmedFields());

        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "problemStatement", brief.getProblemStatement());
        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "targetAudience", brief.getTargetAudience());
        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "eligibility", brief.getEligibility());
        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "techRules", brief.getTechRules());
        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "aiPolicy", brief.getAiPolicy());
        checkFieldConfirmed(unconfirmedOrMissing, confirmedFields, "judgingFormat", brief.getJudgingFormat());

        if (brief.getDeadlines() != null && !brief.getDeadlines().isBlank()) {
            DeadlinesDto dl = briefMapper.parseDeadlines(brief.getDeadlines());
            if (dl.start() != null || dl.submission() != null) {
                if (!Boolean.TRUE.equals(confirmedFields.get("deadlines"))) {
                    unconfirmedOrMissing.add("deadlines");
                }
            }
        }

        if (brief.getDeliverables() != null && !briefMapper.parseStringList(brief.getDeliverables()).isEmpty()) {
            if (!Boolean.TRUE.equals(confirmedFields.get("deliverables"))) {
                unconfirmedOrMissing.add("deliverables");
            }
        }

        if (!rubric.isEmpty()) {
            if (!Boolean.TRUE.equals(confirmedFields.get("rubric"))) {
                unconfirmedOrMissing.add("rubric");
            }
            int totalWeight = rubric.stream().mapToInt(BriefRubricItem::getWeight).sum();
            if (totalWeight != 100) {
                unconfirmedOrMissing.add("rubric_sum_not_100");
            }
        }

        if (!unconfirmedOrMissing.isEmpty()) {
            throw new BadRequestException("BRIEF_INCOMPLETE", "Brief is incomplete or contains unconfirmed fields", unconfirmedOrMissing);
        }

        brief.setConfirmed(true);
        brief.setConfirmedAt(Instant.now());
        brief.setConfirmedBy(user.getId());
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        room.setBriefDone(true);
        stageService.recompute(room);

        if (req != null && req.applyDatesToRoom() && brief.getDeadlines() != null) {
            DeadlinesDto dl = briefMapper.parseDeadlines(brief.getDeadlines());
            try {
                if (dl.start() != null) room.setEventStart(Instant.parse(dl.start()));
                if (dl.submission() != null) room.setEventEnd(Instant.parse(dl.submission()));
            } catch (Exception ignored) {}
        }
        roomRepository.save(room);

        activityLogger.log(room, user, "BRIEF_CONFIRMED", "Brief confirmed");
        notificationService.notifyRoomMembers(room, null, NotificationType.BRIEF_CONFIRMED,
                "Brief confirmed", "Hackathon brief confirmed! The team can start ideating.");

        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Resets and deletes the room brief so a new source can be added.
     */
    @Transactional
    public void deleteBrief(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.isIdeateDone() || room.getBuildStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot reset brief once ideation or build phase has started");
        }

        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        if (briefOpt.isPresent()) {
            rubricRepository.deleteByBriefId(briefOpt.get().getId());
            briefRepository.delete(briefOpt.get());
        }

        room.setBriefDone(false);
        stageService.recompute(room);
        roomRepository.save(room);
        activityLogger.log(room, user, "BRIEF_RESET", "Brief reset");
    }

    private void checkFieldConfirmed(List<String> missing, Map<String, Boolean> confirmed, String fieldName, String value) {
        if (value != null && !value.isBlank()) {
            if (!Boolean.TRUE.equals(confirmed.get(fieldName))) {
                missing.add(fieldName);
            }
        }
    }

    private void validateRubricSumIfPresent(List<RubricCriterionDto> rubric) {
        if (rubric == null || rubric.isEmpty()) {
            return;
        }
        int sum = 0;
        for (RubricCriterionDto r : rubric) {
            if (r.weight() < 0 || r.weight() > 100) {
                throw new BadRequestException("INVALID_RUBRIC", "Rubric weights must be between 0 and 100");
            }
            sum += r.weight();
        }
        if (sum != 100) {
            throw new BadRequestException("INVALID_RUBRIC",
                    "rubric: weights add up to " + sum + ", they must add up to 100",
                    Map.of("rubric", "weights add up to " + sum + ", they must add up to 100"));
        }
    }

    private String cleanJsonText(String raw) {
        String text = raw.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
        return text.trim();
    }

    private List<String> jsonListToStringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return Collections.emptyList();
        }
        List<String> list = new ArrayList<>();
        for (JsonNode item : node) {
            list.add(item.asText());
        }
        return list;
    }
}
