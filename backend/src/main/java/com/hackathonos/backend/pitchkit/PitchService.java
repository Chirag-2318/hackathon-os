package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.*;
import com.hackathonos.backend.docs.dto.DocDetailDto;
import com.hackathonos.backend.docs.dto.DocRequests.UpdateDocRequest;
import com.hackathonos.backend.pitchkit.PitchDtos.*;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class PitchService {

    private static final Logger log = LoggerFactory.getLogger(PitchService.class);

    private final PitchRepository pitchRepository;
    private final PitchVersionRepository pitchVersionRepository;
    private final PitchSettingsRepository pitchSettingsRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final DocService docService;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricItemRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final RoomEventService roomEventService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public PitchService(
            PitchRepository pitchRepository,
            PitchVersionRepository pitchVersionRepository,
            PitchSettingsRepository pitchSettingsRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            DocService docService,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricItemRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            RoomEventService roomEventService,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.pitchRepository = pitchRepository;
        this.pitchVersionRepository = pitchVersionRepository;
        this.pitchSettingsRepository = pitchSettingsRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.docService = docService;
        this.briefRepository = briefRepository;
        this.rubricItemRepository = rubricItemRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.roomEventService = roomEventService;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public PitchDetailResponse getPitch(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Optional<Pitch> existingOpt = pitchRepository.findById(roomId);
        if (existingOpt.isPresent()) {
            return toDetailResponse(existingOpt.get());
        }

        // First read: create from DEMO_SCRIPT.md if it exists, else default structure
        return initPitchFromDocOrDefault(roomId, user);
    }

    @Transactional
    public PitchDetailResponse updatePitch(UUID roomId, UpdatePitchRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        Pitch pitch = pitchRepository.findById(roomId).orElseGet(() -> {
            initPitchFromDocOrDefault(roomId, user);
            return pitchRepository.findById(roomId).orElseThrow();
        });

        // Concurrency check
        if (req.expectedVersion() != null && req.expectedVersion() != pitch.getVersion()) {
            String lastEditorName = resolveUserName(pitch.getUpdatedBy());
            throw new ConflictException("PITCH_CONFLICT",
                    "Pitch was modified by @" + lastEditorName + ". Please reload the latest changes.");
        }

        // Locked check
        pitchSettingsRepository.findById(roomId).ifPresent(settings -> {
            if (settings.isLocked()) {
                roomAccess.requireLeader(roomId, user);
            }
        });

        List<PitchBeatDto> beats = req.beats() != null ? req.beats() : deserializeBeats(pitch.getBeats());
        validateBeats(beats);

        int timeLimit = req.timeLimitSec() != null && req.timeLimitSec() > 0 ? req.timeLimitSec() : pitch.getTimeLimitSec();
        int nextVersion = pitch.getVersion() + 1;
        String serialized = serializeBeats(beats);

        pitch.setVersion(nextVersion);
        pitch.setBeats(serialized);
        pitch.setTimeLimitSec(timeLimit);
        pitch.setSource("CUSTOM");
        pitch.setUpdatedBy(user != null ? user.getId() : null);
        pitch.setUpdatedAt(Instant.now());
        pitchRepository.save(pitch);

        // Save pitch version row
        String editorName = user != null ? user.getDisplayName() : "Teammate";
        PitchVersion pv = new PitchVersion(roomId, nextVersion, serialized, "Edited by @" + editorName, user != null ? user.getId() : null);
        pitchVersionRepository.save(pv);
        pitchVersionRepository.pruneOlderVersions(roomId, 20);

        roomEventService.recordEvent(roomId, "pitch.updated", "pitch", roomId.toString(), user != null ? user.getId() : null);

        return toDetailResponse(pitch);
    }

    @Transactional
    public PullFromDocResponse pullFromDoc(UUID roomId, boolean confirm, User user) {
        roomAccess.requireMember(roomId, user);

        Pitch pitch = pitchRepository.findById(roomId).orElseGet(() -> {
            initPitchFromDocOrDefault(roomId, user);
            return pitchRepository.findById(roomId).orElseThrow();
        });

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md")
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "DEMO_SCRIPT.md does not exist for this room."));

        String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                .map(DocVersion::getContent)
                .orElse("");

        if (content.isBlank()) {
            throw new BadRequestException("DOC_EMPTY", "DEMO_SCRIPT.md is empty.");
        }

        List<PitchBeatDto> docBeats = parseBeatsFromDoc(content);
        if (docBeats.isEmpty()) {
            throw new BadRequestException("NO_BEATS", "Could not parse any beats from DEMO_SCRIPT.md.");
        }

        List<PitchBeatDto> currentBeats = deserializeBeats(pitch.getBeats());
        String diffSummary = generateDiffSummary(currentBeats, docBeats);

        if (!confirm) {
            return new PullFromDocResponse(diffSummary, docBeats, false, pitch.getVersion());
        }

        // Locked check
        pitchSettingsRepository.findById(roomId).ifPresent(settings -> {
            if (settings.isLocked()) {
                roomAccess.requireLeader(roomId, user);
            }
        });

        int nextVersion = pitch.getVersion() + 1;
        String serialized = serializeBeats(docBeats);
        int parsedLimit = parseTimeLimit(content);
        if (parsedLimit > 0) {
            pitch.setTimeLimitSec(parsedLimit);
        }

        pitch.setVersion(nextVersion);
        pitch.setBeats(serialized);
        pitch.setSource("DOC");
        pitch.setDocVersion(doc.getCurrentVersion());
        pitch.setUpdatedBy(user != null ? user.getId() : null);
        pitch.setUpdatedAt(Instant.now());
        pitchRepository.save(pitch);

        PitchVersion pv = new PitchVersion(roomId, nextVersion, serialized,
                "Pulled from DEMO_SCRIPT.md v" + doc.getCurrentVersion(), user != null ? user.getId() : null);
        pitchVersionRepository.save(pv);
        pitchVersionRepository.pruneOlderVersions(roomId, 20);

        roomEventService.recordEvent(roomId, "pitch.updated", "pitch", roomId.toString(), user != null ? user.getId() : null);

        return new PullFromDocResponse(diffSummary, docBeats, true, nextVersion);
    }

    @Transactional
    public PushToDocResponse pushToDoc(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Pitch pitch = pitchRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("PITCH_NOT_FOUND", "Pitch has not been initialized."));

        Doc doc = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md")
                .orElseThrow(() -> new NotFoundException("DOC_NOT_FOUND", "DEMO_SCRIPT.md does not exist for this room."));

        String currentDocContent = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                .map(DocVersion::getContent)
                .orElse("");

        List<PitchBeatDto> beats = deserializeBeats(pitch.getBeats());
        String newScriptSection = formatBeatsToMarkdown(beats);

        String updatedContent = rewriteScriptSection(currentDocContent, newScriptSection);

        UpdateDocRequest updateReq = new UpdateDocRequest(
                updatedContent,
                "Updated pitch script from Pitch Kit (v" + pitch.getVersion() + ")",
                doc.getCurrentVersion()
        );

        DocDetailDto updatedDoc = docService.updateDoc(roomId, "DEMO_SCRIPT.md", updateReq, user);

        pitch.setDocVersion(updatedDoc.currentVersion());
        pitchRepository.save(pitch);

        return new PushToDocResponse(updatedDoc.currentVersion());
    }

    @Transactional(readOnly = true)
    public List<PitchVersionSummary> getVersions(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<PitchVersion> versions = pitchVersionRepository.findByRoomIdOrderByVersionDesc(roomId);
        return versions.stream().map(v -> {
            List<PitchBeatDto> beats = deserializeBeats(v.getBeats());
            String authorName = resolveUserName(v.getCreatedBy());
            return new PitchVersionSummary(
                    v.getId(),
                    v.getVersion(),
                    v.getNote(),
                    v.getCreatedBy(),
                    authorName,
                    v.getCreatedAt(),
                    beats.size()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public PitchDetailResponse restoreVersion(UUID roomId, int targetVersion, User user) {
        roomAccess.requireMember(roomId, user);

        // Locked check
        pitchSettingsRepository.findById(roomId).ifPresent(settings -> {
            if (settings.isLocked()) {
                roomAccess.requireLeader(roomId, user);
            }
        });

        PitchVersion pv = pitchVersionRepository.findByRoomIdAndVersion(roomId, targetVersion)
                .orElseThrow(() -> new NotFoundException("VERSION_NOT_FOUND", "Version " + targetVersion + " not found."));

        Pitch pitch = pitchRepository.findById(roomId).orElseThrow();

        int nextVersion = pitch.getVersion() + 1;
        pitch.setVersion(nextVersion);
        pitch.setBeats(pv.getBeats());
        pitch.setSource("CUSTOM");
        pitch.setUpdatedBy(user != null ? user.getId() : null);
        pitch.setUpdatedAt(Instant.now());
        pitchRepository.save(pitch);

        String author = user != null ? user.getDisplayName() : "Teammate";
        PitchVersion newVer = new PitchVersion(roomId, nextVersion, pv.getBeats(),
                "Restored from version " + targetVersion + " by @" + author, user != null ? user.getId() : null);
        pitchVersionRepository.save(newVer);
        pitchVersionRepository.pruneOlderVersions(roomId, 20);

        roomEventService.recordEvent(roomId, "pitch.updated", "pitch", roomId.toString(), user != null ? user.getId() : null);

        return toDetailResponse(pitch);
    }

    @Transactional(readOnly = true)
    public List<RubricCoverageDto> getCoverage(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        if (briefOpt.isEmpty()) return Collections.emptyList();

        List<BriefRubricItem> rubricItems = rubricItemRepository.findByBriefIdOrderByPositionAsc(briefOpt.get().getId());
        if (rubricItems.isEmpty()) return Collections.emptyList();

        Pitch pitch = pitchRepository.findById(roomId).orElse(null);
        List<PitchBeatDto> beats = pitch != null ? deserializeBeats(pitch.getBeats()) : Collections.emptyList();

        List<RubricCoverageDto> coverageList = new ArrayList<>();
        for (BriefRubricItem item : rubricItems) {
            String crit = item.getCriterion();
            List<String> keywords = extractKeywords(crit);

            List<MatchingBeatDto> matches = new ArrayList<>();
            for (PitchBeatDto beat : beats) {
                String searchBody = ((beat.title() != null ? beat.title() : "") + " " +
                        (beat.say() != null ? beat.say() : "") + " " +
                        (beat.show() != null ? beat.show() : "")).toLowerCase();

                boolean matched = keywords.stream().anyMatch(kw -> searchBody.contains(kw));
                if (matched) {
                    matches.add(new MatchingBeatDto(beat.id(), beat.title()));
                }
            }

            coverageList.add(new RubricCoverageDto(item.getCriterion(), item.getWeight(), matches));
        }

        return coverageList;
    }

    @Transactional(readOnly = true)
    public PitchAiEditResponse aiEdit(UUID roomId, PitchAiEditRequest req, User user) {
        roomAccess.requireMember(roomId, user);

        String action = req.action() != null ? req.action().trim() : "Tighten to fit";
        String sayText = req.beatSay() != null ? req.beatSay().trim() : "";
        String title = req.title() != null ? req.title().trim() : "Beat";
        int targetSeconds = req.targetSeconds() != null && req.targetSeconds() > 0 ? req.targetSeconds() : 20;
        int targetWords = Math.max(10, (int) Math.round((targetSeconds / 60.0) * 150));

        String systemPrompt = """
            You are an expert pitch coach and speech editor.
            You edit hackathon pitch script beats to be high-impact, authentic, and precisely timed.
            Return ONLY the replacement text for the speaker to say. Do not add markdown commentary, intro, or quotes.
            """;

        String userPrompt;
        switch (action) {
            case "Punchier" -> userPrompt = String.format(
                    "Beat title: %s\nOriginal speech:\n\"%s\"\n\nMake this speech punchier: use active voice, sharper phrasing, and high-impact delivery while preserving the facts. Output only the revised text.",
                    title, sayText);
            case "Explain the jargon" -> userPrompt = String.format(
                    "Beat title: %s\nOriginal speech:\n\"%s\"\n\nTranslate technical jargon or obscure acronyms into clear, plain words a generalist hackathon judge can immediately grasp. Output only the revised text.",
                    title, sayText);
            default -> userPrompt = String.format(
                    "Beat title: %s\nTarget speech duration: %d seconds (target ~%d words at 150 wpm)\nOriginal speech:\n\"%s\"\n\nTighten this speech so it fits comfortably in %d words without losing key facts. Output only the revised text.",
                    title, targetSeconds, targetWords, sayText, targetWords);
        }

        String proposed = aiService.text("pitch.edit", roomId, user != null ? user.getId() : null, systemPrompt, userPrompt);
        if (proposed != null) {
            proposed = proposed.replaceAll("^[\"']|[\"']$", "").trim();
        } else {
            proposed = sayText;
        }

        return new PitchAiEditResponse(proposed, "");
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────────

    private PitchDetailResponse initPitchFromDocOrDefault(UUID roomId, User user) {
        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
        List<PitchBeatDto> initialBeats = new ArrayList<>();
        int timeLimit = 180;
        String source = "CUSTOM";
        Integer docVersion = null;

        if (docOpt.isPresent()) {
            Doc doc = docOpt.get();
            docVersion = doc.getCurrentVersion();
            String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                    .map(DocVersion::getContent)
                    .orElse("");

            if (!content.isBlank()) {
                List<PitchBeatDto> parsed = parseBeatsFromDoc(content);
                if (!parsed.isEmpty()) {
                    initialBeats = parsed;
                    source = "DOC";
                    int docLimit = parseTimeLimit(content);
                    if (docLimit > 0) timeLimit = docLimit;
                }
            }
        }

        // If no beats from doc, create standard 3-beat default
        if (initialBeats.isEmpty()) {
            initialBeats = List.of(
                    new PitchBeatDto(UUID.randomUUID().toString(), "Hook", 15, "Here is what happens when real users face this problem.", "Hero demo screenshot", "Switch to live browser", null, null),
                    new PitchBeatDto(UUID.randomUUID().toString(), "Problem & Solution", 90, "Our architecture solves this through three core flows.", "Feature interactive walkthrough", "Click submit button", null, null),
                    new PitchBeatDto(UUID.randomUUID().toString(), "Call to action", 15, "We built this in 36 hours and it is live today.", "Repository link & QR code", "End screen", null, null)
            );
        }

        // Try getting format limit from pitch_settings
        var settingsOpt = pitchSettingsRepository.findById(roomId);
        if (settingsOpt.isPresent() && settingsOpt.get().getPitchLimitSec() > 0) {
            timeLimit = settingsOpt.get().getPitchLimitSec();
        }

        String serialized = serializeBeats(initialBeats);
        Pitch pitch = new Pitch(roomId, 1, serialized, timeLimit, source, docVersion, user != null ? user.getId() : null);
        pitchRepository.save(pitch);

        PitchVersion pv = new PitchVersion(roomId, 1, serialized, "Initial pitch version", user != null ? user.getId() : null);
        pitchVersionRepository.save(pv);

        return toDetailResponse(pitch);
    }

    private List<PitchBeatDto> parseBeatsFromDoc(String content) {
        List<PitchBeatDto> list = new ArrayList<>();

        // Locate ## Script section
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

        // Match H3 beats: "### 0:00-0:10 - Hook"
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

            String say = extractBullet(block, "SAY");
            String show = extractBullet(block, "SHOW");
            String cue = extractBullet(block, "CUE");
            int dur = parseDurationFromWindow(timeWindow);

            list.add(new PitchBeatDto(UUID.randomUUID().toString(), title, dur, say, show, cue, null, null));
            index++;
        }

        return list;
    }

    private String extractBullet(String block, String bullet) {
        Pattern p = Pattern.compile("(?im)^[-*]\\s*(?:\\*\\*)?" + bullet + "\\s*:?(?:\\*\\*)?\\s*(.*)$");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.group(1).trim();
        }
        return "";
    }

    private int parseDurationFromWindow(String window) {
        try {
            String[] parts = window.split("[-–—]");
            if (parts.length == 2) {
                int s1 = parseSec(parts[0].trim());
                int s2 = parseSec(parts[1].trim());
                if (s2 > s1) return s2 - s1;
            }
        } catch (Exception ignored) {}
        return 20;
    }

    private int parseSec(String mmss) {
        String[] p = mmss.split(":");
        return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
    }

    private int parseTimeLimit(String content) {
        Pattern p = Pattern.compile("(?i)(?:limit|pitch limit|format)[^\\n]*?(\\d+)\\s*(?:min(?:ute)?s?|sec(?:ond)?s?|s)");
        Matcher m = p.matcher(content);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                String matched = m.group(0).toLowerCase();
                if (matched.contains("min")) return val * 60;
                return val;
            } catch (Exception ignored) {}
        }
        return 180;
    }

    private String formatBeatsToMarkdown(List<PitchBeatDto> beats) {
        StringBuilder sb = new StringBuilder("## Script\n\n");
        int cumulative = 0;
        for (PitchBeatDto b : beats) {
            int dur = Math.max(3, b.durationSec());
            int end = cumulative + dur;
            sb.append(String.format("### %s-%s - %s\n", formatMmSs(cumulative), formatMmSs(end), b.title()));
            sb.append("- SAY: ").append(b.say() != null ? b.say() : "").append("\n");
            sb.append("- SHOW: ").append(b.show() != null ? b.show() : "").append("\n");
            sb.append("- CUE: ").append(b.cue() != null ? b.cue() : "").append("\n\n");
            cumulative = end;
        }
        return sb.toString().trim();
    }

    private String formatMmSs(int totalSec) {
        int m = totalSec / 60;
        int s = totalSec % 60;
        return String.format("%d:%02d", m, s);
    }

    private String rewriteScriptSection(String fullContent, String newScriptSection) {
        Matcher secMatcher = Pattern.compile("(?im)^##\\s*(?:\\d+\\.\\s*)?Script.*$").matcher(fullContent);
        if (!secMatcher.find()) {
            // Append if not found
            return fullContent.trim() + "\n\n" + newScriptSection + "\n";
        }

        int start = secMatcher.start();
        Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(fullContent);
        int end = fullContent.length();
        if (nextH2.find(secMatcher.end())) {
            end = nextH2.start();
        }

        return fullContent.substring(0, start) + newScriptSection + "\n\n" + fullContent.substring(end);
    }

    private String generateDiffSummary(List<PitchBeatDto> oldBeats, List<PitchBeatDto> newBeats) {
        return String.format("Document has %d beats (current pitch has %d beats).", newBeats.size(), oldBeats.size());
    }

    private List<String> extractKeywords(String text) {
        if (text == null) return Collections.emptyList();
        String[] tokens = text.toLowerCase().split("[^a-z0-9]+");
        List<String> list = new ArrayList<>();
        for (String t : tokens) {
            if (t.length() >= 4) {
                // Plural stripping
                if (t.endsWith("s") && t.length() >= 5) {
                    list.add(t.substring(0, t.length() - 1));
                }
                list.add(t);
            }
        }
        return list;
    }

    private void validateBeats(List<PitchBeatDto> beats) {
        if (beats.size() > 40) {
            throw new BadRequestException("TOO_MANY_BEATS", "Pitch script cannot exceed 40 beats.");
        }
        for (PitchBeatDto b : beats) {
            if (b.title() != null && b.title().length() > 120) {
                throw new BadRequestException("TITLE_TOO_LONG", "Beat title cannot exceed 120 characters.");
            }
            if (b.say() != null && b.say().length() > 3000) {
                throw new BadRequestException("SAY_TOO_LONG", "Beat SAY text cannot exceed 3,000 characters.");
            }
            if (b.show() != null && b.show().length() > 600) {
                throw new BadRequestException("SHOW_TOO_LONG", "Beat SHOW text cannot exceed 600 characters.");
            }
            if (b.cue() != null && b.cue().length() > 400) {
                throw new BadRequestException("CUE_TOO_LONG", "Beat CUE text cannot exceed 400 characters.");
            }
            if (b.durationSec() < 3 || b.durationSec() > 600) {
                throw new BadRequestException("INVALID_DURATION", "Beat duration must be between 3 and 600 seconds.");
            }
        }
    }

    private String serializeBeats(List<PitchBeatDto> beats) {
        try {
            return objectMapper.writeValueAsString(beats);
        } catch (Exception e) {
            log.error("Failed to serialize beats: {}", e.getMessage());
            return "[]";
        }
    }

    public List<PitchBeatDto> deserializeBeats(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<PitchBeatDto>>() {});
        } catch (Exception e) {
            log.warn("Failed to deserialize beats: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return "Teammate";
        return userRepository.findById(userId).map(User::getDisplayName).orElse("Teammate");
    }

    private PitchDetailResponse toDetailResponse(Pitch p) {
        List<PitchBeatDto> beats = deserializeBeats(p.getBeats());
        String authorName = resolveUserName(p.getUpdatedBy());
        return new PitchDetailResponse(
                p.getRoomId(),
                p.getVersion(),
                beats,
                p.getTimeLimitSec(),
                p.getSource(),
                p.getDocVersion(),
                p.getUpdatedBy(),
                authorName,
                p.getUpdatedAt()
        );
    }
}
