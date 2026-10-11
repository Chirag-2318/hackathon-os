package com.hackathonos.backend.demo;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.catalog.Tool;
import com.hackathonos.backend.catalog.ToolRepository;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service managing demo scripts, shot lists, demo insurance, and video media links.
 */
@Service
public class DemoService {

    private final DemoSectionRepository sectionRepository;
    private final DemoShotRepository shotRepository;
    private final DemoInsuranceItemRepository insuranceRepository;
    private final DemoMediaRepository mediaRepository;
    private final BriefRepository briefRepository;
    private final ToolRepository toolRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final CheckpointService checkpointService;

    public DemoService(
            DemoSectionRepository sectionRepository,
            DemoShotRepository shotRepository,
            DemoInsuranceItemRepository insuranceRepository,
            DemoMediaRepository mediaRepository,
            BriefRepository briefRepository,
            ToolRepository toolRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            CheckpointService checkpointService
    ) {
        this.sectionRepository = sectionRepository;
        this.shotRepository = shotRepository;
        this.insuranceRepository = insuranceRepository;
        this.mediaRepository = mediaRepository;
        this.briefRepository = briefRepository;
        this.toolRepository = toolRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.checkpointService = checkpointService;
    }

    /**
     * Retrieves the complete demo studio model for a room.
     */
    @Transactional
    public DemoDtos.DemoResponse getDemo(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        List<DemoSection> sections = sectionRepository.findByRoomIdOrderByPositionAsc(roomId);
        int totalSeconds = sections.stream().mapToInt(DemoSection::getSeconds).sum();

        List<DemoShot> shots = shotRepository.findByRoomIdOrderByPositionAsc(roomId);

        List<DemoInsuranceItem> insuranceItems = insuranceRepository.findByRoomIdOrderByLabelAsc(roomId);
        if (insuranceItems.isEmpty()) {
            insuranceItems = seedDefaultInsurance(roomId);
        }

        DemoMedia media = mediaRepository.findByRoomId(roomId).orElse(null);
        DemoDtos.DemoMediaDto mediaDto = new DemoDtos.DemoMediaDto(
                media != null ? media.getVideoUrl() : null,
                media != null ? media.getFallbackUrl() : null
        );

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        DemoDtos.VideoRulesDto videoRules = parseVideoRules(brief != null ? brief.getDeliverables() : "");

        List<DemoDtos.DemoSectionDto> sectionDtos = sections.stream().map(s ->
                new DemoDtos.DemoSectionDto(s.getId(), s.getPosition(), s.getTitle(), s.getTitle(), s.getSeconds(), s.getText())
        ).toList();

        List<DemoDtos.DemoShotDto> shotDtos = shots.stream().map(s ->
                new DemoDtos.DemoShotDto(s.getId(), s.getPosition(), s.getPosition() + 1, s.getTitle(), s.getTitle(),
                        s.getDurationSec(), s.getDurationSec(), s.getNotes(), s.getNotes(), s.isDone())
        ).toList();

        List<DemoDtos.InsuranceItemDto> insuranceDtos = insuranceItems.stream().map(i ->
                new DemoDtos.InsuranceItemDto(i.getItemKey(), i.getItemKey(), i.getLabel(), i.isDone())
        ).toList();

        List<DemoDtos.VideoRuleItemDto> videoRuleItems = List.of(
                new DemoDtos.VideoRuleItemDto("max_length", videoRules.maxSeconds() != null ? (videoRules.maxSeconds() / 60 + ":00") : "2:00",
                        formatMmSs(totalSeconds), totalSeconds <= (videoRules.maxSeconds() != null ? videoRules.maxSeconds() : 120) ? "pass" : "fail"),
                new DemoDtos.VideoRuleItemDto("public_link", Boolean.TRUE.equals(videoRules.publicLink()) ? "Yes" : "Optional",
                        mediaDto.videoUrl() != null ? "Added" : "Not checked", mediaDto.videoUrl() != null ? "pass" : "unknown"),
                new DemoDtos.VideoRuleItemDto("captions", Boolean.TRUE.equals(videoRules.captions()) ? "Yes" : "Optional",
                        "Check manually", "unknown")
        );

        List<Tool> tools = toolRepository.findByCategoryInOrderBySortOrderAsc(List.of("video", "recording", "Video", "Recording"));
        List<DemoDtos.DemoToolDto> toolDtos = tools.stream().limit(3).map(t ->
                new DemoDtos.DemoToolDto(t.getName(), t.getDescription(), t.getCategory(), t.getCost(), t.getLicense(),
                        t.getLastChecked() != null ? t.getLastChecked().toString() : "2026-10-11", true)
        ).toList();

        return new DemoDtos.DemoResponse(
                sectionDtos,
                sectionDtos,
                totalSeconds,
                videoRules.maxSeconds() != null ? videoRules.maxSeconds() : 120,
                shotDtos,
                insuranceDtos,
                mediaDto,
                videoRules,
                videoRuleItems,
                toolDtos,
                Instant.now()
        );
    }

    /**
     * Replaces the demo sections list in array order.
     */
    @Transactional
    public List<DemoDtos.DemoSectionDto> updateSections(UUID roomId, User user, DemoDtos.UpdateSectionsRequest req) {
        roomAccess.requireMember(roomId, user);
        sectionRepository.deleteByRoomId(roomId);

        List<DemoSection> list = new ArrayList<>();
        if (req.sections() != null) {
            int pos = 0;
            for (DemoDtos.SectionItemRequest s : req.sections()) {
                list.add(new DemoSection(roomId, pos++, s.title().trim(), s.seconds(), s.text() != null ? s.text().trim() : ""));
            }
        }
        List<DemoSection> saved = sectionRepository.saveAll(list);
        return saved.stream().map(s ->
                new DemoDtos.DemoSectionDto(s.getId(), s.getPosition(), s.getTitle(), s.getTitle(), s.getSeconds(), s.getText())
        ).toList();
    }

