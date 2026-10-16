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

import com.hackathonos.backend.files.FileTextExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Manages hackathon brief lifecycle including intake, validation, AI structuring, and confirmation.
 */
@Service
public class BriefService {

    private static final Logger log = LoggerFactory.getLogger(BriefService.class);

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
    private final FileTextExtractor fileTextExtractor;
    private final BriefMapper briefMapper;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hackathonos.backend.admin.AppSettingsService appSettingsService;

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
            FileTextExtractor fileTextExtractor,
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
        this.fileTextExtractor = fileTextExtractor;
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
            brief.setProblemStatement(fields.problemStatement() != null ? fields.problemStatement() : "");
            brief.setTargetAudience(fields.targetAudience() != null ? fields.targetAudience() : "");
            brief.setDeadlines(briefMapper.toJson(fields.deadlines()));
            brief.setEligibility(fields.eligibility() != null ? fields.eligibility() : "");
            brief.setTechRules(fields.techRules() != null ? fields.techRules() : "");
            brief.setAiPolicy(fields.aiPolicy() != null ? fields.aiPolicy() : "");
            brief.setJudgingFormat(fields.judgingFormat() != null ? fields.judgingFormat() : "");
            brief.setDeliverables(briefMapper.toJson(fields.deliverables() != null ? fields.deliverables() : Collections.emptyList()));
            brief.setTracksAndPrizes(briefMapper.toJson(fields.tracksAndPrizes() != null ? fields.tracksAndPrizes() : Collections.emptyList()));
            brief.setRisks(briefMapper.toJson(fields.risks() != null ? fields.risks() : Collections.emptyList()));
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
        if (room.getBuildStartedAt() != null || room.getPlanStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once planning or build has started");
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
     * Ingests a document (.pdf, .docx, .md, or .txt), extracts text via FileTextExtractor, and saves file.
     */
    @Transactional
    public BriefResponseDto setPdfSource(UUID roomId, MultipartFile file, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once build phase has started");
        }

        if (appSettingsService != null && file != null) {
            appSettingsService.checkUploadQuota(user.getId(), file.getSize());
        }

        FileTextExtractor.ExtractionResult extractedResult = fileTextExtractor.extractText(file);
        String rawText = extractedResult.text();

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            bytes = rawText.getBytes(StandardCharsets.UTF_8);
        }

        String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
        String lowerName = origName.toLowerCase();

