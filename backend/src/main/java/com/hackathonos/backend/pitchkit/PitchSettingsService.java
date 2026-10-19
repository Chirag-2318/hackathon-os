package com.hackathonos.backend.pitchkit;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
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
public class PitchSettingsService {

    private static final Logger log = LoggerFactory.getLogger(PitchSettingsService.class);

    private final PitchSettingsRepository settingsRepository;
    private final RoomAccessService roomAccessService;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final RoomEventService roomEventService;

    public PitchSettingsService(
            PitchSettingsRepository settingsRepository,
            RoomAccessService roomAccessService,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            RoomMemberRepository roomMemberRepository,
            UserRepository userRepository,
            RoomEventService roomEventService
    ) {
        this.settingsRepository = settingsRepository;
        this.roomAccessService = roomAccessService;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.userRepository = userRepository;
        this.roomEventService = roomEventService;
    }

    @Transactional
    public PitchSettingsDtos.PitchSettingsDto getSettings(UUID roomId, User user) {
        roomAccessService.requireMember(roomId, user);

        PitchSettings settings = settingsRepository.findById(roomId).orElse(null);
        if (settings == null) {
            settings = new PitchSettings(roomId);
            prefillFromDemoScript(roomId, settings);
            settings = settingsRepository.save(settings);
        }

        return toDto(settings);
    }

    @Transactional
    public PitchSettingsDtos.PitchSettingsDto patchSettings(UUID roomId, User user, PitchSettingsDtos.PatchPitchSettingsRequest req) {
        roomAccessService.requireMember(roomId, user);
        boolean isLeader = roomAccessService.isLeader(roomId, user.getId());

        PitchSettings settings = settingsRepository.findById(roomId).orElseGet(() -> {
            PitchSettings s = new PitchSettings(roomId);
            prefillFromDemoScript(roomId, s);
            return settingsRepository.save(s);
        });

        if (settings.isLocked() && !isLeader) {
            throw new ForbiddenException("ROOM_LOCKED", "Pitch settings are locked. Only the room leader can edit.");
        }

        if (req.version() != null && req.version() != settings.getVersion()) {
            throw new ConflictException("VERSION_CONFLICT", "Pitch settings were updated by someone else. Please reload.");
        }

        if (req.format() != null && !req.format().isBlank()) {
            String f = req.format().trim().toUpperCase(Locale.ROOT);
            if (f.equals("LIVE") || f.equals("VIDEO") || f.equals("BOTH")) {
                settings.setFormat(f);
            }
        }
        if (req.pitchLimitSec() != null && req.pitchLimitSec() > 0) {
            settings.setPitchLimitSec(req.pitchLimitSec());
        }
        if (req.qaLimitSec() != null && req.qaLimitSec() > 0) {
            settings.setQaLimitSec(req.qaLimitSec());
        }
        if (req.presenterUserId() != null) {
            settings.setPresenterUserId(req.presenterUserId());
        }
        if (req.operatorUserId() != null) {
            settings.setOperatorUserId(req.operatorUserId());
        }
        if (req.locked() != null) {
            if (!isLeader) {
                throw new ForbiddenException("LEADER_REQUIRED", "Only the room leader can lock or unlock settings.");
            }
            settings.setLocked(req.locked());
            settings.setLockedBy(req.locked() ? user.getId() : null);
        }
        if (req.wpm() != null && req.wpm() > 0) {
            settings.setWpm(req.wpm());
        }

        PitchSettings saved = settingsRepository.save(settings);

        try {
            roomEventService.recordEvent(roomId, "PITCHKIT_SETTINGS_UPDATED", "PITCH_SETTINGS", roomId.toString(), user.getId());
        } catch (Exception ex) {
            log.warn("Failed to record pitch settings room event: {}", ex.getMessage());
        }

        return toDto(saved);
    }

