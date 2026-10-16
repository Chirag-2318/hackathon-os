package com.hackathonos.backend.hackathons;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.TooManyRequestsException;
import com.hackathonos.backend.hackathons.dto.HackathonDtos.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class HackathonService {

    private static final Logger log = LoggerFactory.getLogger(HackathonService.class);

    private final HackathonRepository hackathonRepository;
    private final HackathonSuggestionRepository suggestionRepository;
    private final HackathonSource hackathonSource;
    private final ObjectMapper objectMapper;
    private final com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService;

    public HackathonService(
            HackathonRepository hackathonRepository,
            HackathonSuggestionRepository suggestionRepository,
            HackathonSource hackathonSource,
            ObjectMapper objectMapper,
            com.hackathonos.backend.common.lock.DbAdvisoryLockService advisoryLockService
    ) {
        this.hackathonRepository = hackathonRepository;
        this.suggestionRepository = suggestionRepository;
        this.hackathonSource = hackathonSource;
        this.objectMapper = objectMapper;
        this.advisoryLockService = advisoryLockService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        try {
            syncHackathons();
        } catch (Exception e) {
            log.error("Failed to sync hackathons on startup: {}", e.getMessage(), e);
        }
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void scheduledSync() {
        advisoryLockService.tryLockAndRun(1003L, () -> {
            try {
                syncHackathons();
            } catch (Exception e) {
                log.error("Failed scheduled hackathons sync: {}", e.getMessage(), e);
            }
        });
    }

    @Transactional
    public void syncHackathons() {
        List<HackathonSourceItemDto> incoming = hackathonSource.fetch();
        if (incoming == null) {
            incoming = Collections.emptyList();
        }

        Set<String> seenUrls = new HashSet<>();

        for (HackathonSourceItemDto item : incoming) {
            if (item == null) continue;

            // Validation: https url, ends_at after starts_at, title and organizer present, team_min <= team_max
            if (item.url() == null || !item.url().startsWith("https://")) {
                log.warn("Skipping hackathon with invalid URL: {}", item.url());
                continue;
            }
            if (item.title() == null || item.title().isBlank()) {
                log.warn("Skipping hackathon with blank title (url={})", item.url());
                continue;
            }
            if (item.organizer() == null || item.organizer().isBlank()) {
                log.warn("Skipping hackathon with blank organizer (url={})", item.url());
                continue;
            }
            if (item.startsAt() == null || item.endsAt() == null || !item.endsAt().isAfter(item.startsAt())) {
                log.warn("Skipping hackathon with invalid dates (starts={}, ends={}, url={})", item.startsAt(), item.endsAt(), item.url());
                continue;
            }
            if (item.teamMin() != null && item.teamMax() != null && item.teamMin() > item.teamMax()) {
                log.warn("Skipping hackathon with team_min > team_max (url={})", item.url());
                continue;
            }

            seenUrls.add(item.url().trim());

            Hackathon entity = hackathonRepository.findByUrl(item.url().trim())
                    .orElseGet(() -> {
                        Hackathon h = new Hackathon();
                        h.setUrl(item.url().trim());
                        return h;
                    });

            entity.setTitle(item.title().trim().length() > 160 ? item.title().trim().substring(0, 160) : item.title().trim());
            entity.setOrganizer(item.organizer().trim().length() > 120 ? item.organizer().trim().substring(0, 120) : item.organizer().trim());
            entity.setSource(item.source() != null ? item.source().trim() : "file");

            String mode = item.mode() != null ? item.mode().trim().toUpperCase(Locale.ROOT) : "ONLINE";
            if (!List.of("ONLINE", "OFFLINE", "HYBRID").contains(mode)) {
                mode = "ONLINE";
            }
            entity.setMode(mode);

            entity.setStartsAt(item.startsAt());
            entity.setEndsAt(item.endsAt());
            entity.setRegistrationDeadline(item.registrationDeadline());
            entity.setPrizeText(item.prizeText() != null ? item.prizeText().trim() : null);

            String themesJson = "[]";
            if (item.themes() != null) {
                try {
                    themesJson = objectMapper.writeValueAsString(item.themes());
                } catch (Exception ignored) {}
            }
            entity.setThemes(themesJson);

            entity.setLocation(item.location() != null ? item.location().trim() : null);
            entity.setTeamMin(item.teamMin());
            entity.setTeamMax(item.teamMax());
            entity.setVerifiedAt(item.verifiedAt() != null ? item.verifiedAt() : Instant.now());
            entity.setActive(item.active() != null ? item.active() : true);

            hackathonRepository.save(entity);
        }

        // Deactivate removed entries
        List<Hackathon> allInDb = hackathonRepository.findAll();
        for (Hackathon h : allInDb) {
            if ("file".equalsIgnoreCase(h.getSource()) && !seenUrls.contains(h.getUrl())) {
                if (h.isActive()) {
                    h.setActive(false);
                    hackathonRepository.save(h);
                    log.info("Deactivated hackathon absent from source: {}", h.getUrl());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public HackathonLiveResponseDto getLiveHackathons(int limit) {
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        int effectiveLimit = Math.max(1, Math.min(20, limit));

        List<Hackathon> liveEntities = hackathonRepository.findLiveHackathons(
                now,
                thirtyDaysAgo,
                PageRequest.of(0, effectiveLimit)
        );

        List<HackathonItemDto> items = new ArrayList<>();
        for (Hackathon h : liveEntities) {
            long msToEnd = Math.max(0, Duration.between(now, h.getEndsAt()).toMillis());
            Long msToRegClose = h.getRegistrationDeadline() != null
                    ? Math.max(0, Duration.between(now, h.getRegistrationDeadline()).toMillis())
                    : null;

            long totalWindow = Math.max(1, Duration.between(h.getStartsAt(), h.getEndsAt()).toMillis());
            long elapsed = Math.max(0, Duration.between(h.getStartsAt(), now).toMillis());
            double elapsedPercent = Math.min(100.0, Math.max(0.0, ((double) elapsed / totalWindow) * 100.0));

            List<String> themeList = Collections.emptyList();
            try {
                if (h.getThemes() != null && !h.getThemes().isBlank()) {
                    themeList = objectMapper.readValue(h.getThemes(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            items.add(new HackathonItemDto(
                    h.getId(),
                    h.getTitle(),
                    h.getOrganizer(),
                    h.getUrl(),
                    h.getSource(),
                    h.getMode(),
                    h.getStartsAt(),
                    h.getEndsAt(),
                    h.getRegistrationDeadline(),
                    h.getPrizeText(),
                    themeList,
                    h.getLocation(),
                    h.getTeamMin(),
                    h.getTeamMax(),
                    h.getVerifiedAt(),
                    msToEnd,
                    msToRegClose,
                    elapsedPercent
            ));
        }

        return new HackathonLiveResponseDto(now, items);
    }

    @Transactional
    public void submitSuggestion(UUID userId, HackathonSuggestionRequest req) {
        if (req == null || req.url() == null || req.url().isBlank()) {
            throw new BadRequestException("Hackathon URL is required");
        }
        String url = req.url().trim();
        if (!url.startsWith("https://")) {
            throw new BadRequestException("Hackathon URL must start with https://");
        }
        if (url.length() > 500) {
            throw new BadRequestException("URL exceeds 500 characters limit");
        }
        String note = req.note() != null ? req.note().trim() : null;
        if (note != null && note.length() > 300) {
            note = note.substring(0, 300);
        }

        // Rate limit: max 5 per user per 24 hours
        if (userId != null) {
            long recentCount = suggestionRepository.countByUserIdAndCreatedAtAfter(
                    userId,
                    Instant.now().minus(24, ChronoUnit.HOURS)
            );
            if (recentCount >= 5) {
                throw new TooManyRequestsException("Maximum 5 suggestions per day allowed");
            }
        }

        // Dedupe by url
        if (suggestionRepository.findByUrl(url).isPresent()) {
            log.info("Duplicate hackathon suggestion ignored for URL: {}", url);
            return;
        }

        HackathonSuggestion suggestion = new HackathonSuggestion(userId, url, note);
        suggestionRepository.save(suggestion);
    }
}