    /**
     * Replaces the demo shot list in array order.
     */
    @Transactional
    public List<DemoDtos.DemoShotDto> updateShots(UUID roomId, User user, DemoDtos.UpdateShotsRequest req) {
        roomAccess.requireMember(roomId, user);
        shotRepository.deleteByRoomId(roomId);

        List<DemoShot> list = new ArrayList<>();
        if (req.shots() != null) {
            int pos = 0;
            for (DemoDtos.ShotItemRequest s : req.shots()) {
                list.add(new DemoShot(roomId, pos++, s.title().trim(), s.durationSec(), s.notes() != null ? s.notes().trim() : "", s.done()));
            }
        }
        List<DemoShot> saved = shotRepository.saveAll(list);
        return saved.stream().map(s ->
                new DemoDtos.DemoShotDto(s.getId(), s.getPosition(), s.getPosition() + 1, s.getTitle(), s.getTitle(),
                        s.getDurationSec(), s.getDurationSec(), s.getNotes(), s.getNotes(), s.isDone())
        ).toList();
    }

    /**
     * Toggles an insurance item state.
     */
    @Transactional
    public DemoDtos.InsuranceItemDto toggleInsurance(UUID roomId, String itemKey, User user, DemoDtos.ToggleInsuranceRequest req) {
        roomAccess.requireMember(roomId, user);
        DemoInsuranceItem item = insuranceRepository.findByRoomIdAndItemKey(roomId, itemKey)
                .orElseThrow(() -> new BadRequestException("INSURANCE_NOT_FOUND", "Insurance item not found: " + itemKey));

        boolean newState = req.done() != null ? req.done() : !item.isDone();
        item.setDone(newState);
        DemoInsuranceItem saved = insuranceRepository.save(item);

        return new DemoDtos.InsuranceItemDto(saved.getItemKey(), saved.getItemKey(), saved.getLabel(), saved.isDone());
    }

    /**
     * Updates video URLs and triggers VIDEO_RECORDED checkpoint if both video and fallback exist.
     */
    @Transactional
    public DemoDtos.DemoMediaDto updateMedia(UUID roomId, User user, DemoDtos.UpdateMediaRequest req) {
        roomAccess.requireMember(roomId, user);
        validateUrl(req.videoUrl());
        validateUrl(req.fallbackUrl());

        DemoMedia media = mediaRepository.findByRoomId(roomId)
                .orElseGet(() -> new DemoMedia(roomId, null, null, Instant.now()));

        media.setVideoUrl(req.videoUrl() != null && !req.videoUrl().isBlank() ? req.videoUrl().trim() : null);
        media.setFallbackUrl(req.fallbackUrl() != null && !req.fallbackUrl().isBlank() ? req.fallbackUrl().trim() : null);
        media.setUpdatedAt(Instant.now());
        DemoMedia saved = mediaRepository.save(media);

        // Auto pass VIDEO_RECORDED if both URLs are present
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room != null && saved.getVideoUrl() != null && saved.getFallbackUrl() != null) {
            checkpointService.evaluate(room);
        }

        return new DemoDtos.DemoMediaDto(saved.getVideoUrl(), saved.getFallbackUrl());
    }

    private List<DemoInsuranceItem> seedDefaultInsurance(UUID roomId) {
        List<DemoInsuranceItem> items = List.of(
                new DemoInsuranceItem(roomId, "works_offline", "The demo works without internet", false),
                new DemoInsuranceItem(roomId, "cached_api", "API responses are cached", false),
                new DemoInsuranceItem(roomId, "screenshots_ready", "Screenshots are ready", false),
                new DemoInsuranceItem(roomId, "backup_recording", "A backup recording exists", false),
                new DemoInsuranceItem(roomId, "spare_gear", "Spare laptop, hotspot and charger", false)
        );
        return insuranceRepository.saveAll(items);
    }

    private DemoDtos.VideoRulesDto parseVideoRules(String deliverables) {
        if (deliverables == null || deliverables.isBlank()) {
            return new DemoDtos.VideoRulesDto(120, null, null);
        }
        String text = deliverables.toLowerCase(Locale.ROOT);
        Integer maxSeconds = null;
        if (text.contains("1 minute") || text.contains("60s") || text.contains("60 second")) maxSeconds = 60;
        else if (text.contains("2 minute") || text.contains("120s") || text.contains("120 second")) maxSeconds = 120;
        else if (text.contains("3 minute") || text.contains("180s") || text.contains("180 second")) maxSeconds = 180;
        else if (text.contains("5 minute") || text.contains("300s") || text.contains("300 second")) maxSeconds = 300;

        Boolean publicLink = text.contains("public") ? true : null;
        Boolean captions = text.contains("caption") ? true : null;

        return new DemoDtos.VideoRulesDto(maxSeconds != null ? maxSeconds : 120, publicLink, captions);
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) return;
        String trimmed = url.trim().toLowerCase(Locale.ROOT);
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            throw new BadRequestException("INVALID_URL", "Media URL must start with http:// or https://");
        }
    }

    private String formatMmSs(int seconds) {
        int m = seconds / 60;
        int s = seconds % 60;
        return String.format(Locale.US, "%d:%02d", m, s);
    }
}
