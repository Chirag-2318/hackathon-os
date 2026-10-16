package com.hackathonos.backend.invites;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.email.MailService;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.invites.dto.*;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomAccessService;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class RoomEmailInviteService {

    private static final Logger log = LoggerFactory.getLogger(RoomEmailInviteService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy").withZone(ZoneId.of("UTC"));

    private final RoomInviteRepository roomInviteRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final EventTemplateRepository templateRepository;
    private final RoomAccessService roomAccessService;
    private final MailService mailService;
    private final AppProperties appProperties;
    private final ActivityLogger activityLogger;
    private final RoomEventService roomEventService;
    private final InviteService inviteService;

    public RoomEmailInviteService(RoomInviteRepository roomInviteRepository,
                                  RoomRepository roomRepository,
                                  RoomMemberRepository memberRepository,
                                  UserRepository userRepository,
                                  EventTemplateRepository templateRepository,
                                  RoomAccessService roomAccessService,
                                  MailService mailService,
                                  AppProperties appProperties,
                                  ActivityLogger activityLogger,
                                  RoomEventService roomEventService,
                                  InviteService inviteService) {
        this.roomInviteRepository = roomInviteRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.roomAccessService = roomAccessService;
        this.mailService = mailService;
        this.appProperties = appProperties;
        this.activityLogger = activityLogger;
        this.roomEventService = roomEventService;
        this.inviteService = inviteService;
    }

    @Transactional
    public EmailInviteItemDto sendEmailInvite(User caller, UUID roomId, InviteEmailRequest request) {
        roomAccessService.requireLeader(roomId, caller);

        if (request == null || request.email() == null || request.email().isBlank()) {
            throw new BadRequestException("INVALID_EMAIL", "Recipient email is required");
        }
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches() || normalizedEmail.length() > 254) {
            throw new BadRequestException("INVALID_EMAIL", "Invalid email address format or length");
        }

        Room room = roomAccessService.getActiveRoomOrThrow(roomId);

        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(targetUser -> {
            if (memberRepository.existsByRoomIdAndUserId(roomId, targetUser.getId())) {
                throw new ConflictException("ALREADY_MEMBER", "This user is already a member of this room");
            }
        });

        Optional<RoomInvite> activeInviteOpt = roomInviteRepository
                .findFirstByRoomIdAndEmailNormalizedAndStatus(roomId, normalizedEmail, "PENDING");
        if (activeInviteOpt.isPresent()) {
            return resendInvite(caller, roomId, activeInviteOpt.get().getId());
        }

        long pendingCount = roomInviteRepository.countByRoomIdAndStatus(roomId, "PENDING");
        if (pendingCount >= 10) {
            throw new BadRequestException("INVITE_LIMIT_EXCEEDED", "Maximum 10 pending invites allowed per room");
        }

        long invitesLastHour = roomInviteRepository.countByInvitedByAndCreatedAtGreaterThanEqual(
                caller.getId(),
                Instant.now().minus(Duration.ofHours(1))
        );
        if (invitesLastHour >= 20) {
            throw new BadRequestException("RATE_LIMITED", "You have reached the limit of 20 invites per hour");
        }

        long currentMembers = memberRepository.countByRoomId(roomId);
        int cap = getRoomMemberCap(room);
        if (cap > 0 && currentMembers + pendingCount >= cap) {
            throw new BadRequestException("ROOM_FULL", "Room capacity reached (members + pending invites cannot exceed " + cap + ")");
        }

        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);
        String note = (request.note() != null && !request.note().isBlank()) ? request.note().trim() : null;

        RoomInvite invite = new RoomInvite(roomId, normalizedEmail, tokenHash, caller.getId(), note, expiresAt);
        invite = roomInviteRepository.save(invite);

        enqueueInviteEmail(caller, room, invite, normalizedEmail, rawToken, currentMembers, cap);
        activityLogger.log(room, caller, "invite_sent", caller.getName() + " invited " + normalizedEmail + " via email");

        return toDto(invite, caller.getName());
    }

    public List<EmailInviteItemDto> listRoomInvites(User caller, UUID roomId) {
        roomAccessService.requireLeader(roomId, caller);
        Instant recentCutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        List<RoomInvite> invites = roomInviteRepository.findPendingAndRecentlyExpired(roomId, recentCutoff);
        List<EmailInviteItemDto> results = new ArrayList<>();
        Map<UUID, String> userNameCache = new HashMap<>();

        for (RoomInvite inv : invites) {
            String inviterName = userNameCache.computeIfAbsent(inv.getInvitedBy(), id ->
                    userRepository.findById(id).map(User::getName).orElse("Team Leader"));
            results.add(toDto(inv, inviterName));
        }
        return results;
    }

    @Transactional
    public EmailInviteItemDto resendInvite(User caller, UUID roomId, UUID inviteId) {
        roomAccessService.requireLeader(roomId, caller);
        RoomInvite invite = roomInviteRepository.findByIdAndRoomId(inviteId, roomId)
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));

        if (!"PENDING".equalsIgnoreCase(invite.getStatus())) {
            throw new BadRequestException("INVALID_STATUS", "Only pending invites can be resent");
        }

        long minutesSinceLast = Duration.between(invite.getLastSentAt(), Instant.now()).toMinutes();
        if (minutesSinceLast < 10) {
            throw new BadRequestException("COOLDOWN_ACTIVE", "Please wait at least 10 minutes between resend attempts");
        }

        if (invite.getSendCount() >= 3) {
            throw new BadRequestException("MAX_SENDS_EXCEEDED", "Maximum 3 sends reached for this invitation");
        }

        Room room = roomAccessService.getActiveRoomOrThrow(roomId);
        String rawToken = generateRawToken();
        String tokenHash = hashToken(rawToken);

        invite.setTokenHash(tokenHash);
        invite.setLastSentAt(Instant.now());
        invite.setSendCount(invite.getSendCount() + 1);
        invite = roomInviteRepository.save(invite);

        long currentMembers = memberRepository.countByRoomId(roomId);
        int cap = getRoomMemberCap(room);
        enqueueInviteEmail(caller, room, invite, invite.getEmailNormalized(), rawToken, currentMembers, cap);

        return toDto(invite, caller.getName());
    }

    @Transactional
    public void revokeInvite(User caller, UUID roomId, UUID inviteId) {
        roomAccessService.requireLeader(roomId, caller);
        RoomInvite invite = roomInviteRepository.findByIdAndRoomId(inviteId, roomId)
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));
        invite.setStatus("REVOKED");
        roomInviteRepository.save(invite);
    }

    public TokenInvitePreviewDto previewInvite(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new NotFoundException("INVITE_NOT_FOUND", "Invite not found");
        }

        String tokenHash = hashToken(rawToken);
        RoomInvite invite = roomInviteRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));

        if (!"PENDING".equalsIgnoreCase(invite.getStatus()) || Instant.now().isAfter(invite.getExpiresAt())) {
            if ("PENDING".equalsIgnoreCase(invite.getStatus()) && Instant.now().isAfter(invite.getExpiresAt())) {
                invite.setStatus("EXPIRED");
                roomInviteRepository.save(invite);
            }
            throw new NotFoundException("INVITE_NOT_FOUND", "Invite not found");
        }

        Room room = roomRepository.findByIdAndArchivedAtIsNull(invite.getRoomId())
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));
        if (room.getDeletedAt() != null) {
            throw new NotFoundException("INVITE_NOT_FOUND", "Invite not found");
        }

        User inviter = userRepository.findById(invite.getInvitedBy())
                .orElseGet(() -> new User("SYSTEM", "sys", "Team Host", null, null, null));

        long memberCount = memberRepository.countByRoomId(room.getId());
        int cap = getRoomMemberCap(room);
        String templateName = getTemplateName(room);
        String duration = room.getDurationHours() + "h";

        UserSummaryDto.ResolvedAvatar inviterSummary = UserSummaryDto.resolveAvatar(inviter);

        return new TokenInvitePreviewDto(
                room.getName(),
                templateName,
                duration,
                inviter.getUsername() != null ? inviter.getUsername() : inviter.getName(),
                inviter.getDisplayName() != null ? inviter.getDisplayName() : inviter.getName(),
                inviterSummary.avatarUrl(),
                memberCount,
                cap > 0 ? cap : 4,
                invite.getExpiresAt()
        );
    }

    @Transactional
    public JoinInviteResponse acceptInvite(User caller, String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new NotFoundException("INVITE_NOT_FOUND", "Invite not found");
        }

        String tokenHash = hashToken(rawToken);
        RoomInvite invite = roomInviteRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("INVITE_NOT_FOUND", "Invite not found"));

        if (!"PENDING".equalsIgnoreCase(invite.getStatus()) || Instant.now().isAfter(invite.getExpiresAt())) {
            throw new NotFoundException("INVITE_NOT_FOUND", "Invite not found");
        }

        Room room = roomRepository.findByIdAndArchivedAtIsNull(invite.getRoomId())
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));
        if (room.getDeletedAt() != null) {
            throw new NotFoundException("ROOM_NOT_FOUND", "Room not found");
        }

        if (memberRepository.existsByRoomIdAndUserId(room.getId(), caller.getId())) {
            return new JoinInviteResponse(room.getId());
        }

        int cap = getRoomMemberCap(room);
        long currentMembers = memberRepository.countByRoomId(room.getId());
        if (currentMembers >= 20) {
            throw new com.hackathonos.backend.common.error.LimitReachedException(
                    com.hackathonos.backend.common.error.ErrorCode.LIMIT_REACHED,
                    "This room has reached the maximum limit of 20 members."
            );
        }
        if (cap > 0 && currentMembers >= cap) {
            throw new BadRequestException("ROOM_FULL", "Room has reached the maximum capacity of " + cap + " members");
        }

        inviteService.addMemberAndProcessInvites(caller, room, "BUILDER");

        invite.setStatus("ACCEPTED");
        invite.setAcceptedBy(caller.getId());
        invite.setAcceptedAt(Instant.now());
        roomInviteRepository.save(invite);

        activityLogger.log(room, caller, "invite_accepted", caller.getName() + " accepted an email invitation");
        roomEventService.recordEvent(room.getId(), "invite.accepted", "room_invite", invite.getId().toString(), caller.getId());

        return new JoinInviteResponse(room.getId());
    }

    private void enqueueInviteEmail(User inviter, Room room, RoomInvite invite, String email,
                                    String rawToken, long currentMembers, int cap) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("roomName", room.getName());
        vars.put("inviter", inviter.getUsername() != null ? inviter.getUsername() : inviter.getName());
        vars.put("templateName", getTemplateName(room));
        vars.put("duration", room.getDurationHours() + "h");
        vars.put("memberCount", (int) currentMembers);
        vars.put("memberCap", cap > 0 ? cap : 4);
        vars.put("stubCode", !room.isCodeRevoked() && room.getJoinCode() != null ? room.getJoinCode() : "JOIN");
        vars.put("note", invite.getNote());
        vars.put("inviteUrl", appProperties.getPublicUrl() + "/join?token=" + rawToken);
        vars.put("expiryDate", DATE_FORMATTER.format(invite.getExpiresAt()));
        if (!room.isCodeRevoked() && room.getJoinCode() != null) {
            vars.put("joinCode", room.getJoinCode());
        }

        mailService.enqueue("invite", email, vars, "invite:" + invite.getId() + ":" + invite.getSendCount());
    }

    private int getRoomMemberCap(Room room) {
        int cap = 4;
        if (room.getTemplateId() != null) {
            cap = templateRepository.findById(room.getTemplateId())
                    .map(com.hackathonos.backend.templates.EventTemplate::getTeamMax)
                    .orElse(4);
        }
        return Math.min(cap > 0 ? cap : 20, 20);
    }

    private String getTemplateName(Room room) {
        if (room.getTemplateId() != null) {
            return templateRepository.findById(room.getTemplateId())
                    .map(com.hackathonos.backend.templates.EventTemplate::getName)
                    .orElse("Full Stack Hackathon");
        }
        return "Full Stack Hackathon";
    }

    private EmailInviteItemDto toDto(RoomInvite inv, String inviterName) {
        return new EmailInviteItemDto(
                inv.getId(),
                inv.getEmailNormalized(),
                inviterName,
                inv.getInvitedBy(),
                inv.getCreatedAt(),
                inv.getExpiresAt(),
                inv.getSendCount(),
                inv.getNote(),
                inv.getStatus()
        );
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String rawToken) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