    private void prefillFromDemoScript(UUID roomId, PitchSettings settings) {
        try {
            Optional<Doc> docOpt = docRepository.findByRoomIdAndFileName(roomId, "DEMO_SCRIPT.md");
            if (docOpt.isEmpty()) return;
            Doc doc = docOpt.get();
            String content = docVersionRepository.findByDocIdAndVersion(doc.getId(), doc.getCurrentVersion())
                    .map(DocVersion::getContent)
                    .orElse("");
            if (content.isBlank()) return;

            // 1. Format and limits
            Matcher formatMatcher = Pattern.compile("(?i)##\\s*(?:\\d+\\.\\s*)?Format and limits([\\s\\S]*?)(?=\\n##|$)").matcher(content);
            if (formatMatcher.find()) {
                String section = formatMatcher.group(1);
                String secLower = section.toLowerCase(Locale.ROOT);
                if (secLower.contains("both")) {
                    settings.setFormat("BOTH");
                } else if (secLower.contains("video") && !secLower.contains("live")) {
                    settings.setFormat("VIDEO");
                } else {
                    settings.setFormat("LIVE");
                }

                // Time limits (e.g. 3 minutes, 180s, 3:00)
                Matcher timeM = Pattern.compile("(?i)(?:pitch|presentation|demo)[^\\n]*?(\\d+)\\s*(?:min(?:ute)?s?|sec(?:ond)?s?|s)").matcher(section);
                if (timeM.find()) {
                    try {
                        int val = Integer.parseInt(timeM.group(1));
                        if (timeM.group(0).toLowerCase(Locale.ROOT).contains("min")) val *= 60;
                        if (val > 0) settings.setPitchLimitSec(val);
                    } catch (Exception ignored) {}
                }

                Matcher qaM = Pattern.compile("(?i)(?:q&?a|questions?)[^\\n]*?(\\d+)\\s*(?:min(?:ute)?s?|sec(?:ond)?s?|s)").matcher(section);
                if (qaM.find()) {
                    try {
                        int val = Integer.parseInt(qaM.group(1));
                        if (qaM.group(0).toLowerCase(Locale.ROOT).contains("min")) val *= 60;
                        if (val > 0) settings.setQaLimitSec(val);
                    } catch (Exception ignored) {}
                }
            }

            // 2. Roles on stage: presenter and operator
            Matcher roleMatcher = Pattern.compile("(?i)##\\s*(?:\\d+\\.\\s*)?Roles on stage([\\s\\S]*?)(?=\\n##|$)").matcher(content);
            if (roleMatcher.find()) {
                String section = roleMatcher.group(1);
                List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
                Map<String, UUID> handleMap = new HashMap<>();
                for (RoomMember rm : members) {
                    userRepository.findById(rm.getUserId()).ifPresent(u -> {
                        if (u.getUsername() != null) handleMap.put(u.getUsername().toLowerCase(Locale.ROOT), u.getId());
                        if (u.getLogin() != null) handleMap.put(u.getLogin().toLowerCase(Locale.ROOT), u.getId());
                        if (u.getName() != null) handleMap.put(u.getName().toLowerCase(Locale.ROOT).replace(" ", ""), u.getId());
                    });
                }

                Matcher presM = Pattern.compile("(?i)presenter[^@\\n]*?@([A-Za-z0-9_-]+)").matcher(section);
                if (presM.find()) {
                    String handle = presM.group(1).toLowerCase(Locale.ROOT);
                    if (handleMap.containsKey(handle)) {
                        settings.setPresenterUserId(handleMap.get(handle));
                    }
                }

                Matcher opM = Pattern.compile("(?i)operator[^@\\n]*?@([A-Za-z0-9_-]+)").matcher(section);
                if (opM.find()) {
                    String handle = opM.group(1).toLowerCase(Locale.ROOT);
                    if (handleMap.containsKey(handle)) {
                        settings.setOperatorUserId(handleMap.get(handle));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to prefill pitch settings from DEMO_SCRIPT.md: {}", e.getMessage());
        }
    }

    private PitchSettingsDtos.PitchSettingsDto toDto(PitchSettings s) {
        return new PitchSettingsDtos.PitchSettingsDto(
                s.getRoomId(),
                s.getFormat(),
                s.getPitchLimitSec(),
                s.getQaLimitSec(),
                s.getPresenterUserId(),
                s.getOperatorUserId(),
                s.isLocked(),
                s.getLockedBy(),
                s.getWpm(),
                s.getVersion()
        );
    }
}
