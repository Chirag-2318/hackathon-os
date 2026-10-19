package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.pitchkit.PitchDtos.PitchBeatDto;
import com.hackathonos.backend.pitchkit.RehearsalDtos.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RehearsalService {

    private static final Logger log = LoggerFactory.getLogger(RehearsalService.class);

    private static final Set<String> STOPWORDS = Set.of(
            "about", "after", "again", "against", "before", "being", "between",
            "could", "doing", "during", "having", "other", "should", "their",
            "there", "these", "those", "through", "under", "until",
            "while", "would", "first", "every", "where", "which", "whose"
    );

    private static final List<String> FILLER_PATTERNS = List.of(
            "\\bum\\b", "\\buh\\b", "\\berm\\b", "\\blike\\b", "\\byou know\\b",
            "\\bbasically\\b", "\\bactually\\b", "\\bsort of\\b", "\\bkind of\\b"
    );

    private final RehearsalRepository rehearsalRepository;
    private final PitchService pitchService;
    private final PitchSettingsRepository pitchSettingsRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricItemRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final RoomEventService roomEventService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    // Rate limiter maps: rehearsalId -> uploadCount, userId -> List of coach call timestamps
    private final ConcurrentHashMap<UUID, Integer> uploadCountMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, List<Instant>> coachCallMap = new ConcurrentHashMap<>();

    public RehearsalService(
            RehearsalRepository rehearsalRepository,
            PitchService pitchService,
            PitchSettingsRepository pitchSettingsRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricItemRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            RoomEventService roomEventService,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.rehearsalRepository = rehearsalRepository;
        this.pitchService = pitchService;
        this.pitchSettingsRepository = pitchSettingsRepository;
        this.briefRepository = briefRepository;
        this.rubricItemRepository = rubricItemRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.roomEventService = roomEventService;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public StartRehearsalResponse startRehearsal(UUID roomId, StartRehearsalRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        var pitch = pitchService.getPitch(roomId, user);
        List<PitchBeatDto> allBeats = pitch.beats();

        String scope = req.scope() != null ? req.scope().toUpperCase() : "FULL";
        List<PitchBeatDto> targetBeats = new ArrayList<>();

        if ("MY_BEATS".equals(scope)) {
            UUID myId = user != null ? user.getId() : null;
            if (myId != null) {
                targetBeats = allBeats.stream()
                        .filter(b -> myId.equals(b.speakerUserId()))
                        .collect(Collectors.toList());
            }
            if (targetBeats.isEmpty()) targetBeats = allBeats;
        } else if ("ONE_BEAT".equals(scope)) {
            if (req.beatIds() != null && !req.beatIds().isEmpty()) {
                String targetId = req.beatIds().get(0);
                targetBeats = allBeats.stream()
                        .filter(b -> targetId.equals(b.id()))
                        .collect(Collectors.toList());
            }
            if (targetBeats.isEmpty() && !allBeats.isEmpty()) {
                targetBeats = List.of(allBeats.get(0));
            }
        } else {
            scope = "FULL";
            targetBeats = allBeats;
        }

        long plannedMs = targetBeats.stream().mapToLong(b -> b.durationSec() * 1000L).sum();
        String mode = req.mode() != null && "VOICE".equalsIgnoreCase(req.mode()) ? "VOICE" : "TIMED";

        Rehearsal rehearsal = new Rehearsal(roomId, user != null ? user.getId() : UUID.randomUUID(),
                pitch.version(), mode, scope, plannedMs);
        rehearsalRepository.save(rehearsal);

        return new StartRehearsalResponse(rehearsal.getId(), targetBeats, pitch.timeLimitSec());
    }

    @Transactional
    public Map<String, String> uploadAudio(UUID roomId, UUID rehearsalId, String beatId, MultipartFile file, User user) {
        roomAccess.requireMember(roomId, user);

        Rehearsal rehearsal = rehearsalRepository.findByIdAndRoomId(rehearsalId, roomId)
                .orElseThrow(() -> new NotFoundException("REHEARSAL_NOT_FOUND", "Rehearsal run not found."));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_AUDIO", "Audio file is empty.");
        }

        // Limit: 5 MB
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("FILE_TOO_LARGE", "Audio chunk exceeds the 5 MB limit.");
        }

        // Rate limit: 30 uploads per rehearsal run
        int currentUploads = uploadCountMap.compute(rehearsalId, (k, v) -> v == null ? 1 : v + 1);
        if (currentUploads > 30) {
            throw new TooManyRequestsException("UPLOAD_LIMIT", "Maximum of 30 audio uploads per rehearsal run reached.", 60);
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BadRequestException("INVALID_FILE", "Could not read audio stream: " + e.getMessage());
        }

        // Verify magic bytes: webm, ogg, mp4, wav
        if (!isSupportedAudio(bytes)) {
            throw new BadRequestException("INVALID_AUDIO_TYPE", "Audio must be webm, ogg, mp4, or wav.");
        }

        // Construct prompt hint: project name, rubric words, team handles
        String promptHint = buildPromptHint(roomId);

        // Transcribe through AI gateway with acting user's key
        String text;
        try {
            text = aiService.transcribeAudio(user != null ? user.getId() : null, file.getOriginalFilename(), bytes, promptHint);
        } catch (Exception e) {
            log.warn("STT transcription error: {}", e.getMessage());
            throw e;
        }

        // Store transcript text (audio bytes are discarded immediately)
        Map<String, String> transcriptMap = deserializeTranscript(rehearsal.getTranscript());
        transcriptMap.put(beatId, text != null ? text.trim() : "");
        rehearsal.setTranscript(serializeTranscript(transcriptMap));
        rehearsalRepository.save(rehearsal);

        return Map.of("text", text != null ? text.trim() : "");
    }

    @Transactional
    public RehearsalDetailResponse finishRehearsal(UUID roomId, UUID rehearsalId, FinishRehearsalRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        Rehearsal rehearsal = rehearsalRepository.findByIdAndRoomId(rehearsalId, roomId)
                .orElseThrow(() -> new NotFoundException("REHEARSAL_NOT_FOUND", "Rehearsal run not found."));

        var pitch = pitchService.getPitch(roomId, user);
        Map<String, PitchBeatDto> beatsMap = pitch.beats().stream()
                .collect(Collectors.toMap(PitchBeatDto::id, b -> b, (a, b) -> a));

        List<BeatTimingDto> timings = req.beatTimings() != null ? req.beatTimings() : Collections.emptyList();
        List<StumbleDto> stumbles = req.stumbles() != null ? req.stumbles() : Collections.emptyList();
        Map<String, String> transcripts = deserializeTranscript(rehearsal.getTranscript());

        // 1. Calculate duration and beat metrics
        long totalActualMs = 0;
        int totalWords = 0;
        int totalFillers = 0;
        int totalCoverageSum = 0;
        String slowestBeatId = null;
        long slowestDeltaMs = Long.MIN_VALUE;

        List<BeatMetricDto> beatMetrics = new ArrayList<>();

        for (BeatTimingDto t : timings) {
            totalActualMs += t.actualMs();
            long delta = t.actualMs() - t.plannedMs();
            if (delta > slowestDeltaMs) {
                slowestDeltaMs = delta;
                slowestBeatId = t.beatId();
            }

            String beatText = transcripts.getOrDefault(t.beatId(), "");
            int wordCount = countWords(beatText);
            totalWords += wordCount;

            double sec = Math.max(1, t.actualMs() / 1000.0);
            int wpm = (int) Math.round(wordCount / (sec / 60.0));

            int fillerCount = countFillers(beatText);
            totalFillers += fillerCount;

            PitchBeatDto beatDto = beatsMap.get(t.beatId());
            String sayText = beatDto != null ? beatDto.say() : "";
            KeyTermsAnalysis termsAnalysis = analyzeKeyTerms(sayText, beatText);

            totalCoverageSum += termsAnalysis.coveragePct();

            beatMetrics.add(new BeatMetricDto(
                    t.beatId(),
                    wpm,
                    fillerCount,
                    termsAnalysis.coveragePct(),
                    termsAnalysis.missedPhrases(),
                    delta
            ));
        }

        double totalSec = Math.max(1, totalActualMs / 1000.0);
        int overallWpm = (int) Math.round(totalWords / (totalSec / 60.0));
        double fillersPerMin = Math.round((totalFillers / (totalSec / 60.0)) * 10.0) / 10.0;
        int overallCoverage = timings.isEmpty() ? 0 : totalCoverageSum / timings.size();
        long totalDelta = totalActualMs - rehearsal.getPlannedMs();

        RehearsalMetricsDto metricsDto = new RehearsalMetricsDto(
                overallWpm,
                totalFillers,
                fillersPerMin,
                overallCoverage,
                stumbles.size(),
                totalDelta,
                slowestBeatId,
                slowestDeltaMs == Long.MIN_VALUE ? 0 : slowestDeltaMs,
                beatMetrics
        );

        // Completion pct
        int totalScopeBeats = Math.max(1, pitch.beats().size());
        int completionPct = Math.min(100, (int) Math.round((timings.size() / (double) totalScopeBeats) * 100));
        boolean isComplete = "COMPLETE".equalsIgnoreCase(req.endedReason()) && completionPct >= 80;

        rehearsal.setEndedAt(Instant.now());
        rehearsal.setDurationMs(totalActualMs);
        rehearsal.setCompleted(isComplete);
        rehearsal.setCompletionPct(completionPct);
        rehearsal.setBeatTimings(serializeJson(timings));
        rehearsal.setStumbles(serializeJson(stumbles));
        rehearsal.setMetrics(serializeJson(metricsDto));
        rehearsalRepository.save(rehearsal);

        // Readiness counting check
        int pitchLimitSec = pitch.timeLimitSec() > 0 ? pitch.timeLimitSec() : 180;
        boolean countsTowardReadiness = "FULL".equals(rehearsal.getScope())
                && completionPct >= 80
                && totalActualMs >= (pitchLimitSec * 500L); // at least 50% of time limit

        if (countsTowardReadiness) {
            roomEventService.recordEvent(roomId, "pitch.rehearsal", "rehearsal", rehearsal.getId().toString(), user != null ? user.getId() : null);
        }

        RehearsalDeltaDto delta = computeDeltas(rehearsal, user != null ? user.getId() : null);

        return toDetailResponse(rehearsal, delta, pitch.beats(), countsTowardReadiness);
    }

    @Transactional
    public CoachFeedbackDto getCoachFeedback(UUID roomId, UUID rehearsalId, User user) {
        roomAccess.requireMember(roomId, user);

        Rehearsal rehearsal = rehearsalRepository.findByIdAndRoomId(rehearsalId, roomId)
                .orElseThrow(() -> new NotFoundException("REHEARSAL_NOT_FOUND", "Rehearsal run not found."));

        // If already cached, return immediately
        if (rehearsal.getCoach() != null && !rehearsal.getCoach().isBlank()) {
            try {
                return objectMapper.readValue(rehearsal.getCoach(), CoachFeedbackDto.class);
            } catch (Exception ignored) {}
        }

        // Rate limit: 6 coach calls per hour per user
        UUID userId = user != null ? user.getId() : rehearsal.getUserId();
        enforceCoachRateLimit(userId);

        var pitch = pitchService.getPitch(roomId, user);
        RehearsalMetricsDto metrics = deserializeMetrics(rehearsal.getMetrics());
        Map<String, String> transcript = deserializeTranscript(rehearsal.getTranscript());

        String systemPrompt = """
            You are a blunt, experienced hackathon judge and pitch coach.
            Analyze the speaker's rehearsal delivery, pace, timing budget, and script terms.
            Do not offer empty flattery or praise without evidence.
            Give actionable drills.
            Output valid JSON only with keys:
            - worked: array of up to 3 strings (things that genuinely succeeded with evidence)
            - fix: array of up to 3 objects with { issue: string, evidence: string, drill: string }
            - oneDrill: string (single most important drill to do before taking the stage)
            """;

        String userPrompt = String.format("""
            Target time limit: %d seconds. Actual duration: %d seconds (%d%% completed).
            Overall pace: %d WPM (target band: 130-170 WPM).
            Filler words: %d (%.1f per min).
            Script coverage: %d%%.
            Total stumbles stamped: %d.
            Beats and transcripts: %s
            """,
                pitch.timeLimitSec(),
                rehearsal.getDurationMs() / 1000,
                rehearsal.getCompletionPct(),
                metrics != null ? metrics.overallWpm() : 0,
                metrics != null ? metrics.totalFillers() : 0,
                metrics != null ? metrics.fillersPerMin() : 0.0,
                metrics != null ? metrics.overallCoveragePct() : 0,
                metrics != null ? metrics.totalStumbles() : 0,
                serializeJson(transcript)
        );

        CoachFeedbackDto feedback = aiService.json("pitch.feedback", roomId, userId, systemPrompt, userPrompt, CoachFeedbackDto.class);
        if (feedback == null) {
            feedback = new CoachFeedbackDto(
                    List.of("Speech completed within the time frame."),
                    List.of(new CoachFixItem("Pacing drift", "Pacing fluctuated over target band", "Practice with metronome at 150 wpm.")),
                    "Run beat 2 again focusing on crisp phrase terminations."
            );
        }

        rehearsal.setCoach(serializeJson(feedback));
        rehearsalRepository.save(rehearsal);

        return feedback;
    }

    @Transactional(readOnly = true)
    public List<RehearsalSummaryResponse> listRehearsals(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<Rehearsal> list = rehearsalRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
        int pitchLimitSec = pitchSettingsRepository.findById(roomId)
                .map(s -> s.getPitchLimitSec() > 0 ? s.getPitchLimitSec() : 180)
                .orElse(180);

        List<RehearsalSummaryResponse> result = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            Rehearsal r = list.get(i);
            Rehearsal prev = findPreviousRunByUser(list, r.getUserId(), i);
            RehearsalDeltaDto delta = prev != null ? computeRunDeltas(r, prev) : null;

            boolean counts = "FULL".equals(r.getScope())
                    && r.getCompletionPct() >= 80
                    && r.getDurationMs() >= (pitchLimitSec * 500L);

            String userName = resolveUserName(r.getUserId());
            result.add(new RehearsalSummaryResponse(
                    r.getId(),
                    r.getRoomId(),
                    r.getUserId(),
                    userName,
                    r.getMode(),
                    r.getScope(),
                    r.getStartedAt(),
                    r.getDurationMs(),
                    r.getPlannedMs(),
                    r.isCompleted(),
                    r.getCompletionPct(),
                    counts,
                    delta
            ));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public RehearsalDetailResponse getRehearsal(UUID roomId, UUID rehearsalId, User user) {
        roomAccess.requireMember(roomId, user);

        Rehearsal r = rehearsalRepository.findByIdAndRoomId(rehearsalId, roomId)
                .orElseThrow(() -> new NotFoundException("REHEARSAL_NOT_FOUND", "Rehearsal not found."));

        var pitch = pitchService.getPitch(roomId, user);
        int pitchLimitSec = pitch.timeLimitSec() > 0 ? pitch.timeLimitSec() : 180;
        boolean counts = "FULL".equals(r.getScope())
                && r.getCompletionPct() >= 80
                && r.getDurationMs() >= (pitchLimitSec * 500L);

        RehearsalDeltaDto delta = computeDeltas(r, r.getUserId());

        return toDetailResponse(r, delta, pitch.beats(), counts);
    }

    @Transactional
    public void deleteRehearsal(UUID roomId, UUID rehearsalId, User user) {
        roomAccess.requireMember(roomId, user);

        Rehearsal r = rehearsalRepository.findByIdAndRoomId(rehearsalId, roomId)
                .orElseThrow(() -> new NotFoundException("REHEARSAL_NOT_FOUND", "Rehearsal not found."));

        boolean isLeader = user != null && roomAccess.isLeader(roomId, user.getId());
        if (user != null && !user.getId().equals(r.getUserId()) && !isLeader) {
            throw new ForbiddenException("CANNOT_DELETE_OTHERS_REHEARSAL", "You can only delete your own rehearsals.");
        }

        rehearsalRepository.delete(r);
        roomEventService.recordEvent(roomId, "pitch.rehearsal", "rehearsal", rehearsalId.toString(), user != null ? user.getId() : null);
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────────

    private boolean isSupportedAudio(byte[] b) {
        if (b == null || b.length < 4) return false;
        // WebM: 1A 45 DF A3
        if ((b[0] & 0xFF) == 0x1A && (b[1] & 0xFF) == 0x45 && (b[2] & 0xFF) == 0xDF && (b[3] & 0xFF) == 0xA3) return true;
        // Ogg: 4F 67 67 53 ("OggS")
        if (b[0] == 'O' && b[1] == 'g' && b[2] == 'g' && b[3] == 'S') return true;
        // WAV: "RIFF"
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F') return true;
        // MP4 / M4A: contains "ftyp" in first 16 bytes
        String header = new String(b, 0, Math.min(b.length, 32));
        if (header.contains("ftyp")) return true;

        return false;
    }

    private String buildPromptHint(UUID roomId) {
        StringBuilder sb = new StringBuilder();
        try {
            Room room = roomAccess.getActiveRoomOrThrow(roomId);
            if (room.getName() != null) sb.append(room.getName()).append(" ");
        } catch (Exception ignored) {}

        try {
            briefRepository.findByRoomId(roomId).ifPresent(brief -> {
                List<BriefRubricItem> rubrics = rubricItemRepository.findByBriefIdOrderByPositionAsc(brief.getId());
                for (BriefRubricItem item : rubrics) {
                    sb.append(item.getCriterion()).append(" ");
                }
            });
        } catch (Exception ignored) {}

        return sb.toString().trim();
    }

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }

    private int countFillers(String text) {
        if (text == null || text.isBlank()) return 0;
        int count = 0;
        for (String regex : FILLER_PATTERNS) {
            Matcher m = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(text);
            while (m.find()) count++;
        }
        return count;
    }

    private record KeyTermsAnalysis(int coveragePct, List<String> missedPhrases) {}

    private KeyTermsAnalysis analyzeKeyTerms(String sayText, String transcript) {
        if (sayText == null || sayText.isBlank()) return new KeyTermsAnalysis(100, Collections.emptyList());

        String[] tokens = sayText.toLowerCase().split("[^a-z0-9]+");
        Set<String> keyTerms = new LinkedHashSet<>();
        for (String t : tokens) {
            if (t.length() >= 5 && !STOPWORDS.contains(t)) {
                keyTerms.add(t);
            }
        }

        if (keyTerms.isEmpty()) return new KeyTermsAnalysis(100, Collections.emptyList());

        String trLower = transcript != null ? transcript.toLowerCase() : "";
        List<String> missed = new ArrayList<>();
        int matched = 0;

        for (String term : keyTerms) {
            if (trLower.contains(term)) {
                matched++;
            } else if (missed.size() < 5) {
                missed.add(term);
            }
        }

        int pct = (int) Math.round((matched / (double) keyTerms.size()) * 100);
        return new KeyTermsAnalysis(pct, missed);
    }

    private void enforceCoachRateLimit(UUID userId) {
        if (userId == null) return;
        Instant hourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        List<Instant> calls = coachCallMap.computeIfAbsent(userId, k -> new ArrayList<>());
        synchronized (calls) {
            calls.removeIf(t -> t.isBefore(hourAgo));
            if (calls.size() >= 6) {
                throw new TooManyRequestsException("COACH_RATE_LIMIT",
                        "AI coach limit reached (max 6 per hour). Please wait before requesting another review.", 300);
            }
            calls.add(Instant.now());
        }
    }

    private Rehearsal findPreviousRunByUser(List<Rehearsal> all, UUID userId, int currentIndex) {
        for (int i = currentIndex + 1; i < all.size(); i++) {
            Rehearsal cand = all.get(i);
            if (userId != null && userId.equals(cand.getUserId())) {
                return cand;
            }
        }
        return null;
    }

    private RehearsalDeltaDto computeDeltas(Rehearsal current, UUID userId) {
        List<Rehearsal> list = rehearsalRepository.findByRoomIdAndUserIdOrderByCreatedAtDesc(current.getRoomId(), userId);
        Rehearsal prev = null;
        for (Rehearsal r : list) {
            if (!r.getId().equals(current.getId()) && r.getCreatedAt().isBefore(current.getCreatedAt())) {
                prev = r;
                break;
            }
        }
        return prev != null ? computeRunDeltas(current, prev) : null;
    }

    private RehearsalDeltaDto computeRunDeltas(Rehearsal cur, Rehearsal prev) {
        RehearsalMetricsDto curM = deserializeMetrics(cur.getMetrics());
        RehearsalMetricsDto prevM = deserializeMetrics(prev.getMetrics());

        Integer wpmDelta = (curM != null && prevM != null) ? curM.overallWpm() - prevM.overallWpm() : null;
        Long durationDelta = cur.getDurationMs() - prev.getDurationMs();
        Integer fillersDelta = (curM != null && prevM != null) ? curM.totalFillers() - prevM.totalFillers() : null;
        Integer coverageDelta = (curM != null && prevM != null) ? curM.overallCoveragePct() - prevM.overallCoveragePct() : null;

        return new RehearsalDeltaDto(wpmDelta, durationDelta, fillersDelta, coverageDelta);
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return "Teammate";
        return userRepository.findById(userId).map(User::getDisplayName).orElse("Teammate");
    }

    private String serializeJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, String> deserializeTranscript(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private String serializeTranscript(Map<String, String> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private RehearsalMetricsDto deserializeMetrics(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, RehearsalMetricsDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private CoachFeedbackDto deserializeCoach(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, CoachFeedbackDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private List<BeatTimingDto> deserializeTimings(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<BeatTimingDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<StumbleDto> deserializeStumbles(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<StumbleDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private RehearsalDetailResponse toDetailResponse(Rehearsal r, RehearsalDeltaDto delta, List<PitchBeatDto> beats, boolean counts) {
        String userName = resolveUserName(r.getUserId());
        List<BeatTimingDto> timings = deserializeTimings(r.getBeatTimings());
        List<StumbleDto> stumbles = deserializeStumbles(r.getStumbles());
        Map<String, String> transcript = deserializeTranscript(r.getTranscript());
        RehearsalMetricsDto metrics = deserializeMetrics(r.getMetrics());
        CoachFeedbackDto coach = deserializeCoach(r.getCoach());

        return new RehearsalDetailResponse(
                r.getId(),
                r.getRoomId(),
                r.getUserId(),
                userName,
                r.getPitchVersion(),
                r.getMode(),
                r.getScope(),
                r.getStartedAt(),
                r.getEndedAt(),
                r.getDurationMs(),
                r.getPlannedMs(),
                r.isCompleted(),
                r.getCompletionPct(),
                counts,
                timings,
                stumbles,
                transcript,
                metrics,
                coach,
                delta,
                beats
        );
    }
}
