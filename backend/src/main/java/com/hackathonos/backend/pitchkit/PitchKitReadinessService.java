package com.hackathonos.backend.pitchkit;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.demo.DemoAsset;
import com.hackathonos.backend.demo.DemoAssetRepository;
import com.hackathonos.backend.demo.DemoStationService;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.pitch.PitchDtos;
import com.hackathonos.backend.pitch.PitchScript;
import com.hackathonos.backend.pitch.PitchScriptRepository;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PitchKitReadinessService {

    private static final Logger log = LoggerFactory.getLogger(PitchKitReadinessService.class);

    private final PitchSettingsRepository settingsRepository;
    private final DemoAssetRepository assetRepository;
    private final PitchScriptRepository scriptRepository;
    private final PitchRepository pitchRepository;
    private final RehearsalRepository rehearsalRepository;
    private final QnaItemRepository qnaItemRepository;
    private final QnaProgressRepository qnaProgressRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final UserRepository userRepository;
    private final RoomAccessService roomAccessService;
    private final ObjectMapper objectMapper;

    public PitchKitReadinessService(
            PitchSettingsRepository settingsRepository,
            DemoAssetRepository assetRepository,
            PitchScriptRepository scriptRepository,
            PitchRepository pitchRepository,
            RehearsalRepository rehearsalRepository,
            QnaItemRepository qnaItemRepository,
            QnaProgressRepository qnaProgressRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            UserRepository userRepository,
            RoomAccessService roomAccessService,
            ObjectMapper objectMapper
    ) {
        this.settingsRepository = settingsRepository;
        this.assetRepository = assetRepository;
        this.scriptRepository = scriptRepository;
        this.pitchRepository = pitchRepository;
        this.rehearsalRepository = rehearsalRepository;
        this.qnaItemRepository = qnaItemRepository;
        this.qnaProgressRepository = qnaProgressRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.userRepository = userRepository;
        this.roomAccessService = roomAccessService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PitchSettingsDtos.PitchKitReadinessResponse getReadiness(UUID roomId, User user) {
        if (user != null) {
            roomAccessService.requireMember(roomId, user);
        }

        PitchSettings settings = settingsRepository.findById(roomId).orElseGet(() -> new PitchSettings(roomId));
        List<DemoAsset> assets = assetRepository.findByRoomIdOrderByPositionAscCreatedAtAsc(roomId);

        List<PitchSettingsDtos.PitchKitReadinessItem> items = new ArrayList<>(10);

        // 1. Pitch script exists with at least 3 beats
        ScriptCheck scriptCheck = evaluateScript(roomId);
        if (scriptCheck.beatCount >= 3) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-script",
                    "Pitch script exists with at least 3 beats",
                    "READY",
                    scriptCheck.beatCount + " beats structured in rehearsal script",
                    "?tab=pitch",
                    1
            ));
        } else if (scriptCheck.beatCount > 0) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-script",
                    "Pitch script exists with at least 3 beats",
                    "PARTIAL",
                    scriptCheck.beatCount + " of 3 beats defined",
                    "?tab=pitch",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-script",
                    "Pitch script exists with at least 3 beats",
                    "MISSING",
                    "No script beats generated yet",
                    "?tab=pitch",
                    1
            ));
        }

        // 2. Pitch fits the time limit (within +10%)
        int limitSec = settings.getPitchLimitSec() > 0 ? settings.getPitchLimitSec() : 180;
        int maxAllowedSec = (int) Math.round(limitSec * 1.10);
        if (scriptCheck.beatCount >= 3 && scriptCheck.totalSeconds > 0 && scriptCheck.totalSeconds <= maxAllowedSec) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-timing",
                    "Pitch fits the time limit",
                    "READY",
                    formatMmSs(scriptCheck.totalSeconds) + " / " + formatMmSs(limitSec) + " target",
                    "?tab=pitch",
                    1
            ));
        } else if (scriptCheck.beatCount > 0 && scriptCheck.totalSeconds > maxAllowedSec) {
            int over = scriptCheck.totalSeconds - limitSec;
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-timing",
                    "Pitch fits the time limit",
                    "PARTIAL",
                    formatMmSs(scriptCheck.totalSeconds) + " exceeds limit by " + over + "s",
                    "?tab=pitch",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "pitch-timing",
                    "Pitch fits the time limit",
                    "MISSING",
                    "Need script with timed beats to check limit (" + formatMmSs(limitSec) + ")",
                    "?tab=pitch",
                    1
            ));
        }

        // 3. 3 completed team rehearsals
        long halfLimitMs = (limitSec > 0 ? limitSec : 180) * 500L;
        long countingRuns = rehearsalRepository.countCountingRehearsals(roomId, halfLimitMs);
        if (countingRuns >= 3) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "team-rehearsals",
                    "3 completed team rehearsals",
                    "READY",
                    countingRuns + " team rehearsals completed",
                    "?tab=pitch",
                    1
            ));
        } else if (countingRuns > 0) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "team-rehearsals",
                    "3 completed team rehearsals",
                    "PARTIAL",
                    countingRuns + " of 3 team rehearsals completed",
                    "?tab=pitch",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "team-rehearsals",
                    "3 completed team rehearsals",
                    "MISSING",
                    "0 of 3 team rehearsals completed",
                    "?tab=pitch",
                    1
            ));
        }

        // 4. Full recording added and reachable
        Optional<DemoAsset> fullRec = assets.stream().filter(a -> "FULL_RECORDING".equals(a.getKind())).findFirst();
        if (fullRec.isPresent() && "REACHABLE".equals(fullRec.get().getStatus())) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "full-recording",
                    "Full recording added and reachable",
                    "READY",
                    fullRec.get().getProvider() + " recording verified reachable",
                    "?tab=demo",
                    1
            ));
        } else if (fullRec.isPresent() && ("NEEDS_LOGIN".equals(fullRec.get().getStatus()) || "CHECKING".equals(fullRec.get().getStatus()))) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "full-recording",
                    "Full recording added and reachable",
                    "PARTIAL",
                    "Recording link needs login or is being verified",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "full-recording",
                    "Full recording added and reachable",
                    "MISSING",
                    "Add full screen recording link",
                    "?tab=demo",
                    1
            ));
        }

        // 5. Backup recording added and reachable
        Optional<DemoAsset> backupRec = assets.stream().filter(a -> "BACKUP_RECORDING".equals(a.getKind())).findFirst();
        if (backupRec.isPresent() && "REACHABLE".equals(backupRec.get().getStatus())) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "backup-recording",
                    "Backup recording added and reachable",
                    "READY",
                    backupRec.get().getProvider() + " backup verified reachable",
                    "?tab=demo",
                    1
            ));
        } else if (backupRec.isPresent() && ("NEEDS_LOGIN".equals(backupRec.get().getStatus()) || "CHECKING".equals(backupRec.get().getStatus()))) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "backup-recording",
                    "Backup recording added and reachable",
                    "PARTIAL",
                    "Backup recording link needs login or is being verified",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "backup-recording",
                    "Backup recording added and reachable",
                    "MISSING",
                    "Add ~60s backup recording link",
                    "?tab=demo",
                    1
            ));
        }

        // 6. Live link reachable (not localhost)
        Optional<DemoAsset> liveLink = assets.stream().filter(a -> "LIVE_LINK".equals(a.getKind())).findFirst();
        if (liveLink.isPresent() && "REACHABLE".equals(liveLink.get().getStatus())) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "live-link",
                    "Live link reachable",
                    "READY",
                    (liveLink.get().getTitle() != null ? liveLink.get().getTitle() + " — " : "") + "Reachable for judges",
                    "?tab=demo",
                    1
            ));
        } else if (liveLink.isPresent() && "NEEDS_LOGIN".equals(liveLink.get().getStatus())) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "live-link",
                    "Live link reachable",
                    "PARTIAL",
                    "Live link requires authentication",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "live-link",
                    "Live link reachable",
                    "MISSING",
                    "Add working public URL for judges (not localhost)",
                    "?tab=demo",
                    1
            ));
        }

        // 7. At least 3 screenshots
        long screenshotCount = assets.stream().filter(a -> "SCREENSHOT".equals(a.getKind())).count();
        if (screenshotCount >= 3) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "screenshots",
                    "At least 3 screenshots",
                    "READY",
                    screenshotCount + " screenshots uploaded",
                    "?tab=demo",
                    1
            ));
        } else if (screenshotCount > 0) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "screenshots",
                    "At least 3 screenshots",
                    "PARTIAL",
                    screenshotCount + " of 3 screenshots uploaded",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "screenshots",
                    "At least 3 screenshots",
                    "MISSING",
                    "Upload at least 3 key screens for fallback",
                    "?tab=demo",
                    1
            ));
        }

        // 8. At least 3 of the 4 fallback rungs ready
        boolean rungA = liveLink.isPresent() && "REACHABLE".equals(liveLink.get().getStatus());
        boolean rungB = backupRec.isPresent() && "REACHABLE".equals(backupRec.get().getStatus());
        boolean rungC = screenshotCount >= 3;
        boolean rungD = scriptCheck.beatCount >= 3;
        int readyRungs = (rungA ? 1 : 0) + (rungB ? 1 : 0) + (rungC ? 1 : 0) + (rungD ? 1 : 0);

        if (readyRungs >= 3) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "fallback-ladder",
                    "At least 3 of 4 fallback rungs ready",
                    "READY",
                    readyRungs + " of 4 rungs ready on failure ladder",
                    "?tab=demo",
                    1
            ));
        } else if (readyRungs > 0) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "fallback-ladder",
                    "At least 3 of 4 fallback rungs ready",
                    "PARTIAL",
                    readyRungs + " of 4 fallback rungs ready",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "fallback-ladder",
                    "At least 3 of 4 fallback rungs ready",
                    "MISSING",
                    "0 of 4 fallback rungs ready on failure ladder",
                    "?tab=demo",
                    1
            ));
        }

        // 9. Presenter and operator assigned
        UUID presId = settings.getPresenterUserId();
        UUID opId = settings.getOperatorUserId();
        if (presId != null && opId != null) {
            String presName = userRepository.findById(presId).map(u -> u.getUsername() != null ? "@" + u.getUsername() : u.getName()).orElse("Presenter");
            String opName = userRepository.findById(opId).map(u -> u.getUsername() != null ? "@" + u.getUsername() : u.getName()).orElse("Operator");
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "stage-roles",
                    "Presenter and operator assigned",
                    "READY",
                    presName + " presents, " + opName + " operates",
                    "?tab=demo",
                    1
            ));
        } else if (presId != null || opId != null) {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "stage-roles",
                    "Presenter and operator assigned",
                    "PARTIAL",
                    (presId != null ? "Operator" : "Presenter") + " role unassigned",
                    "?tab=demo",
                    1
            ));
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "stage-roles",
                    "Presenter and operator assigned",
                    "MISSING",
                    "Assign presenter and operator in On stage",
                    "?tab=demo",
                    1
            ));
        }

        // 10. Q&A at least 70% solid
        List<QnaItem> qnaQuestions = qnaItemRepository.findByRoomIdAndActiveOrderByPositionAsc(roomId, true)
                .stream().filter(it -> "QUESTION".equalsIgnoreCase(it.getKind()) || "CODE".equalsIgnoreCase(it.getKind()))
                .toList();
        int totalQna = qnaQuestions.size();
        if (totalQna > 0) {
            List<Object[]> teamMasteryRows = qnaProgressRepository.findTeamMasteryByRoomId(roomId);
            Map<String, Integer> teamMasteryMap = new HashMap<>();
            for (Object[] r : teamMasteryRows) {
                if (r.length >= 2 && r[0] != null && r[1] != null) {
                    teamMasteryMap.put((String) r[0], ((Number) r[1]).intValue());
                }
            }
            int solidCount = (int) qnaQuestions.stream()
                    .filter(q -> teamMasteryMap.getOrDefault(q.getHash(), 0) == 3)
                    .count();
            int solidPct = (int) Math.round((solidCount * 100.0) / totalQna);

            if (solidPct >= 70) {
                items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                        "qna-solid",
                        "Q&A at least 70% solid",
                        "READY",
                        solidCount + " of " + totalQna + " solid (" + solidPct + "%)",
                        "?tab=qa",
                        1
                ));
            } else if (solidCount > 0) {
                items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                        "qna-solid",
                        "Q&A at least 70% solid",
                        "PARTIAL",
                        solidCount + " of " + totalQna + " solid (" + solidPct + "%, need 70%)",
                        "?tab=qa",
                        1
                ));
            } else {
                items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                        "qna-solid",
                        "Q&A at least 70% solid",
                        "MISSING",
                        "0 of " + totalQna + " solid (0%, need 70%)",
                        "?tab=qa",
                        1
                ));
            }
        } else {
            items.add(new PitchSettingsDtos.PitchKitReadinessItem(
                    "qna-solid",
                    "Q&A at least 70% solid",
                    "MISSING",
                    "0% solid (QNA.md needed)",
                    "?tab=qa",
                    1
            ));
        }

        long readyCount = items.stream().filter(it -> "READY".equals(it.status())).count();
        int scorePercent = (int) Math.round((readyCount * 100.0) / items.size());

        return new PitchSettingsDtos.PitchKitReadinessResponse((int) readyCount, items.size(), scorePercent, items);
    }

    private static class ScriptCheck {
        final int beatCount;
        final int totalSeconds;

        ScriptCheck(int beatCount, int totalSeconds) {
            this.beatCount = beatCount;
            this.totalSeconds = totalSeconds;
        }
    }

    private ScriptCheck evaluateScript(UUID roomId) {
        Optional<Pitch> pitchOpt = pitchRepository.findById(roomId);
        if (pitchOpt.isPresent() && pitchOpt.get().getBeats() != null && !pitchOpt.get().getBeats().isBlank()) {
            try {
                List<com.hackathonos.backend.pitchkit.PitchDtos.PitchBeatDto> beats = objectMapper.readValue(
                        pitchOpt.get().getBeats(), new TypeReference<List<com.hackathonos.backend.pitchkit.PitchDtos.PitchBeatDto>>() {}
                );
                int dur = beats.stream().mapToInt(com.hackathonos.backend.pitchkit.PitchDtos.PitchBeatDto::durationSec).sum();
                return new ScriptCheck(beats.size(), dur > 0 ? dur : pitchOpt.get().getTimeLimitSec());
            } catch (Exception ignored) {}
        }

        Optional<PitchScript> opt = scriptRepository.findById(roomId);
        if (opt.isPresent() && opt.get().getSlides() != null && !opt.get().getSlides().isBlank()) {
            try {
                List<PitchDtos.PitchSlidePlanDto> slides = objectMapper.readValue(
                        opt.get().getSlides(), new TypeReference<List<PitchDtos.PitchSlidePlanDto>>() {}
                );
                int dur = slides.stream().mapToInt(PitchDtos.PitchSlidePlanDto::seconds).sum();
                return new ScriptCheck(slides.size(), dur > 0 ? dur : opt.get().getTotalSeconds());
            } catch (Exception ignored) {}
        }

        // Fallback to DEMO_SCRIPT.md
        Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
        if (docOpt.isPresent()) {
            String content = docVersionRepository.findByDocIdAndVersion(docOpt.get().getId(), docOpt.get().getCurrentVersion())
                    .map(DocVersion::getContent).orElse("");
            Matcher bm = Pattern.compile("(?im)^###\\s*(\\d+:\\d{2}\\s*[-–—]\\s*\\d+:\\d{2})").matcher(content);
            int count = 0;
            int totalSec = 0;
            while (bm.find()) {
                count++;
                totalSec += parseDuration(bm.group(1));
            }
            if (count > 0) {
                return new ScriptCheck(count, totalSec);
            }
        }

        return new ScriptCheck(0, 0);
    }

    private int parseDuration(String window) {
        try {
            String[] parts = window.split("[-–—]");
            if (parts.length == 2) {
                int s = toSec(parts[0].trim());
                int e = toSec(parts[1].trim());
                return Math.max(0, e - s);
            }
        } catch (Exception ignored) {}
        return 30;
    }

    private int toSec(String mmSs) {
        String[] p = mmSs.split(":");
        return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
    }

    private String formatMmSs(int seconds) {
        return String.format("%d:%02d", seconds / 60, seconds % 60);
    }
}
