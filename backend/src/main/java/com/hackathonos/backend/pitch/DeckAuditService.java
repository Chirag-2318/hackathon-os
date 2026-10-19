package com.hackathonos.backend.pitch;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.files.FileTextExtractor;
import com.hackathonos.backend.pitch.DeckAuditDtos.*;
import com.hackathonos.backend.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeckAuditService {

    private static final Logger log = LoggerFactory.getLogger(DeckAuditService.class);

    private final DeckSlideRepository slideRepository;
    private final DeckAuditRepository auditRepository;
    private final FileTextExtractor fileTextExtractor;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RoomAccess roomAccess;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public DeckAuditService(
            DeckSlideRepository slideRepository,
            DeckAuditRepository auditRepository,
            FileTextExtractor fileTextExtractor,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            RoomAccess roomAccess,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.slideRepository = slideRepository;
        this.auditRepository = auditRepository;
        this.fileTextExtractor = fileTextExtractor;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.roomAccess = roomAccess;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DeckSlidesResponse saveSlidesFromUpload(UUID roomId, MultipartFile file, User user) {
        roomAccess.requireMember(roomId, user);
        List<FileTextExtractor.SlideTextEntry> extracted = fileTextExtractor.extractDeckSlides(file);
        if (extracted.isEmpty()) {
            throw new BadRequestException("FILE_NO_TEXT", "This deck has no readable text. Export a PDF with text, or paste the slide text.");
        }

        slideRepository.deleteByRoomId(roomId);
        for (FileTextExtractor.SlideTextEntry e : extracted) {
            slideRepository.save(new DeckSlide(roomId, e.pageNo(), e.title(), e.text(), e.chars()));
        }

        return getSlides(roomId, user);
    }

    @Transactional
    public DeckSlidesResponse saveSlidesFromText(UUID roomId, String rawText, User user) {
        roomAccess.requireMember(roomId, user);
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("INVALID_INPUT", "Please paste slide text separated by ---");
        }

        String[] chunks = rawText.split("(?m)^\\s*---\\s*$");
        List<DeckSlide> slides = new ArrayList<>();
        int pageNo = 1;
        for (String chunk : chunks) {
            String trimmed = chunk.trim();
            if (trimmed.isEmpty()) continue;
            if (pageNo > 40) break;

            String[] lines = trimmed.split("\n");
            String title = "Slide " + pageNo;
            for (String line : lines) {
                String lineTrim = line.replaceAll("^#+\\s*", "").trim();
                if (!lineTrim.isEmpty() && lineTrim.length() <= 120) {
                    title = lineTrim;
                    break;
                }
            }
            slides.add(new DeckSlide(roomId, pageNo, title, trimmed, trimmed.length()));
            pageNo++;
        }

        if (slides.isEmpty()) {
            throw new BadRequestException("INVALID_INPUT", "No slide content detected. Separate slides with a line containing only ---");
        }

        slideRepository.deleteByRoomId(roomId);
        slideRepository.saveAll(slides);

        return getSlides(roomId, user);
    }

    @Transactional(readOnly = true)
    public DeckSlidesResponse getSlides(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<DeckSlide> slides = slideRepository.findByRoomIdOrderByPageNoAsc(roomId);
        if (slides.isEmpty()) {
            return new DeckSlidesResponse(Collections.emptyList(), "", false, false);
        }

        String currentHash = computeDeckHash(slides);
        List<DeckAudit> audits = auditRepository.findByRoomIdAndDeckHash(roomId, currentHash);

        Map<Integer, String> slideVerdicts = new HashMap<>();
        boolean deckAudited = false;
        for (DeckAudit a : audits) {
            if ("SLIDE".equalsIgnoreCase(a.getScope()) && a.getPageNo() != null) {
                try {
                    SlideAuditJson json = objectMapper.readValue(a.getResult(), SlideAuditJson.class);
                    slideVerdicts.put(a.getPageNo(), json.verdict);
                } catch (Exception ignored) {}
            } else if ("DECK".equalsIgnoreCase(a.getScope())) {
                deckAudited = true;
            }
        }

        List<DeckSlideSummaryDto> summaryList = slides.stream()
                .map(s -> new DeckSlideSummaryDto(s.getPageNo(), s.getTitle(), s.getChars(), slideVerdicts.get(s.getPageNo())))
                .collect(Collectors.toList());

        return new DeckSlidesResponse(summaryList, currentHash, deckAudited, false);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SlideAuditJson {
        public String role = "";
        public String verdict = "OK";
        public List<SlideIssueDto> issues = new ArrayList<>();
        public List<String> fixes = new ArrayList<>();
        public List<String> rubric = new ArrayList<>();
        public List<String> missing = new ArrayList<>();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DeckAuditJson {
        public String narrative = "";
        public List<String> missingSlides = new ArrayList<>();
        public List<RubricCoverageItemDto> coverage = new ArrayList<>();
        public String timingNote = "";
    }

    @Transactional
    public SlideAuditResponse auditSlide(UUID roomId, int page, User user) {
        roomAccess.requireMember(roomId, user);
        List<DeckSlide> slides = slideRepository.findByRoomIdOrderByPageNoAsc(roomId);
        if (slides.isEmpty()) {
            throw new BadRequestException("NO_SLIDES", "No slides uploaded yet.");
        }
        DeckSlide target = slides.stream().filter(s -> s.getPageNo() == page).findFirst()
                .orElseThrow(() -> new NotFoundException("SLIDE_NOT_FOUND", "Slide " + page + " not found."));

        String currentHash = computeDeckHash(slides);
        Optional<DeckAudit> cached = auditRepository.findFirstByRoomIdAndScopeAndPageNoAndDeckHashOrderByCreatedAtDesc(
                roomId, "SLIDE", page, currentHash);

        if (cached.isPresent()) {
            try {
                SlideAuditJson json = objectMapper.readValue(cached.get().getResult(), SlideAuditJson.class);
                return new SlideAuditResponse(page, json.role, json.verdict, json.issues, json.fixes, json.rubric, json.missing, false);
            } catch (Exception ignored) {}
        }

        String projectContext = buildProjectContext(roomId);
        String deckOutline = slides.stream()
                .map(s -> "Slide " + s.getPageNo() + ": " + s.getTitle())
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
                You are a blunt, experienced hackathon judge auditing an individual pitch deck slide.
                Tone: Blunt and specific. No generic advice such as "add more detail". No praise without concrete evidence.
                Format: You MUST return a JSON object with:
                - "role": what this slide is for (one concise phrase)
                - "verdict": "GOOD" | "OK" | "WEAK"
                - "issues": array of { "severity": "HIGH"|"MED"|"LOW", "text": "specific blunt issue" }
                - "fixes": array of at most 3 concrete rewrites or specific content additions
                - "rubric": array of rubric criterion names that this slide directly supports
                - "missing": array of critical missing information for this specific slide
                """;

        String userPrompt = String.format("""
                PROJECT CONTEXT & RUBRIC:
                %s

                DECK OUTLINE:
                %s

                THIS SLIDE (Page %d of %d):
                Title: %s
                Text Content:
                %s
                """, projectContext, deckOutline, page, slides.size(), target.getTitle(), target.getText());

        SlideAuditJson auditJson = aiService.json("deck.audit.slide", roomId, user.getId(), systemPrompt, userPrompt, SlideAuditJson.class);
        if (auditJson.fixes != null && auditJson.fixes.size() > 3) {
            auditJson.fixes = auditJson.fixes.subList(0, 3);
        }

        try {
            String resultStr = objectMapper.writeValueAsString(auditJson);
            auditRepository.save(new DeckAudit(roomId, "SLIDE", page, resultStr, currentHash, user.getId()));
        } catch (Exception ex) {
            log.error("Failed to serialize slide audit result", ex);
        }

        return new SlideAuditResponse(page, auditJson.role, auditJson.verdict, auditJson.issues, auditJson.fixes, auditJson.rubric, auditJson.missing, false);
    }

    @Transactional
    public DeckAuditResponse auditDeck(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<DeckSlide> slides = slideRepository.findByRoomIdOrderByPageNoAsc(roomId);
        if (slides.isEmpty()) {
            throw new BadRequestException("NO_SLIDES", "No slides uploaded yet.");
        }

        String currentHash = computeDeckHash(slides);
        Optional<DeckAudit> cached = auditRepository.findFirstByRoomIdAndScopeAndDeckHashOrderByCreatedAtDesc(
                roomId, "DECK", currentHash);

        if (cached.isPresent()) {
            try {
                DeckAuditJson json = objectMapper.readValue(cached.get().getResult(), DeckAuditJson.class);
                return new DeckAuditResponse(json.narrative, json.missingSlides, json.coverage, json.timingNote, false);
            } catch (Exception ignored) {}
        }

        String projectContext = buildProjectContext(roomId);
        StringBuilder slidesText = new StringBuilder();
        for (DeckSlide s : slides) {
            slidesText.append("--- Slide ").append(s.getPageNo()).append(": ").append(s.getTitle()).append(" ---\n");
            slidesText.append(s.getText()).append("\n\n");
        }

        String systemPrompt = """
                You are a blunt, experienced hackathon judge auditing a complete pitch deck presentation.
                Tone: Blunt and specific. No generic advice.
                Format: You MUST return a JSON object with:
                - "narrative": blunt critique of the flow and storytelling between slides
                - "missingSlides": array of missing slide topics (e.g. "Problem definition", "Architecture/Demo proof", "Business impact")
                - "coverage": array of { "criterion": "criterion name", "weight": integer, "level": "NONE"|"THIN"|"GOOD", "pages": [slide_numbers] }
                - "timingNote": assessment of whether this deck can be delivered in the hackathon's time limit
                """;

        String userPrompt = String.format("""
                PROJECT CONTEXT & RUBRIC:
                %s

                DECK SLIDES (%d total slides):
                %s
                """, projectContext, slides.size(), slidesText.toString());

        DeckAuditJson auditJson = aiService.json("deck.audit.deck", roomId, user.getId(), systemPrompt, userPrompt, DeckAuditJson.class);

        try {
            String resultStr = objectMapper.writeValueAsString(auditJson);
            auditRepository.save(new DeckAudit(roomId, "DECK", null, resultStr, currentHash, user.getId()));
        } catch (Exception ex) {
            log.error("Failed to serialize deck audit result", ex);
        }

        return new DeckAuditResponse(auditJson.narrative, auditJson.missingSlides, auditJson.coverage, auditJson.timingNote, false);
    }

    @Transactional(readOnly = true)
    public DeckAuditResponse getDeckAudit(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<DeckSlide> slides = slideRepository.findByRoomIdOrderByPageNoAsc(roomId);
        if (slides.isEmpty()) {
            return null;
        }
        String currentHash = computeDeckHash(slides);
        Optional<DeckAudit> cached = auditRepository.findFirstByRoomIdAndScopeAndDeckHashOrderByCreatedAtDesc(
                roomId, "DECK", currentHash);

        if (cached.isPresent()) {
            try {
                DeckAuditJson json = objectMapper.readValue(cached.get().getResult(), DeckAuditJson.class);
                return new DeckAuditResponse(json.narrative, json.missingSlides, json.coverage, json.timingNote, false);
            } catch (Exception ignored) {}
        }

        // Check if there is an older audit that is now stale
        List<DeckAudit> anyAudits = auditRepository.findByRoomIdAndDeckHash(roomId, "");
        return null;
    }

    private String buildProjectContext(UUID roomId) {
        StringBuilder sb = new StringBuilder();
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        if (brief != null) {
            sb.append("Confirmed Brief Problem & Rules:\n").append(brief.getProblemStatement()).append("\n");
            List<BriefRubricItem> rubrics = rubricRepository.findByBriefIdOrderByPositionAsc(brief.getId());
            if (!rubrics.isEmpty()) {
                sb.append("Rubric Criteria & Weights:\n");
                for (BriefRubricItem r : rubrics) {
                    sb.append("- ").append(r.getCriterion()).append(" (Weight: ").append(r.getWeight()).append("%)\n");
                }
            }
        }

        // PRD & MVP from docs
        docRepository.findByRoomIdAndFileName(roomId, "PRD.md").ifPresent(doc -> {
            List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
            if (!vers.isEmpty()) {
                sb.append("\nPRD Summary:\n").append(truncate(vers.get(0).getContent(), 1500)).append("\n");
            }
        });

        docRepository.findByRoomIdAndFileName(roomId, "MVP.md").ifPresent(doc -> {
            List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
            if (!vers.isEmpty()) {
                sb.append("\nMVP Core Flow:\n").append(truncate(vers.get(0).getContent(), 1500)).append("\n");
            }
        });

        docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md").ifPresent(doc -> {
            List<DocVersion> vers = docVersionRepository.findByDocIdOrderByVersionDesc(doc.getId());
            if (!vers.isEmpty()) {
                sb.append("\nDemo Timing & Limits:\n").append(truncate(vers.get(0).getContent(), 1000)).append("\n");
            }
        });

        return sb.toString();
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }

    public static String computeDeckHash(List<DeckSlide> slides) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (DeckSlide s : slides) {
                md.update((s.getPageNo() + ":" + s.getTitle() + ":" + s.getText()).getBytes(StandardCharsets.UTF_8));
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(slides.hashCode());
        }
    }
}
