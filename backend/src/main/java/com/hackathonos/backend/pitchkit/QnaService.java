package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
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
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.pitchkit.QnaDtos.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QnaService {

    private static final Logger log = LoggerFactory.getLogger(QnaService.class);

    private final QnaItemRepository itemRepository;
    private final QnaProgressRepository progressRepository;
    private final QnaAnswerRepository answerRepository;
    private final QnaSessionRepository sessionRepository;
    private final QnaSessionAnswerRepository sessionAnswerRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository briefRubricItemRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomAccessService roomAccess;
    private final RoomEventService roomEventService;
    private final ActivityLogger activityLogger;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public QnaService(
            QnaItemRepository itemRepository,
            QnaProgressRepository progressRepository,
            QnaAnswerRepository answerRepository,
            QnaSessionRepository sessionRepository,
            QnaSessionAnswerRepository sessionAnswerRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository briefRubricItemRepository,
            UserRepository userRepository,
            RoomMemberRepository roomMemberRepository,
            RoomAccessService roomAccess,
            RoomEventService roomEventService,
            ActivityLogger activityLogger,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.itemRepository = itemRepository;
        this.progressRepository = progressRepository;
        this.answerRepository = answerRepository;
        this.sessionRepository = sessionRepository;
        this.sessionAnswerRepository = sessionAnswerRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.briefRepository = briefRepository;
        this.briefRubricItemRepository = briefRubricItemRepository;
        this.userRepository = userRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.roomAccess = roomAccess;
        this.roomEventService = roomEventService;
        this.activityLogger = activityLogger;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<QnaItemDto> getItems(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        long count = itemRepository.countByRoomIdAndActive(roomId, true);
        if (count == 0) {
            syncFromQnaDoc(roomId, user);
        }

        List<QnaItem> items = itemRepository.findByRoomIdAndActiveOrderByPositionAsc(roomId, true);
        return enrichItems(roomId, items, user);
    }

    @Transactional
    public void syncFromQnaDoc(UUID roomId, User user) {
        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "QNA.md");
        if (docOpt.isEmpty()) return;

        Doc doc = docOpt.get();
        String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                .map(DocVersion::getContent)
                .orElse("");
        if (content.isBlank()) return;

        Set<String> knownCriteria = getRubricCriteria(roomId).stream()
                .map(BriefRubricItem::getCriterion)
                .collect(Collectors.toSet());

        List<QnaDocumentParser.ParsedItem> parsedItems = QnaDocumentParser.parseQnaDocument(content, knownCriteria);
        if (parsedItems.isEmpty()) return;

        itemRepository.markDocItemsInactive(roomId);

        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        Map<String, UUID> handleToUser = new HashMap<>();
        for (RoomMember m : members) {
            userRepository.findById(m.getUserId()).ifPresent(u -> {
                if (u.getUsername() != null) handleToUser.put(u.getUsername().toLowerCase(Locale.ROOT), u.getId());
                if (u.getDisplayName() != null) handleToUser.put(u.getDisplayName().toLowerCase(Locale.ROOT), u.getId());
            });
        }

        for (QnaDocumentParser.ParsedItem pi : parsedItems) {
            UUID ownerId = null;
            if (pi.ownerHandle() != null) {
                ownerId = handleToUser.get(pi.ownerHandle().toLowerCase(Locale.ROOT));
            }

            Optional<QnaItem> existing = itemRepository.findByRoomIdAndHash(roomId, pi.hash());
            if (existing.isPresent()) {
                QnaItem item = existing.get();
                item.setKind(pi.kind());
                item.setCategory(pi.category());
                item.setCriterion(pi.criterion());
                item.setQuestion(pi.question());
                item.setAnswer(pi.answer());
                item.setFollowup(pi.followup());
                item.setCounter(pi.counter());
                item.setProof(pi.proof());
                item.setOwnerUserId(ownerId);
                item.setOwnerHandle(pi.ownerHandle());
                item.setSource("DOC");
                item.setDocVersion(doc.getCurrentVersion());
                item.setPosition(pi.position());
                item.setActive(true);
                item.setUpdatedAt(Instant.now());
                itemRepository.save(item);
            } else {
                QnaItem newItem = new QnaItem(
                        UUID.randomUUID(), roomId, pi.hash(), pi.kind(), pi.category(), pi.criterion(),
                        pi.question(), pi.answer(), pi.followup(), pi.counter(), pi.proof(),
                        ownerId, pi.ownerHandle(), "DOC", doc.getCurrentVersion(), pi.position(),
                        user != null ? user.getId() : null
                );
                itemRepository.save(newItem);
            }
        }
    }

    @Transactional(readOnly = true)
    public QnaMapResponse getMap(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<QnaItem> items = itemRepository.findByRoomIdAndActiveOrderByPositionAsc(roomId, true)
                .stream().filter(it -> "QUESTION".equalsIgnoreCase(it.getKind()) || "CODE".equalsIgnoreCase(it.getKind()))
                .toList();

        Map<String, Integer> teamMasteryMap = getTeamMasteryMap(roomId);

        List<BriefRubricItem> rubric = getRubricCriteria(roomId);
        Map<String, List<QnaItem>> criterionBuckets = new LinkedHashMap<>();
        for (BriefRubricItem rc : rubric) {
            criterionBuckets.put(rc.getCriterion(), new ArrayList<>());
        }
        List<QnaItem> otherItems = new ArrayList<>();

        for (QnaItem it : items) {
            if (it.getCriterion() != null && criterionBuckets.containsKey(it.getCriterion())) {
                criterionBuckets.get(it.getCriterion()).add(it);
            } else {
                otherItems.add(it);
            }
        }

        List<QnaCriterionLaneDto> lanes = new ArrayList<>();
        int totalSolid = 0;

        for (BriefRubricItem rc : rubric) {
            List<QnaItem> bucket = criterionBuckets.get(rc.getCriterion());
            int solid = 0, shaky = 0, missed = 0, unseen = 0;
            for (QnaItem it : bucket) {
                int m = teamMasteryMap.getOrDefault(it.getHash(), 0);
                if (m == 3) solid++;
                else if (m == 2) shaky++;
                else if (m == 1) missed++;
                else unseen++;
            }
            totalSolid += solid;
            lanes.add(new QnaCriterionLaneDto(rc.getCriterion(), rc.getWeight() > 0 ? rc.getWeight() : 10, bucket.size(), solid, shaky, missed, unseen));
        }

        if (!otherItems.isEmpty()) {
            int solid = 0, shaky = 0, missed = 0, unseen = 0;
            for (QnaItem it : otherItems) {
                int m = teamMasteryMap.getOrDefault(it.getHash(), 0);
                if (m == 3) solid++;
                else if (m == 2) shaky++;
                else if (m == 1) missed++;
                else unseen++;
            }
            totalSolid += solid;
            lanes.add(new QnaCriterionLaneDto("Other", 5, otherItems.size(), solid, shaky, missed, unseen));
        }

        int totalQ = items.size();
        int solidPct = totalQ > 0 ? (int) Math.round((totalSolid * 100.0) / totalQ) : 0;

        // Weakest criterion: lowest solid % among non-empty lanes
        QnaCriterionLaneDto weakestLane = lanes.stream()
                .filter(l -> l.total() > 0)
                .min(Comparator.comparingDouble(l -> (double) l.solid() / l.total()))
                .orElse(null);

        String weakestName = weakestLane != null ? weakestLane.criterion() : "General";
        int weakestSolid = weakestLane != null ? weakestLane.solid() : 0;
        int weakestTotal = weakestLane != null ? weakestLane.total() : 0;

        // Team members progress
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        List<QnaProgress> allProgress = progressRepository.findByRoomId(roomId);
        Map<UUID, List<QnaProgress>> userProgressMap = allProgress.stream()
                .collect(Collectors.groupingBy(QnaProgress::getUserId));

        List<QnaTeamMemberProgressDto> memberDtos = new ArrayList<>();
        Map<String, Integer> ownerNeedsPractice = new HashMap<>();

        for (QnaItem it : items) {
            int m = teamMasteryMap.getOrDefault(it.getHash(), 0);
            if (m < 3 && it.getOwnerHandle() != null && !it.getOwnerHandle().isBlank()) {
                String handle = it.getOwnerHandle().replaceAll("^@", "");
                ownerNeedsPractice.put(handle, ownerNeedsPractice.getOrDefault(handle, 0) + 1);
            }
        }

        String weakestOwner = null;
        int maxNeedsPractice = 0;
        for (var entry : ownerNeedsPractice.entrySet()) {
            if (entry.getValue() > maxNeedsPractice) {
                maxNeedsPractice = entry.getValue();
                weakestOwner = entry.getKey();
            }
        }

        for (RoomMember rm : members) {
            User u = userRepository.findById(rm.getUserId()).orElse(null);
            if (u == null) continue;
            List<QnaProgress> upList = userProgressMap.getOrDefault(u.getId(), Collections.emptyList());
            int practiced = (int) upList.stream().filter(p -> p.getTimesSeen() > 0).count();
            int userSolid = (int) upList.stream().filter(p -> p.getMastery() == 3).count();
            String handle = u.getUsername() != null ? u.getUsername() : u.getName();
            int ownedWeak = ownerNeedsPractice.getOrDefault(handle, 0);

            memberDtos.add(new QnaTeamMemberProgressDto(
                    u.getId(),
                    u.getDisplayName() != null ? u.getDisplayName() : u.getName(),
                    handle,
                    practiced,
                    userSolid,
                    ownedWeak
            ));
        }

        return new QnaMapResponse(
                totalQ, totalSolid, solidPct,
                weakestName, weakestSolid, weakestTotal,
                lanes, memberDtos, weakestOwner, maxNeedsPractice
        );
    }

    @Transactional
    public void updateMyAnswer(UUID roomId, String hash, UpdateMyAnswerRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        QnaAnswer ans = answerRepository.findByUserIdAndRoomIdAndHash(user.getId(), roomId, hash)
                .orElse(new QnaAnswer(user.getId(), roomId, hash, "", false));

        if (req.ownAnswer() != null) ans.setOwnAnswer(req.ownAnswer());
        if (req.shared() != null) ans.setShared(req.shared());
        ans.setUpdatedAt(Instant.now());
        answerRepository.save(ans);
    }

    @Transactional
    public void updateMastery(UUID roomId, String hash, int level, User user) {
        roomAccess.requireMember(roomId, user);
        QnaProgress p = progressRepository.findByUserIdAndRoomIdAndHash(user.getId(), roomId, hash)
                .orElse(new QnaProgress(user.getId(), roomId, hash, level));

        p.setMastery(Math.max(0, Math.min(3, level)));
        p.setTimesSeen(p.getTimesSeen() + 1);
        p.setLastSeenAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        progressRepository.save(p);

        roomEventService.recordEvent(roomId, "qna.progress", "qna", hash, user != null ? user.getId() : null);
    }

    @Transactional
    public QnaItemDto createCustomItem(UUID roomId, CreateCustomQuestionRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        if (req.question() == null || req.question().isBlank()) {
            throw new BadRequestException("INVALID_QUESTION", "Question cannot be blank.");
        }

        String hash = QnaDocumentParser.hashQuestion(req.question());
        Optional<QnaItem> existing = itemRepository.findByRoomIdAndHash(roomId, hash);
        if (existing.isPresent()) {
            throw new BadRequestException("DUPLICATE_QUESTION", "This question already exists in this room.");
        }

        long count = itemRepository.countByRoomIdAndActive(roomId, true);
        QnaItem item = new QnaItem(
                UUID.randomUUID(), roomId, hash,
                req.kind() != null ? req.kind() : "QUESTION",
                req.category() != null ? req.category() : "Custom",
                req.criterion(), req.question(), req.answer(), req.followup(), req.counter(), req.proof(),
                req.ownerUserId(), req.ownerHandle(), "CUSTOM", null, (int) count,
                user != null ? user.getId() : null
        );
        itemRepository.save(item);

        return toDto(roomId, item, user, Collections.emptyMap(), Collections.emptyMap(), Collections.emptyMap(), Collections.emptyList());
    }

    @Transactional
    public QnaItemDto patchCustomItem(UUID roomId, UUID id, PatchCustomQuestionRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        QnaItem item = itemRepository.findByRoomIdAndId(roomId, id)
                .orElseThrow(() -> new NotFoundException("QUESTION_NOT_FOUND", "Question not found."));

        if (!"CUSTOM".equalsIgnoreCase(item.getSource())) {
            throw new BadRequestException("CANNOT_EDIT_DOC_ITEM", "Only custom items can be modified directly.");
        }

        if (req.kind() != null) item.setKind(req.kind());
        if (req.category() != null) item.setCategory(req.category());
        if (req.criterion() != null) item.setCriterion(req.criterion());
        if (req.question() != null && !req.question().isBlank()) {
            item.setQuestion(req.question());
            item.setHash(QnaDocumentParser.hashQuestion(req.question()));
        }
        if (req.answer() != null) item.setAnswer(req.answer());
        if (req.followup() != null) item.setFollowup(req.followup());
        if (req.counter() != null) item.setCounter(req.counter());
        if (req.proof() != null) item.setProof(req.proof());
        if (req.ownerUserId() != null) item.setOwnerUserId(req.ownerUserId());
        if (req.ownerHandle() != null) item.setOwnerHandle(req.ownerHandle());
        item.setUpdatedAt(Instant.now());
        itemRepository.save(item);

        return toDto(roomId, item, user, Collections.emptyMap(), Collections.emptyMap(), Collections.emptyMap(), Collections.emptyList());
    }

    @Transactional
    public void deleteCustomItem(UUID roomId, UUID id, User user) {
        roomAccess.requireMember(roomId, user);
        QnaItem item = itemRepository.findByRoomIdAndId(roomId, id)
                .orElseThrow(() -> new NotFoundException("QUESTION_NOT_FOUND", "Question not found."));

        if (!"CUSTOM".equalsIgnoreCase(item.getSource())) {
            throw new BadRequestException("CANNOT_DELETE_DOC_ITEM", "Only custom items can be deleted.");
        }
        itemRepository.delete(item);
    }

    @Transactional
    public StartSessionResponse startSession(UUID roomId, StartSessionRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        List<QnaItem> allItems = itemRepository.findByRoomIdAndActiveOrderByPositionAsc(roomId, true).stream()
                .filter(it -> "QUESTION".equalsIgnoreCase(it.getKind()) || "CODE".equalsIgnoreCase(it.getKind()))
                .toList();

        if (allItems.isEmpty()) {
            throw new BadRequestException("NO_QUESTIONS", "No questions available for Hot seat practice.");
        }

        String focus = req.focus() != null ? req.focus().toUpperCase(Locale.ROOT) : "ALL";
        List<QnaItem> pool = new ArrayList<>(allItems);

        if ("MINE".equals(focus) && user != null) {
            pool = pool.stream().filter(it -> user.getId().equals(it.getOwnerUserId())).toList();
            if (pool.isEmpty()) pool = new ArrayList<>(allItems);
        } else if ("CRITERION".equals(focus) && req.criterion() != null) {
            pool = pool.stream().filter(it -> req.criterion().equalsIgnoreCase(it.getCriterion())).toList();
            if (pool.isEmpty()) pool = new ArrayList<>(allItems);
        }

        Map<String, Integer> userMasteryMap = progressRepository.findByUserIdAndRoomId(user.getId(), roomId).stream()
                .collect(Collectors.toMap(QnaProgress::getHash, QnaProgress::getMastery, (a, b) -> a));

        Map<String, Integer> criterionWeightMap = getRubricCriteria(roomId).stream()
                .collect(Collectors.toMap(BriefRubricItem::getCriterion, BriefRubricItem::getWeight, (a, b) -> a));

        List<QnaItem> ordered;
        int targetSize = req.size() != null ? Math.max(1, req.size()) : 10;

        if ("WEAKEST".equals(focus)) {
            ordered = pool.stream().sorted((a, b) -> {
                int ma = userMasteryMap.getOrDefault(a.getHash(), 0);
                int mb = userMasteryMap.getOrDefault(b.getHash(), 0);
                if (ma != mb) return Integer.compare(ma, mb);
                int wa = criterionWeightMap.getOrDefault(a.getCriterion(), 10);
                int wb = criterionWeightMap.getOrDefault(b.getCriterion(), 10);
                return Integer.compare(wb, wa);
            }).limit(targetSize).toList();
        } else {
            // Weighted random without replacement
            ordered = sampleWeighted(pool, targetSize, userMasteryMap, criterionWeightMap);
        }

        Map<String, Object> cfg = new HashMap<>();
        cfg.put("size", targetSize);
        cfg.put("focus", focus);
        cfg.put("criterion", req.criterion());
        cfg.put("pressure", Boolean.TRUE.equals(req.pressure()));
        cfg.put("answerMode", req.answerMode() != null ? req.answerMode() : "THINK");
        cfg.put("timerSec", req.timerSec() != null ? req.timerSec() : 45);
        cfg.put("persona", req.persona() != null ? req.persona() : "SKEPTICAL_ENGINEER");

        String serializedCfg = "";
        try {
            serializedCfg = objectMapper.writeValueAsString(cfg);
        } catch (Exception ignored) {}

        QnaSession session = new QnaSession(UUID.randomUUID(), roomId, user.getId(), "HOT_SEAT", serializedCfg);
        sessionRepository.save(session);

        List<QnaItemDto> itemDtos = enrichItems(roomId, ordered, user);
        return new StartSessionResponse(session.getId(), itemDtos, cfg);
    }

    private List<QnaItem> sampleWeighted(List<QnaItem> pool, int size, Map<String, Integer> masteryMap, Map<String, Integer> weightMap) {
        List<QnaItem> remaining = new ArrayList<>(pool);
        List<QnaItem> sampled = new ArrayList<>();
        Random rand = new Random();

        int target = Math.min(size, pool.size());
        while (sampled.size() < target && !remaining.isEmpty()) {
            double totalWeight = 0;
            double[] weights = new double[remaining.size()];
            for (int i = 0; i < remaining.size(); i++) {
                QnaItem it = remaining.get(i);
                int cWeight = weightMap.getOrDefault(it.getCriterion(), 10);
                int m = masteryMap.getOrDefault(it.getHash(), 0);
                double factor = switch (m) {
                    case 1 -> 2.0; // missed
                    case 2 -> 1.5; // shaky
                    case 3 -> 0.4; // solid
                    default -> 1.2; // unseen
                };
                weights[i] = cWeight * factor;
                totalWeight += weights[i];
            }

            double r = rand.nextDouble() * totalWeight;
            double sum = 0;
            int pickedIdx = 0;
            for (int i = 0; i < remaining.size(); i++) {
                sum += weights[i];
                if (r <= sum) {
                    pickedIdx = i;
                    break;
                }
            }
            sampled.add(remaining.remove(pickedIdx));
        }
        return sampled;
    }

    @Transactional
    public void submitSessionAnswer(UUID roomId, UUID sessionId, SubmitSessionAnswerRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        QnaSession session = sessionRepository.findByIdAndRoomId(sessionId, roomId)
                .orElseThrow(() -> new NotFoundException("SESSION_NOT_FOUND", "Hot seat session not found."));

        String serializedPoints = null;
        if (req.coveredPoints() != null) {
            try { serializedPoints = objectMapper.writeValueAsString(req.coveredPoints()); } catch (Exception ignored) {}
        }

        QnaSessionAnswer sa = new QnaSessionAnswer(
                UUID.randomUUID(), session.getId(), req.hash(), req.rating(),
                req.answerText(), null, req.durationMs(),
                Boolean.TRUE.equals(req.followupShown()), serializedPoints
        );
        sessionAnswerRepository.save(sa);

        // Update QnaProgress
        if (req.rating() != null && req.rating() >= 1 && req.rating() <= 3) {
            updateMastery(roomId, req.hash(), req.rating(), user);
            progressRepository.findByUserIdAndRoomIdAndHash(user.getId(), roomId, req.hash()).ifPresent(p -> {
                p.setLastAnswerMs(req.durationMs());
                p.setLastRating(req.rating());
                progressRepository.save(p);
            });
        }
    }

    @Transactional
    public Map<String, String> uploadSessionAudio(UUID roomId, UUID sessionId, String hash, MultipartFile file, User user) {
        roomAccess.requireMember(roomId, user);
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_AUDIO", "Audio file is empty.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("AUDIO_TOO_LARGE", "Audio file exceeds 5 MB limit.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("AUDIO_READ_ERROR", "Failed to read audio file.");
        }

        // Verify audio magic bytes
        if (!isAudioBytes(bytes)) {
            throw new BadRequestException("INVALID_AUDIO_TYPE", "File is not a valid audio recording.");
        }

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String promptHint = "Project: " + (brief != null && brief.getProblemStatement() != null ? brief.getProblemStatement() : "Hackathon defense");

        String transcript = aiService.transcribeAudio(user.getId(), "qna-answer.webm", bytes, promptHint);

        sessionAnswerRepository.findBySessionIdAndHash(sessionId, hash).ifPresent(sa -> {
            sa.setTranscript(transcript);
            sessionAnswerRepository.save(sa);
        });

        return Map.of("text", transcript != null ? transcript : "");
    }

    private boolean isAudioBytes(byte[] b) {
        if (b == null || b.length < 4) return false;
        if (b[0] == 0x1A && b[1] == 0x45 && b[2] == (byte) 0xDF && b[3] == (byte) 0xA3) return true; // WebM
        if (b[0] == 0x4F && b[1] == 0x67 && b[2] == 0x67 && b[3] == 0x53) return true; // Ogg
        if (b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46) return true; // WAV
        return b.length >= 8 && b[4] == 0x66 && b[5] == 0x74 && b[6] == 0x79 && b[7] == 0x70; // MP4
    }

    @Transactional
    public SessionSummaryDto finishSession(UUID roomId, UUID sessionId, User user) {
        roomAccess.requireMember(roomId, user);
        QnaSession session = sessionRepository.findByIdAndRoomId(sessionId, roomId)
                .orElseThrow(() -> new NotFoundException("SESSION_NOT_FOUND", "Hot seat session not found."));

        List<QnaSessionAnswer> answers = sessionAnswerRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        int solid = 0, shaky = 0, missed = 0;
        long totalMs = 0;
        long maxMs = 0;
        List<String> revisit = new ArrayList<>();

        for (QnaSessionAnswer a : answers) {
            int r = a.getRating() != null ? a.getRating() : 0;
            if (r == 3) solid++;
            else if (r == 2) { shaky++; revisit.add(a.getHash()); }
            else if (r == 1) { missed++; revisit.add(a.getHash()); }

            long dur = a.getDurationMs() != null ? a.getDurationMs() : 0;
            totalMs += dur;
            if (dur > maxMs) maxMs = dur;
        }

        long avgMs = answers.isEmpty() ? 0 : totalMs / answers.size();
        Map<String, Integer> counts = Map.of("solid", solid, "shaky", shaky, "missed", missed);

        SessionSummaryDto summary = new SessionSummaryDto(counts, avgMs, maxMs, "Technical Implementation", revisit);

        try {
            session.setSummary(objectMapper.writeValueAsString(summary));
        } catch (Exception ignored) {}
        session.setFinishedAt(Instant.now());
        sessionRepository.save(session);

        roomEventService.recordEvent(roomId, "qna.session.finished", "qna_session", sessionId.toString(), user != null ? user.getId() : null);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        activityLogger.log(room, user, "QNA_HOTSEAT", "Completed Hot seat drill: " + solid + " solid, " + shaky + " shaky");

        return summary;
    }

    @Transactional
    public AiGradeResponse gradeAnswer(UUID roomId, AiGradeRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        QnaItem item = itemRepository.findByRoomIdAndHash(roomId, req.hash())
                .orElseThrow(() -> new NotFoundException("QUESTION_NOT_FOUND", "Question not found."));

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String projectContext = brief != null ? (brief.getProblemStatement() != null ? brief.getProblemStatement() : "") : "Hackathon project";

        String systemPrompt = "You are a tough, blunt hackathon judge grading an oral Q&A answer. "
                + "Compare the user's spoken answer against the recommended answer and verified project facts. "
                + "Never invent project facts. Output JSON only: {\"score\": 0..10, \"verdict\": \"Short summary\", \"missed\": [\"point 1\", \"point 2\"], \"better\": \"One sentence improvement\"}";

        String userPrompt = "Question: " + item.getQuestion()
                + "\nRecommended Answer: " + item.getAnswer()
                + "\nUser's Answer: " + req.answerText()
                + "\nProject Context: " + projectContext;

        return aiService.json("qa.grade", roomId, user.getId(), systemPrompt, userPrompt, AiGradeResponse.class);
    }

    @Transactional
    public List<QnaItemDto> generateMore(UUID roomId, AiGenerateMoreRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String projectFacts = brief != null ? (brief.getProblemStatement() != null ? brief.getProblemStatement() : "") : "Hackathon project";

        String persona = req.persona() != null ? req.persona() : "SKEPTICAL_ENGINEER";
        int count = req.count() != null ? Math.max(1, Math.min(5, req.count())) : 3;

        String systemPrompt = "You are an expert hackathon judge with persona " + persona + ". "
                + "Generate " + count + " hard, realistic defense questions grounded strictly in the project facts. "
                + "Output JSON only in the format: {\"items\": [{\"question\": \"...\", \"answer\": \"...\", \"followup\": \"...\", \"counter\": \"...\"}]}";

        String userPrompt = "Project context:\n" + projectFacts + "\nCriterion: " + (req.criterion() != null ? req.criterion() : "Technical Implementation");

        record GeneratedListWrapper(List<GeneratedQuestionItem> items) {}
        GeneratedListWrapper res = aiService.json("qa.generate", roomId, user.getId(), systemPrompt, userPrompt, GeneratedListWrapper.class);

        List<QnaItem> saved = new ArrayList<>();
        if (res != null && res.items() != null) {
            long pos = itemRepository.countByRoomIdAndActive(roomId, true);
            for (GeneratedQuestionItem gi : res.items()) {
                String hash = QnaDocumentParser.hashQuestion(gi.question());
                if (itemRepository.findByRoomIdAndHash(roomId, hash).isPresent()) continue;

                QnaItem item = new QnaItem(
                        UUID.randomUUID(), roomId, hash, "QUESTION",
                        req.criterion() != null ? req.criterion() : "AI draft",
                        req.criterion(), gi.question(), gi.answer(), gi.followup(), gi.counter(), "",
                        null, null, "AI", null, (int) pos++, user != null ? user.getId() : null
                );
                saved.add(itemRepository.save(item));
            }
        }

        return enrichItems(roomId, saved, user);
    }

    public record GeneratedQuestionItem(String question, String answer, String followup, String counter) {}

    private List<QnaItemDto> enrichItems(UUID roomId, List<QnaItem> items, User user) {
        Map<String, Integer> userMasteryMap = user != null
                ? progressRepository.findByUserIdAndRoomId(user.getId(), roomId).stream()
                .collect(Collectors.toMap(QnaProgress::getHash, QnaProgress::getMastery, (a, b) -> a))
                : Collections.emptyMap();

        Map<String, Integer> teamMasteryMap = getTeamMasteryMap(roomId);

        Map<String, QnaAnswer> userAnswers = user != null
                ? answerRepository.findByUserIdAndRoomId(user.getId(), roomId).stream()
                .collect(Collectors.toMap(QnaAnswer::getHash, a -> a, (a, b) -> a))
                : Collections.emptyMap();

        List<QnaAnswer> sharedAnswers = answerRepository.findByRoomIdAndSharedTrue(roomId);
        Map<String, List<QnaTeammateAnswerDto>> sharedMap = new HashMap<>();

        Map<UUID, User> userCache = new HashMap<>();
        for (QnaAnswer sa : sharedAnswers) {
            if (user != null && user.getId().equals(sa.getUserId())) continue;
            User author = userCache.computeIfAbsent(sa.getUserId(), id -> userRepository.findById(id).orElse(null));
            String name = author != null ? (author.getDisplayName() != null ? author.getDisplayName() : author.getName()) : "Teammate";
            String handle = author != null && author.getUsername() != null ? author.getUsername() : name;

            sharedMap.computeIfAbsent(sa.getHash(), k -> new ArrayList<>())
                    .add(new QnaTeammateAnswerDto(sa.getUserId(), name, handle, sa.getOwnAnswer(), sa.getUpdatedAt()));
        }

        return items.stream()
                .map(it -> toDto(roomId, it, user, userMasteryMap, teamMasteryMap, userAnswers, sharedMap.getOrDefault(it.getHash(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    private QnaItemDto toDto(
            UUID roomId,
            QnaItem it,
            User user,
            Map<String, Integer> userMasteryMap,
            Map<String, Integer> teamMasteryMap,
            Map<String, QnaAnswer> userAnswers,
            List<QnaTeammateAnswerDto> shared
    ) {
        int myMastery = userMasteryMap.getOrDefault(it.getHash(), 0);
        int teamMastery = teamMasteryMap.getOrDefault(it.getHash(), 0);

        QnaAnswer myAns = userAnswers.get(it.getHash());
        String myOwn = myAns != null ? myAns.getOwnAnswer() : null;
        boolean myShared = myAns != null && myAns.isShared();

        return new QnaItemDto(
                it.getId(),
                it.getHash(),
                it.getKind(),
                it.getCategory(),
                it.getCriterion(),
                it.getQuestion(),
                it.getAnswer(),
                it.getFollowup(),
                it.getCounter(),
                it.getProof(),
                it.getOwnerUserId(),
                it.getOwnerHandle(),
                it.getSource(),
                myMastery,
                teamMastery,
                myOwn,
                myShared,
                shared,
                it.getPosition()
        );
    }

    private Map<String, Integer> getTeamMasteryMap(UUID roomId) {
        List<Object[]> rows = progressRepository.findTeamMasteryByRoomId(roomId);
        Map<String, Integer> map = new HashMap<>();
        for (Object[] r : rows) {
            if (r.length >= 2 && r[0] != null && r[1] != null) {
                map.put((String) r[0], ((Number) r[1]).intValue());
            }
        }
        return map;
    }

    private List<BriefRubricItem> getRubricCriteria(UUID roomId) {
        List<BriefRubricItem> items = briefRubricItemRepository.findByRoomIdOrderByOrderIndexAsc(roomId);
        if (items != null && !items.isEmpty()) {
            return items;
        }
        return List.of(
                new BriefRubricItem(null, "Problem and Impact", 25, 0),
                new BriefRubricItem(null, "Technical Depth", 30, 1),
                new BriefRubricItem(null, "Execution and Demo", 25, 2),
                new BriefRubricItem(null, "Originality", 20, 3)
        );
    }
}
