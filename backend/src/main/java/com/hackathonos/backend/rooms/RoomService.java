package com.hackathonos.backend.rooms;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.dto.*;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class RoomService {

    private static final String JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final EventTemplateService templateService;
    private final UserSettingsRepository settingsRepository;
    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final RoomMapper roomMapper;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;

    public RoomService(RoomRepository roomRepository,
                       RoomMemberRepository memberRepository,
                       EventTemplateService templateService,
                       UserSettingsRepository settingsRepository,
                       RoomAccess roomAccess,
                       RoomStageService stageService,
                       RoomMapper roomMapper,
                       ActivityLogger activityLogger,
                       NotificationService notificationService) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.templateService = templateService;
        this.settingsRepository = settingsRepository;
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.roomMapper = roomMapper;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
    }

    /**
     * Creates a room, makes the creator its leader, and gives it a unique join code.
     * Computes start and end clocks, sets key prefix, and dispatches creation notifications.
     */
    @Transactional
    public RoomDetailDto createRoom(User creator, CreateRoomRequest request) {
        EventTemplate template;
        try {
            template = templateService.getOrThrow(request.templateId());
        } catch (com.hackathonos.backend.common.error.NotFoundException e) {
            throw new BadRequestException("INVALID_TEMPLATE", "Unknown event template", Map.of("templateId", "Unknown event template"));
        }
        String timezone = resolveTimezone(creator, request.timezone());
        Instant eventStart = resolveEventStart(request.eventStart(), timezone);
        Instant eventEnd = eventStart.plus(template.getDurationHours(), ChronoUnit.HOURS);
        String joinCode = generateUniqueJoinCode();
        String keyPrefix = generateKeyPrefix(request.name());

        Room room = new Room(
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.projectDescription() != null ? request.projectDescription().trim() : null,
                template.getId(),
                creator.getId(),
                eventStart,
                eventEnd,
                timezone,
                keyPrefix,
                joinCode
        );
        roomRepository.save(room);

        RoomMember leader = new RoomMember(room.getId(), creator.getId(), "LEADER");
        memberRepository.save(leader);

        activityLogger.log(room, creator, "room_created", "Created the room");
        notificationService.notifyUser(creator, room, NotificationType.ROOM_CREATED, "Room created", room.getName());

        return roomMapper.toDetail(room, template.getName(), 1, "LEADER", true);
    }

    /**
     * Returns all active rooms where the user is currently a member, newest first.
     * Summarizes phase completion progress and member counts for each card.
     */
    public List<RoomListItemDto> listRooms(User user) {
        List<Room> rooms = roomRepository.findActiveRoomsByMemberUserId(user.getId());
        List<RoomListItemDto> items = new ArrayList<>();
        for (Room room : rooms) {
            String templateName = templateService.getOrThrow(room.getTemplateId()).getName();
            long count = memberRepository.countByRoomId(room.getId());
            RoomMember member = memberRepository.findByRoomIdAndUserId(room.getId(), user.getId()).orElse(null);
            String role = member != null ? member.getRole() : "BUILDER";
            boolean isLeader = "LEADER".equalsIgnoreCase(role);
            items.add(roomMapper.toListItem(room, templateName, count, role, isLeader));
        }
        return items;
    }

    /**
     * Returns full room details including stage completion flags and server timestamp.
     * Ensures caller is an active member of the requested room.
     */
    public RoomDetailDto getRoomDetail(User user, UUID roomId) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String templateName = templateService.getOrThrow(room.getTemplateId()).getName();
        long count = memberRepository.countByRoomId(room.getId());
        boolean isLeader = "LEADER".equalsIgnoreCase(member.getRole());
        return roomMapper.toDetail(room, templateName, count, member.getRole(), isLeader);
    }

    /**
     * Updates editable room fields (name, description, eventStart, timezone).
     * Recalculates eventEnd if eventStart changed; requires leader privileges.
     */
    @Transactional
    public RoomDetailDto updateRoom(User user, UUID roomId, UpdateRoomRequest request) {
        RoomMember member = roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        EventTemplate template = templateService.getOrThrow(room.getTemplateId());

        applyRoomUpdates(room, request, template);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);

        activityLogger.log(room, user, "room_updated", "Updated room details");
        long count = memberRepository.countByRoomId(room.getId());
        return roomMapper.toDetail(room, template.getName(), count, member.getRole(), true);
    }

    /**
     * Archives a room so it no longer appears in member room lists.
     * Requires leader privileges; preserves database rows for audit integrity.
     */
    @Transactional
    public void archiveRoom(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        room.setArchivedAt(Instant.now());
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "room_archived", "Archived the room");
    }

    /**
     * Generates a unique, non-colliding room name suggestion based on season and tech themes.
     */
    public SuggestNameResponse suggestName(User user) {
        String[] adjectives = {"Autumn", "Quantum", "Hyper", "Stellar", "Cosmic", "Agile", "Apex", "Nexus", "Turbo", "Vivid", "Rapid"};
        String[] nouns = {"Build Sprint", "Codefest", "Hacks", "Lab", "Works", "Studio", "Launch", "Sprint", "Challenge"};
        int year = LocalDate.now().getYear();

        for (int i = 0; i < 20; i++) {
            String adj = adjectives[RANDOM.nextInt(adjectives.length)];
            String noun = nouns[RANDOM.nextInt(nouns.length)];
            String candidate = adj + " " + noun + " " + year;
            return new SuggestNameResponse(candidate);
        }
        return new SuggestNameResponse("Hackathon Sprint " + year);
    }

    /**
     * Regenerates the 4-character join code for the room.
     * Requires leader privileges and immediately invalidates the old code.
     */
    @Transactional
    public JoinCodeResponse regenerateJoinCode(User user, UUID roomId) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        String newCode = generateUniqueJoinCode();
        room.setJoinCode(newCode);
        room.setUpdatedAt(Instant.now());
        roomRepository.save(room);
        activityLogger.log(room, user, "join_code_regenerated", "Regenerated the room join code");
        return new JoinCodeResponse(newCode);
    }

    /**
     * Returns stage steps and status for the room's hackathon journey.
     */
    public JourneyDto getJourney(User user, UUID roomId) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        return stageService.getJourney(room);
    }

    private void applyRoomUpdates(Room room, UpdateRoomRequest request, EventTemplate template) {
        if (request.name() != null) room.setName(request.name().trim());
        if (request.description() != null) room.setDescription(request.description().trim());
        if (request.projectDescription() != null) room.setProjectDescription(request.projectDescription().trim());
        if (request.timezone() != null) room.setTimezone(request.timezone().trim());
        if (request.eventStart() != null) {
            Instant newStart = Instant.parse(request.eventStart().trim());
            room.setEventStart(newStart);
            room.setEventEnd(newStart.plus(template.getDurationHours(), ChronoUnit.HOURS));
        }
    }

    private String resolveTimezone(User user, String requestedTimezone) {
        if (requestedTimezone != null && !requestedTimezone.isBlank()) {
            return requestedTimezone.trim();
        }
        return settingsRepository.findById(user.getId())
                .map(UserSettings::getTimezone)
                .orElse("UTC");
    }

    private Instant resolveEventStart(String eventStartStr, String timezone) {
        if (eventStartStr != null && !eventStartStr.isBlank()) {
            Instant parsed = Instant.parse(eventStartStr.trim());
            if (parsed.isAfter(Instant.now().plus(730, ChronoUnit.DAYS))) {
                throw new BadRequestException("INVALID_START_DATE", "Event start date cannot be more than 2 years in the future");
            }
            return parsed;
        }

        ZoneId zone = ZoneId.of(timezone.equals("UTC") ? "UTC" : timezone);
        LocalDate nextSaturday = LocalDate.now(zone).with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
        ZonedDateTime satMorning = nextSaturday.atTime(9, 0).atZone(zone);
        return satMorning.toInstant();
    }

    private String generateUniqueJoinCode() {
        for (int i = 0; i < 50; i++) {
            StringBuilder sb = new StringBuilder(4);
            for (int c = 0; c < 4; c++) {
                sb.append(JOIN_CODE_CHARS.charAt(RANDOM.nextInt(JOIN_CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByJoinCodeIgnoreCase(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique join code after retries");
    }

    private String generateKeyPrefix(String name) {
        if (name == null || name.isBlank()) return "ROOM";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            String cleaned = w.replaceAll("[^a-zA-Z]", "");
            if (!cleaned.isEmpty()) {
                sb.append(Character.toUpperCase(cleaned.charAt(0)));
            }
            if (sb.length() >= 4) break;
        }
        return sb.length() >= 2 ? sb.toString() : "ROOM";
    }
}
