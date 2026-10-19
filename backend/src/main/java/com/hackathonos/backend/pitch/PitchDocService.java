package com.hackathonos.backend.pitch;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.pitch.PitchDocDtos.*;
import com.hackathonos.backend.pitch.PitchDtos.PitchSlidePlanDto;
import com.hackathonos.backend.pitch.PitchDtos.PitchScriptDto;
import com.hackathonos.backend.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PitchDocService {

    private static final Logger log = LoggerFactory.getLogger(PitchDocService.class);

    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final PitchScriptRepository scriptRepository;
    private final PitchQaRepository qaRepository;
    private final QnaPracticeRepository practiceRepository;
    private final PitchScriptService pitchScriptService;
    private final RoomAccess roomAccess;
    private final ObjectMapper objectMapper;

    public PitchDocService(
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            PitchScriptRepository scriptRepository,
            PitchQaRepository qaRepository,
            QnaPracticeRepository practiceRepository,
            PitchScriptService pitchScriptService,
            RoomAccess roomAccess,
            ObjectMapper objectMapper
    ) {
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.scriptRepository = scriptRepository;
        this.qaRepository = qaRepository;
        this.practiceRepository = practiceRepository;
        this.pitchScriptService = pitchScriptService;
        this.roomAccess = roomAccess;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PitchDocStatusDto getDocStatus(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Optional<Doc> demoDoc = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
        Optional<Doc> qnaDoc = docRepository.findByRoomIdAndFileName(roomId, "QNA.md");
        Optional<PitchScript> script = scriptRepository.findById(roomId);

        return new PitchDocStatusDto(
                demoDoc.isPresent(),
                demoDoc.map(Doc::getCurrentVersion).orElse(0),
                qnaDoc.isPresent(),
                qnaDoc.map(Doc::getCurrentVersion).orElse(0),
                script.map(PitchScript::getSource).orElse("GENERATED"),
                script.map(PitchScript::getDocVersion).orElse(1),
                4 // Step 4 in plan config generates demo script & qna
        );
    }

    @Transactional
    public PitchScriptDto useDemoScript(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md")
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "DEMO_SCRIPT.md does not exist for this room."));

        String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                .map(DocVersion::getContent)
                .orElse("");

        if (content.isBlank()) {
            throw new BadRequestException("DOC_EMPTY", "DEMO_SCRIPT.md is empty.");
        }

        // 1. Time limit from "Format and limits"
        int targetSeconds = parseTimeLimit(content);

        // 2. Parse beats from "Script" section
        List<PitchSlidePlanDto> slides = parseBeats(content);
        if (slides.isEmpty()) {
            throw new BadRequestException("NO_BEATS", "Could not parse any beats from DEMO_SCRIPT.md. Expected H3 headings like '### 0:00-0:10 - Hook'.");
        }

        // If targetSeconds not found, sum of beats
        if (targetSeconds <= 0) {
            targetSeconds = slides.stream().mapToInt(PitchSlidePlanDto::seconds).sum();
            if (targetSeconds <= 0) targetSeconds = 180;
        }

        PitchScript script = scriptRepository.findById(roomId).orElseGet(() -> {
            PitchScript s = new PitchScript();
            s.setRoomId(roomId);
            return s;
        });

        script.setType("demo_script");
        script.setSpeakerCount(1);
        script.setSpeakers("[]");
        script.setInstructions("Generated from DEMO_SCRIPT.md version " + doc.getCurrentVersion());
        script.setHook(slides.get(0).headline());
        script.setClosingLine(slides.get(slides.size() - 1).headline());
        script.setTotalSeconds(targetSeconds);
        try {
            script.setSlides(objectMapper.writeValueAsString(slides));
        } catch (Exception ex) {
            log.error("Failed to serialize script slides", ex);
        }
        script.setSource("DOC");
        script.setDocVersion(doc.getCurrentVersion());
        script.setGeneratedBy(user != null ? user.getId() : null);
        script.setGeneratedAt(Instant.now());

        scriptRepository.save(script);
        return pitchScriptService.getScript(roomId, user);
    }

    private int parseTimeLimit(String content) {
        Pattern limitP = Pattern.compile("(?i)(?:limit|format|duration)[^\\n]*?(\\d+)\\s*(?:min(?:ute)?s?|sec(?:ond)?s?|s)");
        Matcher m = limitP.matcher(content);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                String matched = m.group(0).toLowerCase();
                if (matched.contains("min")) return val * 60;
                return val;
            } catch (Exception ignored) {}
        }
        return 0;
    }

    private List<PitchSlidePlanDto> parseBeats(String content) {
        List<PitchSlidePlanDto> slides = new ArrayList<>();

        // Find "Script" section
        String scriptBlock = content;
        Matcher secMatcher = Pattern.compile("(?im)^##\\s*(?:\\d+\\.\\s*)?Script.*$").matcher(content);
        if (secMatcher.find()) {
            int start = secMatcher.end();
            Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(content);
            int end = content.length();
            if (nextH2.find(start)) {
                end = nextH2.start();
            }
            scriptBlock = content.substring(start, end);
        }

        // H3 beats: "### 0:00-0:10 - Hook"
        Pattern beatPattern = Pattern.compile("(?im)^###\\s*(\\d+:\\d{2}\\s*[-–—]\\s*\\d+:\\d{2})\\s*[-–—:]?\\s*(.*)$");
        Matcher bm = beatPattern.matcher(scriptBlock);

        int index = 1;
        while (bm.find()) {
            String timeWindow = bm.group(1).trim();
            String title = bm.group(2).replaceAll("[*_]", "").trim();
            if (title.isBlank()) title = "Beat " + index;

            int beatStart = bm.end();
            int beatEnd = scriptBlock.length();
            Matcher nextBm = beatPattern.matcher(scriptBlock);
            if (nextBm.find(beatStart)) {
                beatEnd = nextBm.start();
            }
            String block = scriptBlock.substring(beatStart, beatEnd);

            String say = extractBulletValue(block, "SAY");
            String show = extractBulletValue(block, "SHOW");
            String cue = extractBulletValue(block, "CUE");
            int dur = computeDurationFromWindow(timeWindow);

            slides.add(new PitchSlidePlanDto(index, title, 0, dur, say, show, cue, List.of(timeWindow)));
            index++;
        }

        return slides;
    }

    private int computeDurationFromWindow(String timeWindow) {
        try {
            String[] parts = timeWindow.split("[-–—]");
            if (parts.length == 2) {
                int start = parseSec(parts[0].trim());
                int end = parseSec(parts[1].trim());
                if (end > start) return end - start;
            }
        } catch (Exception ignored) {}
        return 20; // fallback 20s
    }

    private int parseSec(String s) {
        String[] m = s.split(":");
        return Integer.parseInt(m[0]) * 60 + Integer.parseInt(m[1]);
    }

    private String extractBulletValue(String block, String bullet) {
        Pattern p = Pattern.compile("(?im)^[-*]\\s*(?:\\*\\*)?" + bullet + "\\s*:?(?:\\*\\*)?\\s*(.*)$");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.group(1).trim();
        }
        return "";
    }

    @Transactional(readOnly = true)
    public QnaDocResponseDto getQnaDoc(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "QNA.md");
        if (docOpt.isEmpty()) {
            return new QnaDocResponseDto(false, 0, false, "", 0, 0,
                    Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                    loadAiDraftQuestions(roomId), 4);
        }

        Doc doc = docOpt.get();
        String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                .map(DocVersion::getContent)
                .orElse("");

        if (content.isBlank()) {
            return new QnaDocResponseDto(true, doc.getCurrentVersion(), true, content, 0, 0,
                    Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                    loadAiDraftQuestions(roomId), 4);
        }

        // Set of practiced hashes for current user
        Set<String> practicedHashes = new HashSet<>();
        if (user != null && user.getId() != null) {
            practicedHashes = practiceRepository.findByUserIdAndRoomId(user.getId(), roomId).stream()
                    .map(QnaPractice::getQuestionHash)
                    .collect(Collectors.toSet());
        }

        try {
            List<QnaCategoryDto> categories = parseQnaCategories(content, practicedHashes);
            List<SimpleListItemDto> drills = parseSimpleListSection(content, "Code defense drills");
            List<SimpleListItemDto> hardTruths = parseSimpleListSection(content, "Hard truths");
            List<SimpleListItemDto> judgeQs = parseSimpleListSection(content, "Questions to ask the judges");

            int totalQuestions = categories.stream().mapToInt(c -> c.questions().size()).sum();
            int practicedCount = categories.stream()
                    .flatMap(c -> c.questions().stream())
                    .mapToInt(q -> q.practiced() ? 1 : 0)
                    .sum();

            if (totalQuestions == 0) {
                return new QnaDocResponseDto(true, doc.getCurrentVersion(), true, content, 0, 0,
                        Collections.emptyList(), drills, hardTruths, judgeQs, loadAiDraftQuestions(roomId), 4);
            }

            return new QnaDocResponseDto(true, doc.getCurrentVersion(), false, "", practicedCount, totalQuestions,
                    categories, drills, hardTruths, judgeQs, loadAiDraftQuestions(roomId), 4);
        } catch (Exception ex) {
            log.warn("Failed to parse QNA.md: {}", ex.getMessage());
            return new QnaDocResponseDto(true, doc.getCurrentVersion(), true, content, 0, 0,
                    Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(),
                    loadAiDraftQuestions(roomId), 4);
        }
    }

    private List<QnaCategoryDto> parseQnaCategories(String content, Set<String> practicedHashes) {
        List<QnaCategoryDto> categories = new ArrayList<>();

        // Isolate "Questions" section
        String qSection = content;
        Matcher secMatcher = Pattern.compile("(?im)^##\\s*(?:\\d+\\.\\s*)?Questions.*$").matcher(content);
        if (secMatcher.find()) {
            int start = secMatcher.end();
            Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(content);
            int end = content.length();
            if (nextH2.find(start)) {
                end = nextH2.start();
            }
            qSection = content.substring(start, end);
        }

        // H3 categories: "### Problem and user"
        Pattern catP = Pattern.compile("(?im)^###\\s*(.*)$");
        Matcher cm = catP.matcher(qSection);

        List<int[]> catSpans = new ArrayList<>();
        List<String> catNames = new ArrayList<>();
        while (cm.find()) {
            catNames.add(cm.group(1).trim());
            catSpans.add(new int[]{cm.end(), 0});
        }
        for (int i = 0; i < catSpans.size(); i++) {
            int end = (i + 1 < catSpans.size()) ? catSpans.get(i + 1)[0] : qSection.length();
            catSpans.get(i)[1] = end;
        }

        Pattern qPattern = Pattern.compile("(?im)^####\\s*(?:Q:?\\s*)?(.*)$");

        for (int i = 0; i < catNames.size(); i++) {
            String catName = catNames.get(i);
            String catBlock = qSection.substring(catSpans.get(i)[0], catSpans.get(i)[1]);

            Matcher qm = qPattern.matcher(catBlock);
            List<QnaQuestionItemDto> qItems = new ArrayList<>();

            while (qm.find()) {
                String qText = qm.group(1).replaceAll("[*_]", "").trim();
                int qStart = qm.end();
                int qEnd = catBlock.length();
                Matcher nextQm = qPattern.matcher(catBlock);
                if (nextQm.find(qStart)) {
                    qEnd = nextQm.start();
                }
                String qBlock = catBlock.substring(qStart, qEnd);

                String answer = extractBulletValue(qBlock, "Answer");
                String followUp = extractBulletValue(qBlock, "Follow-up");
                String counter = extractBulletValue(qBlock, "Counter");
                String owner = extractBulletValue(qBlock, "Owner");
                String proof = extractBulletValue(qBlock, "Proof");

                String hash = hashQuestion(qText);
                boolean practiced = practicedHashes.contains(hash);

                qItems.add(new QnaQuestionItemDto(hash, qText, owner, answer, followUp, counter, proof, practiced));
            }

            if (!qItems.isEmpty()) {
                categories.add(new QnaCategoryDto(catName, qItems));
            }
        }

        return categories;
    }

    private List<SimpleListItemDto> parseSimpleListSection(String content, String sectionHeading) {
        List<SimpleListItemDto> items = new ArrayList<>();
        Matcher secMatcher = Pattern.compile("(?im)^##\\s*(?:\\d+\\.\\s*)?" + Pattern.quote(sectionHeading) + ".*$").matcher(content);
        if (!secMatcher.find()) return items;

        int start = secMatcher.end();
        Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(content);
        int end = content.length();
        if (nextH2.find(start)) {
            end = nextH2.start();
        }
        String block = content.substring(start, end).trim();

        // Split by H3 or numbered bullets
        Pattern h3Pattern = Pattern.compile("(?im)^###\\s*(.*)$");
        Matcher hm = h3Pattern.matcher(block);
        boolean hasH3 = hm.find();

        if (hasH3) {
            hm.reset();
            List<int[]> spans = new ArrayList<>();
            List<String> titles = new ArrayList<>();
            while (hm.find()) {
                titles.add(hm.group(1).trim());
                spans.add(new int[]{hm.end(), 0});
            }
            for (int i = 0; i < spans.size(); i++) {
                int e = (i + 1 < spans.size()) ? spans.get(i + 1)[0] : block.length();
                spans.get(i)[1] = e;
            }
            for (int i = 0; i < titles.size(); i++) {
                String text = block.substring(spans.get(i)[0], spans.get(i)[1]).trim();
                items.add(new SimpleListItemDto(titles.get(i), text));
            }
        } else {
            for (String line : block.split("\n")) {
                String trimmed = line.trim();
                if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.matches("^\\d+\\..*")) {
                    String clean = trimmed.replaceAll("^[-*\\d.]+\\s*", "").trim();
                    if (!clean.isEmpty()) {
                        items.add(new SimpleListItemDto("", clean));
                    }
                }
            }
        }

        return items;
    }

    private List<AiDraftQuestionDto> loadAiDraftQuestions(UUID roomId) {
        return qaRepository.findByRoomIdOrderByPositionAsc(roomId).stream()
                .filter(q -> "GENERATED".equalsIgnoreCase(q.getSource()))
                .map(q -> new AiDraftQuestionDto(q.getId().toString(), q.getQuestion(), q.getAnswer(), q.getCategory()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void togglePractice(UUID roomId, User user, String questionHash, boolean practiced) {
        roomAccess.requireMember(roomId, user);
        if (user == null || user.getId() == null) return;

        if (practiced) {
            if (!practiceRepository.findByUserIdAndRoomIdAndQuestionHash(user.getId(), roomId, questionHash).isPresent()) {
                practiceRepository.save(new QnaPractice(user.getId(), roomId, questionHash));
            }
        } else {
            practiceRepository.deleteByUserIdAndRoomIdAndQuestionHash(user.getId(), roomId, questionHash);
        }
    }

    public static String hashQuestion(String q) {
        if (q == null) return "";
        String norm = q.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(norm.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(norm.hashCode());
        }
    }
}