        // Store file on disk
        String randomName = UUID.randomUUID() + "_" + origName;
        File roomUploadDir = new File(uploadDir, "rooms/" + roomId);
        if (!roomUploadDir.exists()) {
            roomUploadDir.mkdirs();
        }
        File targetFile = new File(roomUploadDir, randomName);
        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(bytes);
        } catch (Exception e) {
            throw new BadRequestException("UPLOAD_FAILED", "Failed to store uploaded file");
        }

        UploadedFile uploadedFile = new UploadedFile(
                roomId,
                user.getId(),
                origName,
                file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                file.getSize(),
                targetFile.getAbsolutePath(),
                "brief"
        );
        uploadedFileRepository.save(uploadedFile);

        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, lowerName.endsWith(".pdf") ? "pdf" : "file"));
        brief.setSource(lowerName.endsWith(".pdf") ? "pdf" : "file");
        brief.setFileName(origName);
        brief.setRawText(rawText);
        brief.setConfirmed(false);
        brief.setConfirmedFields(null);
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Unified file intake: extracts text from PDF, DOCX, or text/markdown using FileTextExtractor.
     * Updates Brief rawText when executed by a leader, and optionally runs AI extraction if requested and allowed.
     */
    @Transactional
    public FileIntakeResponse intakeFile(UUID roomId, MultipartFile file, boolean extract, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        boolean isLeader = roomAccess.isLeader(roomId, user.getId());

        if (appSettingsService != null && file != null) {
            appSettingsService.checkUploadQuota(user.getId(), file.getSize());
        }

        FileTextExtractor.ExtractionResult extracted = fileTextExtractor.extractText(file);
        String fullText = extracted.text();
        int chars = fullText.length();
        int pages = extracted.pages();
        boolean truncated = extracted.truncated();
        List<String> warnings = new ArrayList<>(extracted.warnings());

        boolean saved = false;
        BriefResponseDto briefDto = null;
        BriefFieldsDto fields = null;

        if (isLeader && room.getBuildStartedAt() == null) {
            String origName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, "file"));
            brief.setSource("file");
            brief.setFileName(origName);
            brief.setRawText(fullText);
            brief.setConfirmed(false);
            brief.setConfirmedFields(null);
            brief.setUpdatedAt(Instant.now());
            brief = briefRepository.save(brief);
            saved = true;

            // Save on disk as well
            try {
                byte[] bytes = file.getBytes();
                String randomName = UUID.randomUUID() + "_" + origName;
                File roomUploadDir = new File(uploadDir, "rooms/" + roomId);
                if (!roomUploadDir.exists()) {
                    roomUploadDir.mkdirs();
                }
                File targetFile = new File(roomUploadDir, randomName);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(bytes);
                }
                UploadedFile uploadedFile = new UploadedFile(
                        roomId,
                        user.getId(),
                        origName,
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                        file.getSize(),
                        targetFile.getAbsolutePath(),
                        "brief"
                );
                uploadedFileRepository.save(uploadedFile);
            } catch (Exception ignored) {}

            List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
            briefDto = briefMapper.toDto(brief, rubric, true, true);
        }

        boolean aiAllowed = isAiAllowed(roomId);
        if (extract && aiAllowed) {
            try {
                String toExtract = fullText.length() > 20000 ? fullText.substring(0, 20000) : fullText;
                ExtractBriefResponseDto aiResult = extractBrief(roomId, toExtract, user);
                fields = aiResult.fields();
                if (aiResult.brief() != null) {
                    briefDto = aiResult.brief();
                }
            } catch (Exception ex) {
                log.warn("Brief AI extraction failed during intake: {}", ex.getMessage());
                warnings.add("AI extraction could not be completed: " + ex.getMessage());
            }
        }

        String preview = fullText.length() > 1500 ? fullText.substring(0, 1500) : fullText;
        return new FileIntakeResponse(preview, chars, pages, truncated, warnings, saved, fields, briefDto);
    }

    public boolean isAiAllowed(UUID roomId) {
        if (roomId == null) return true;
        return briefRepository.findByRoomId(roomId).map(b -> {
            String p = b.getAiPolicy();
            if (p == null || p.isBlank()) return true;
            String up = p.toUpperCase();
            return !(up.contains("FORBIDDEN") || up.contains("RESTRICTED") || up.contains("PROHIBITED") || up.contains("NO_AI"));
        }).orElse(true);
    }

    /**
     * Ingests up to 5 images (PNG, JPG, JPEG, WEBP) up to 10MB each, calls vision AI to extract text, and saves files.
     */
    @Transactional
    public BriefResponseDto setImagesSource(UUID roomId, List<MultipartFile> files, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null || room.getPlanStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once planning or build has started");
        }

        if (files == null || files.isEmpty()) {
            throw new BadRequestException("INVALID_FILES", "Please upload at least one image");
        }
        if (files.size() > 5) {
            throw new BadRequestException("TOO_MANY_FILES", "Cannot upload more than 5 images");
        }

        if (appSettingsService != null) {
            long totalSize = files.stream().mapToLong(MultipartFile::getSize).sum();
            appSettingsService.checkUploadQuota(user.getId(), totalSize);
        }

        List<String> allowedTypes = List.of("image/png", "image/jpeg", "image/jpg", "image/webp");
        long maxSizeBytes = 10 * 1024 * 1024; // 10MB
        StringBuilder combinedText = new StringBuilder();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String contentType = file.getContentType();
            if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
                throw new BadRequestException("INVALID_FILE_TYPE", "Only PNG, JPG, JPEG, and WEBP images are supported");
            }
            if (file.getSize() > maxSizeBytes) {
                throw new BadRequestException("FILE_TOO_LARGE", "Each image must be at most 10MB");
            }

            byte[] bytes;
            try {
                bytes = file.getBytes();
            } catch (Exception e) {
                throw new BadRequestException("READ_FAILED", "Failed to read uploaded image");
            }

            String extracted = aiService.completeImage(
                    user.getId(),
                    "Extract all text from this image in reading order as plain text.",
                    contentType,
                    bytes
            );
            if (extracted != null && !extracted.isBlank()) {
                if (!combinedText.isEmpty()) combinedText.append("\n\n");
                combinedText.append(extracted.trim());
            }

            String randomName = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "image");
            File roomUploadDir = new File(uploadDir, "rooms/" + roomId);
            if (!roomUploadDir.exists()) {
                roomUploadDir.mkdirs();
            }
            File targetFile = new File(roomUploadDir, randomName);
            try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                fos.write(bytes);
            } catch (Exception ignored) {}

            UploadedFile uploadedFile = new UploadedFile(
                    roomId,
                    user.getId(),
                    file.getOriginalFilename(),
                    contentType,
                    file.getSize(),
                    targetFile.getAbsolutePath(),
                    "brief"
            );
            uploadedFileRepository.save(uploadedFile);
        }

        String rawText = combinedText.toString();
        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, "image"));
        brief.setSource("image");
        brief.setFileName(files.size() == 1 ? files.get(0).getOriginalFilename() : files.size() + " images");
        brief.setRawText(rawText);
        brief.setConfirmed(false);
        brief.setConfirmedFields(null);
        brief.setUpdatedAt(Instant.now());
        brief = briefRepository.save(brief);

        List<BriefRubricItem> rubric = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
        return briefMapper.toDto(brief, rubric, true, true);
    }

    /**
     * Ingests manual text source (50 to 200,000 chars) as raw_text with source "manual".
     */
    @Transactional
    public BriefResponseDto setTextSource(UUID roomId, String text, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("BRIEF_LOCKED", "Cannot modify brief source once build phase has started");
        }
        if (text == null || text.trim().length() < 50 || text.trim().length() > 200000) {
            throw new BadRequestException("INVALID_TEXT", "Text must be between 50 and 200000 characters");
        }

        Brief brief = briefRepository.findByRoomId(roomId).orElseGet(() -> new Brief(roomId, "manual"));
        brief.setSource("manual");
        brief.setRawText(text.trim());
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
        if (rawText.length() > 12000) {
            rawText = rawText.substring(0, 12000);
        }

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
     * Extracts structured brief parameters using AI gateway from raw pasted event details.
     */
    @Transactional
    public ExtractBriefResponseDto extractBrief(UUID roomId, String text, User user) {
        roomAccess.requireMember(roomId, user);
        boolean isLeader = roomAccess.isLeader(roomId, user.getId());

        if (text == null || text.isBlank()) {
            throw new BadRequestException("INVALID_TEXT", "Text cannot be empty");
        }
        if (text.length() > 20000) {
            throw new BadRequestException("TEXT_TOO_LONG", "Text exceeds maximum 20,000 characters");
        }

        // Strip HTML
        String stripped = text.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        if (stripped.length() > 20000) {
            stripped = stripped.substring(0, 20000);
        }

        String systemPrompt = """
                You are an expert hackathon brief extractor.
                From the provided announcement text, extract the exact hackathon parameters into valid JSON with these keys:
                - "problemStatement": string or null
                - "targetAudience": string or null
                - "rubric": array of { "name": string, "weight": number } where weights sum to 100 (normalise if needed)
                - "deadlines": array of { "label": string, "dateTime": string or null }
                - "rules": array of strings
                - "allowedTech": string or array of strings or null
                - "forbiddenTech": string or array of strings or null
                - "aiUsePolicy": "ALLOWED" | "RESTRICTED" | "FORBIDDEN" | "UNKNOWN"
                - "deliverables": array of strings
                - "tracks": array of strings
                - "judgingFormat": string or null

                Use null or empty arrays for anything not stated. Never invent values. Return ONLY valid JSON.
                """;

        ExtractBriefAiResult aiResult = aiService.json(
                "brief.extract",
                roomId,
                user.getId(),
                systemPrompt,
                stripped,
                ExtractBriefAiResult.class
        );

        // Normalize rubric weights to sum to 100
        List<RubricCriterionDto> rubric = new ArrayList<>();
        if (aiResult.rubric() != null && !aiResult.rubric().isEmpty()) {
            int totalWeight = 0;
            for (ExtractBriefAiResult.RubricItem item : aiResult.rubric()) {
                String crit = item.name() != null ? item.name() : (item.criterion() != null ? item.criterion() : "");
                int w = item.weight() != null ? Math.max(0, item.weight()) : 0;
                totalWeight += w;
                rubric.add(new RubricCriterionDto(crit, w));
            }
            if (totalWeight > 0 && totalWeight != 100) {
                List<RubricCriterionDto> normalized = new ArrayList<>();
                int currentSum = 0;
                for (int i = 0; i < rubric.size(); i++) {
                    var r = rubric.get(i);
                    if (i == rubric.size() - 1) {
                        normalized.add(new RubricCriterionDto(r.criterion(), Math.max(0, 100 - currentSum)));
                    } else {
                        int scaledW = (int) Math.round((r.weight() * 100.0) / totalWeight);
                        currentSum += scaledW;
                        normalized.add(new RubricCriterionDto(r.criterion(), scaledW));
                    }
                }
                rubric = normalized;
            }
        }

        // Map deadlines
        String start = null;
        String freeze = null;
        String submission = null;
        if (aiResult.deadlines() != null) {
            for (ExtractBriefAiResult.DeadlineItem dl : aiResult.deadlines()) {
                if (dl.dateTime() == null) continue;
                String lbl = dl.label() != null ? dl.label().toLowerCase() : "";
                if (start == null && (lbl.contains("start") || lbl.contains("kickoff") || lbl.contains("begin"))) {
                    start = dl.dateTime();
                } else if (freeze == null && lbl.contains("freeze")) {
                    freeze = dl.dateTime();
                } else if (submission == null && (lbl.contains("submit") || lbl.contains("end") || lbl.contains("deadline") || lbl.contains("due"))) {
                    submission = dl.dateTime();
                }
            }
        }
        DeadlinesDto deadlinesDto = new DeadlinesDto(start, freeze, submission);

        // Format rules/eligibility & techRules
        String eligibility = aiResult.rules() != null ? String.join("\n", aiResult.rules()) : "";
        StringBuilder trBuilder = new StringBuilder();
        if (aiResult.allowedTech() != null) {
            trBuilder.append("Allowed Tech: ").append(aiResult.allowedTech().toString()).append("\n");
        }
        if (aiResult.forbiddenTech() != null) {
            trBuilder.append("Forbidden Tech: ").append(aiResult.forbiddenTech().toString());
        }
        String techRules = trBuilder.toString().trim();

        String aiPolicy = aiResult.aiUsePolicy() != null ? aiResult.aiUsePolicy().trim().toUpperCase() : "UNKNOWN";
        if (!List.of("ALLOWED", "RESTRICTED", "FORBIDDEN", "UNKNOWN").contains(aiPolicy)) {
            aiPolicy = "UNKNOWN";
        }

        BriefFieldsDto fields = new BriefFieldsDto(
                aiResult.problemStatement() != null ? aiResult.problemStatement() : "",
                aiResult.targetAudience() != null ? aiResult.targetAudience() : "",
                rubric,
                deadlinesDto,
                eligibility,
                techRules,
                aiPolicy,
                aiResult.deliverables() != null ? aiResult.deliverables() : List.of(),
                aiResult.tracks() != null ? aiResult.tracks() : List.of(),
                aiResult.judgingFormat() != null ? aiResult.judgingFormat() : "",
                List.of()
        );

        BriefResponseDto briefDto = null;
        if (isLeader) {
            Brief brief = briefRepository.findByRoomId(roomId)
                    .orElseGet(() -> new Brief(roomId, "manual"));

            brief.setRawText(text); // Saved as Source Text card
            brief.setSource("manual");
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

            // Fill as unconfirmed - leader must confirm each one
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

            briefDto = briefMapper.toDto(brief, savedRubric, true, true);
        }

        return new ExtractBriefResponseDto(isLeader, fields, briefDto, 9);
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

        if (brief.getProblemStatement() == null || brief.getProblemStatement().isBlank()) {
            throw new BadRequestException("BRIEF_INCOMPLETE", "Add the problem statement to continue");
        }

        if (!rubric.isEmpty()) {
            int totalWeight = rubric.stream().mapToInt(BriefRubricItem::getWeight).sum();
            if (totalWeight != 100) {
                throw new BadRequestException("INVALID_RUBRIC", "Rubric weights must sum to 100% (currently " + totalWeight + "%)");
            }
        }

        Map<String, Boolean> confirmedMap = new HashMap<>();
        if (brief.getProblemStatement() != null && !brief.getProblemStatement().isBlank()) confirmedMap.put("problemStatement", true);
        if (brief.getTargetAudience() != null && !brief.getTargetAudience().isBlank()) confirmedMap.put("targetAudience", true);
        if (brief.getEligibility() != null && !brief.getEligibility().isBlank()) confirmedMap.put("eligibility", true);
        if (brief.getTechRules() != null && !brief.getTechRules().isBlank()) confirmedMap.put("techRules", true);
        if (brief.getAiPolicy() != null && !brief.getAiPolicy().isBlank()) confirmedMap.put("aiPolicy", true);
        if (brief.getJudgingFormat() != null && !brief.getJudgingFormat().isBlank()) confirmedMap.put("judgingFormat", true);
        if (brief.getDeadlines() != null && !brief.getDeadlines().isBlank()) confirmedMap.put("deadlines", true);
        if (brief.getDeliverables() != null && !briefMapper.parseStringList(brief.getDeliverables()).isEmpty()) confirmedMap.put("deliverables", true);
        if (brief.getTracksAndPrizes() != null && !briefMapper.parseStringList(brief.getTracksAndPrizes()).isEmpty()) confirmedMap.put("tracksAndPrizes", true);
        if (brief.getRisks() != null && !briefMapper.parseStringList(brief.getRisks()).isEmpty()) confirmedMap.put("risks", true);
        if (!rubric.isEmpty()) confirmedMap.put("rubric", true);
        brief.setConfirmedFields(briefMapper.toJson(confirmedMap));

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
