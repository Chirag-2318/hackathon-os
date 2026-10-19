package com.hackathonos.backend.pitch;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.EntityConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import com.hackathonos.backend.demo.DemoSection;
import com.hackathonos.backend.demo.DemoSectionRepository;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service generating and managing multi-speaker AI pitch scripts and sync with pitch slides.
 */
@Service
public class PitchScriptService {

    private static final Logger log = LoggerFactory.getLogger(PitchScriptService.class);

    private final PitchScriptRepository scriptRepository;
    private final PitchSlideRepository slideRepository;
    private final BriefRepository briefRepository;
    private final IdeaRepository ideaRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final DemoSectionRepository demoSectionRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public PitchScriptService(
            PitchScriptRepository scriptRepository,
            PitchSlideRepository slideRepository,
            BriefRepository briefRepository,
            IdeaRepository ideaRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            DemoSectionRepository demoSectionRepository,
            RoomMemberRepository memberRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            AiService aiService,
            ObjectMapper objectMapper
    ) {
        this.scriptRepository = scriptRepository;
        this.slideRepository = slideRepository;
        this.briefRepository = briefRepository;
        this.ideaRepository = ideaRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.demoSectionRepository = demoSectionRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieves the saved pitch script for a room, or null if none generated yet.
     */
    @Transactional(readOnly = true)
    public PitchDtos.PitchScriptDto getScript(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        return scriptRepository.findById(roomId).map(this::toDto).orElse(null);
    }

    /**
     * Generates a timed, multi-speaker pitch script from project context using AI.
     */
    @Transactional
    public PitchDtos.PitchScriptDto generateScript(UUID roomId, User user, PitchDtos.GeneratePitchScriptRequest req) {
        roomAccess.requireMember(roomId, user);
        if (req == null || req.type() == null) {
            throw new BadRequestException("INVALID_REQUEST", "Pitch type is required");
        }

        int targetSeconds = switch (req.type().toLowerCase()) {
            case "demo_90s" -> 90;
            case "ppt_first" -> 300;
            case "async_video" -> 120;
            default -> 180; // live_3min
        };

        int speakerCount = Math.max(1, Math.min(6, req.speakerCount() > 0 ? req.speakerCount() : 1));

        // Assemble speakers list
        List<PitchDtos.PitchSpeakerDto> speakers = buildSpeakers(roomId, speakerCount, req.speakerUserIds());

        // Context assembly
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        String briefText = brief != null ? brief.getRawText() : "";
        List<Idea> approvedIdeas = ideaRepository.findByRoomIdAndStatus(roomId, "APPROVED");
        String ideasSummary = approvedIdeas.stream().map(Idea::getText).toList().toString();
        String prd = getDocContent(roomId, "PRD.md");
        String mvp = getDocContent(roomId, "MVP.md");
        List<DemoSection> demoSections = demoSectionRepository.findByRoomIdOrderByPositionAsc(roomId);
        String demoScript = demoSections.stream().map(s -> s.getTitle() + ": " + s.getText()).toList().toString();

        String instructions = req.instructions() != null ? req.instructions().trim() : "";
        if (instructions.length() > 600) {
            instructions = instructions.substring(0, 600);
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a world-class hackathon presentation coach and scriptwriter.\n");
        prompt.append("Create a tight, high-impact pitch script for this project.\n\n");
        prompt.append("PROJECT CONTEXT:\n");
        prompt.append("Brief: ").append(truncate(briefText, 2000)).append("\n");
        prompt.append("Approved Ideas: ").append(ideasSummary).append("\n");
        prompt.append("PRD: ").append(truncate(prd, 2000)).append("\n");
        prompt.append("MVP: ").append(truncate(mvp, 1500)).append("\n");
        prompt.append("Demo Script: ").append(truncate(demoScript, 1000)).append("\n\n");
        prompt.append("PARAMETERS:\n");
        prompt.append("Pitch Format: ").append(req.type()).append("\n");
        prompt.append("Target Duration: ").append(targetSeconds).append(" seconds (all slide seconds must sum to within 10% of this).\n");
        prompt.append("Number of Speakers: ").append(speakerCount).append("\n");
        prompt.append("Speakers List: ").append(speakers.stream().map(s -> "Speaker " + s.index() + " (" + s.name() + ")").toList()).append("\n");
        if (!instructions.isBlank()) {
            prompt.append("Special Instructions: ").append(instructions).append("\n");
        }
        prompt.append("\nRULES:\n");
        prompt.append("1. Split time evenly across speakers.\n");
        prompt.append("2. Output ONLY a valid JSON object. No Markdown code fences, no introductory or trailing text.\n");
        prompt.append("3. Format:\n");
        prompt.append("{\n");
        prompt.append("  \"hook\": \"Catchy opening line in 1 sentence\",\n");
        prompt.append("  \"closingLine\": \"Memorable concluding sentence\",\n");
        prompt.append("  \"slides\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"n\": 1,\n");
        prompt.append("      \"headline\": \"Slide title\",\n");
        prompt.append("      \"speakerIndex\": 0,\n");
        prompt.append("      \"seconds\": 25,\n");
        prompt.append("      \"say\": \"Exact spoken words for presenter\",\n");
        prompt.append("      \"show\": \"Visual cues and screen content\",\n");
        prompt.append("      \"cue\": \"Transition prompt\",\n");
        prompt.append("      \"keyPoints\": [\"key point 1\", \"key point 2\"]\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");

        String rawResponse = aiService.complete(user.getId(), prompt.toString());
        Map<String, Object> parsed = parseScriptJson(rawResponse);

        if (parsed == null) {
            // Retry once with repair message
            String repairPrompt = "The previous output was invalid JSON. Reformat the pitch script strictly as pure JSON:\n" + rawResponse;
            String secondTry = aiService.complete(user.getId(), repairPrompt);
            parsed = parseScriptJson(secondTry);
            if (parsed == null) {
                throw new BadRequestException("AI_FAILED", "Failed to generate valid pitch script from AI");
            }
        }

        String hook = String.valueOf(parsed.getOrDefault("hook", ""));
        String closingLine = String.valueOf(parsed.getOrDefault("closingLine", ""));
        List<PitchDtos.PitchSlidePlanDto> slideDtos = extractSlideDtos(parsed.get("slides"));

        int totalSec = slideDtos.stream().mapToInt(PitchDtos.PitchSlidePlanDto::seconds).sum();

        PitchScript script = scriptRepository.findById(roomId).orElseGet(() -> {
            PitchScript s = new PitchScript();
            s.setRoomId(roomId);
            return s;
        });

        script.setType(req.type());
        script.setSpeakerCount(speakerCount);
        try {
            script.setSpeakers(objectMapper.writeValueAsString(speakers));
            script.setSlides(objectMapper.writeValueAsString(slideDtos));
        } catch (Exception ignored) {}
        script.setInstructions(instructions);
        script.setHook(hook);
        script.setClosingLine(closingLine);
        script.setTotalSeconds(totalSec);
        script.setGeneratedBy(user.getId());
        script.setGeneratedAt(Instant.now());

        PitchScript saved = scriptRepository.save(script);

        // Synchronize with pitch_slides table so lint and coverage keep working
        syncSlidesTable(roomId, slideDtos);

        return toDto(saved);
    }

    /**
     * Updates the Say and Show text for a specific slide plan item.
     */
    @Transactional
    public PitchDtos.PitchScriptDto updateSlidePlan(UUID roomId, int n, User user, PitchDtos.UpdatePitchSlidePlanRequest req) {
        roomAccess.requireMember(roomId, user);
        PitchScript script = scriptRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("SCRIPT_NOT_FOUND", "Pitch script not found"));

        if (req.version() != null && req.version() != script.getVersion()) {
            UserSummaryDto lastEditor = script.getLastEditedBy() != null && userRepository != null
                    ? userRepository.findById(script.getLastEditedBy()).map(UserSummaryDto::from).orElse(null)
                    : null;
            PitchDtos.PitchScriptDto latestDto = toDto(script);
            throw new EntityConflictException("CHANGED", "Pitch script was updated by another team member", script.getVersion(), lastEditor, script.getGeneratedAt(), latestDto);
        }
        script.setLastEditedBy(user.getId());

        List<PitchDtos.PitchSlidePlanDto> slides = parseSlideDtos(script.getSlides());
        boolean found = false;
        List<PitchDtos.PitchSlidePlanDto> updated = new ArrayList<>();
        for (PitchDtos.PitchSlidePlanDto s : slides) {
            if (s.n() == n) {
                found = true;
                updated.add(new PitchDtos.PitchSlidePlanDto(
                        s.n(),
                        s.headline(),
                        s.speakerIndex(),
                        s.seconds(),
                        req.say() != null ? req.say().trim() : s.say(),
                        req.show() != null ? req.show().trim() : s.show(),
                        s.cue(),
                        s.keyPoints()
                ));
            } else {
                updated.add(s);
            }
        }

        if (!found) {
            throw new NotFoundException("SLIDE_NOT_FOUND", "Slide number " + n + " not found in script");
        }

        try {
            script.setSlides(objectMapper.writeValueAsString(updated));
        } catch (Exception ignored) {}

        PitchScript saved = scriptRepository.save(script);
        syncSlidesTable(roomId, updated);
        return toDto(saved);
    }

    /**
     * Deletes the pitch script.
     */
    @Transactional
    public void deleteScript(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        scriptRepository.deleteById(roomId);
    }

    private void syncSlidesTable(UUID roomId, List<PitchDtos.PitchSlidePlanDto> slideDtos) {
        if (slideDtos == null || slideDtos.isEmpty()) return;
        slideRepository.deleteByRoomId(roomId);
        List<PitchSlide> list = new ArrayList<>();
        int pos = 0;
        for (PitchDtos.PitchSlidePlanDto s : slideDtos) {
            String kind = pos == 0 ? "PROBLEM" : (pos == 1 ? "SOLUTION" : (pos == 2 ? "DEMO" : (pos == 3 ? "IMPACT" : "CUSTOM")));
            list.add(new PitchSlide(roomId, pos++, kind, s.headline(), "What does this slide cover?", s.say()));
        }
        slideRepository.saveAll(list);
    }

    private List<PitchDtos.PitchSpeakerDto> buildSpeakers(UUID roomId, int count, List<UUID> preferredUserIds) {
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<PitchDtos.PitchSpeakerDto> list = new ArrayList<>();

        if (preferredUserIds != null && !preferredUserIds.isEmpty()) {
            int idx = 0;
            for (UUID uid : preferredUserIds) {
                if (idx >= count) break;
                User u = userRepository.findById(uid).orElse(null);
                String name = u != null ? u.getName() : "Speaker " + (idx + 1);
                list.add(new PitchDtos.PitchSpeakerDto(idx++, uid, name, "Presenter"));
            }
        }

        if (list.size() < count) {
            for (RoomMember m : members) {
                if (list.size() >= count) break;
                if (list.stream().anyMatch(s -> s.userId() != null && s.userId().equals(m.getUserId()))) continue;
                User u = userRepository.findById(m.getUserId()).orElse(null);
                String name = u != null ? u.getName() : "Member " + (list.size() + 1);
                list.add(new PitchDtos.PitchSpeakerDto(list.size(), m.getUserId(), name, m.getRole()));
            }
        }

        while (list.size() < count) {
            int i = list.size();
            list.add(new PitchDtos.PitchSpeakerDto(i, null, "Speaker " + (i + 1), "Presenter"));
        }

        return list;
    }

    private Map<String, Object> parseScriptJson(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            int start = raw.indexOf('{');
            int end = raw.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String sub = raw.substring(start, end + 1);
                return objectMapper.readValue(sub, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to parse script JSON: {}", e.getMessage());
        }
        return null;
    }

    private List<PitchDtos.PitchSlidePlanDto> extractSlideDtos(Object slidesObj) {
        if (slidesObj instanceof List<?> rawList) {
            List<PitchDtos.PitchSlidePlanDto> result = new ArrayList<>();
            int idx = 1;
            for (Object item : rawList) {
                if (item instanceof Map<?, ?> m) {
                    int n = m.get("n") instanceof Number num ? num.intValue() : idx;
                    Object hVal = m.get("headline");
                    String headline = hVal != null ? String.valueOf(hVal) : "Slide " + n;
                    int spk = m.get("speakerIndex") instanceof Number num ? num.intValue() : 0;
                    int sec = m.get("seconds") instanceof Number num ? num.intValue() : 20;
                    Object sayVal = m.get("say");
                    String say = sayVal != null ? String.valueOf(sayVal) : "";
                    Object showVal = m.get("show");
                    String show = showVal != null ? String.valueOf(showVal) : "";
                    Object cueVal = m.get("cue");
                    String cue = cueVal != null ? String.valueOf(cueVal) : "";
                    List<String> kps = new ArrayList<>();
                    if (m.get("keyPoints") instanceof List<?> kl) {
                        for (Object ko : kl) kps.add(String.valueOf(ko));
                    }
                    result.add(new PitchDtos.PitchSlidePlanDto(n, headline, spk, sec, say, show, cue, kps));
                    idx++;
                }
            }
            return result;
        }
        return Collections.emptyList();
    }

    private List<PitchDtos.PitchSlidePlanDto> parseSlideDtos(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private PitchDtos.PitchScriptDto toDto(PitchScript s) {
        List<PitchDtos.PitchSpeakerDto> spkList = Collections.emptyList();
        List<PitchDtos.PitchSlidePlanDto> slideList = Collections.emptyList();
        try {
            if (s.getSpeakers() != null) spkList = objectMapper.readValue(s.getSpeakers(), new TypeReference<>() {});
            if (s.getSlides() != null) slideList = objectMapper.readValue(s.getSlides(), new TypeReference<>() {});
        } catch (Exception ignored) {}

        return new PitchDtos.PitchScriptDto(
                s.getRoomId(),
                s.getType(),
                s.getSpeakerCount(),
                spkList,
                s.getInstructions(),
                s.getHook(),
                s.getClosingLine(),
                s.getTotalSeconds(),
                slideList,
                s.getGeneratedBy(),
                s.getGeneratedAt(),
                s.getSource(),
                s.getDocVersion()
        );
    }

    private String getDocContent(UUID roomId, String fileName) {
        return docRepository.findByRoomIdAndFileName(roomId, fileName)
                .flatMap(d -> docVersionRepository.findByDocIdAndVersion(d.getId(), d.getCurrentVersion()))
                .map(DocVersion::getContent)
                .orElse("");
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() > max ? text.substring(0, max) : text;
    }
}
