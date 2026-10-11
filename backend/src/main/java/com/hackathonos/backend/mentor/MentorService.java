package com.hackathonos.backend.mentor;

import com.hackathonos.backend.activity.ActivityEvent;
import com.hackathonos.backend.activity.ActivityEventRepository;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.config.AppProperties;
import com.hackathonos.backend.common.error.*;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing mentor invitation links, public context packages, and mentor Q&A.
 */
@Service
public class MentorService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

    // Rate limiting: 5 per hour per token, 20 per hour per IP
    private final Map<String, List<Instant>> tokenAskTimestamps = new ConcurrentHashMap<>();
    private final Map<String, List<Instant>> ipAskTimestamps = new ConcurrentHashMap<>();

    private final MentorLinkRepository linkRepository;
    private final MentorQuestionRepository questionRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final ActivityEventRepository activityEventRepository;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final RoomAccess roomAccess;
    private final AppProperties appProperties;

    public MentorService(
            MentorLinkRepository linkRepository,
            MentorQuestionRepository questionRepository,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            ActivityEventRepository activityEventRepository,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            RoomAccess roomAccess,
            AppProperties appProperties
    ) {
        this.linkRepository = linkRepository;
        this.questionRepository = questionRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.activityEventRepository = activityEventRepository;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.roomAccess = roomAccess;
        this.appProperties = appProperties;
    }

    /**
     * Creates a new mentor access link (max 5 active per room).
     */
    @Transactional
    public MentorDtos.MentorLinkDto createLink(UUID roomId, User user, MentorDtos.CreateMentorLinkRequest req) {
        roomAccess.requireMember(roomId, user);

        Instant now = Instant.now();
        List<MentorLink> activeLinks = linkRepository.findByRoomIdAndRevokedAtIsNullAndExpiresAtAfter(roomId, now);
        if (activeLinks.size() >= 5) {
            throw new BadRequestException("MAX_MENTOR_LINKS", "At most 5 active mentor links are allowed per room");
        }

        int days = req.expiresInDays() != null ? Math.min(Math.max(1, req.expiresInDays()), 14) : 3;
        Instant expiresAt = now.plus(Duration.ofDays(days));

        String token = generateToken(40);
        MentorLink link = new MentorLink(roomId, token, user.getId(), expiresAt, now);
        MentorLink saved = linkRepository.save(link);

        return toLinkDto(saved);
    }

    /**
     * Lists active mentor links for a room.
     */
    @Transactional(readOnly = true)
    public List<MentorDtos.MentorLinkDto> listLinks(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Instant now = Instant.now();
        return linkRepository.findByRoomIdAndRevokedAtIsNullAndExpiresAtAfter(roomId, now).stream()
                .map(this::toLinkDto).toList();
    }

    /**
     * Revokes a mentor link; creator or room leader only.
     */
    @Transactional
    public void revokeLink(UUID roomId, UUID linkId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        MentorLink link = linkRepository.findById(linkId)
                .filter(l -> l.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("LINK_NOT_FOUND", "Mentor link not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isCreator = user.getId().equals(link.getCreatedBy());
        if (!isLeader && !isCreator) {
            throw new ForbiddenException("CANNOT_REVOKE_LINK", "Only the link creator or room leader can revoke this link");
        }

        link.setRevokedAt(Instant.now());
        linkRepository.save(link);
    }

    /**
     * Public read-only context package for a mentor (sanitized of all emails and IDs).
     */
    @Transactional(readOnly = true)
    public MentorDtos.MentorContextResponse getPublicContext(String token) {
        if (token == null || token.isBlank()) {
            throw new NotFoundException("LINK_NOT_FOUND", "Mentor link not found");
        }

        MentorLink link = linkRepository.findByToken(token.trim())
                .orElseThrow(() -> new NotFoundException("LINK_NOT_FOUND", "Mentor link not found"));

        Instant now = Instant.now();
        if (link.getRevokedAt() != null || now.isAfter(link.getExpiresAt())) {
            throw new NotFoundException("LINK_EXPIRED_OR_REVOKED", "This mentor link has expired or been revoked");
        }

        Room room = roomRepository.findById(link.getRoomId())
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));

        // Hours left
        long hoursLeft = room.getEventEnd() != null
                ? Math.max(0, Duration.between(now, room.getEventEnd()).toHours()) : 18;

        // Plan snapshot
        String prd = getDocContent(room.getId(), "PRD.md");
        String prdSummary = prd.length() > 1500 ? prd.substring(0, 1500) + "..." : prd;
        String tech = getDocContent(room.getId(), "TECH_STACK.md");
        List<String> techRows = Arrays.stream(tech.split("\\r?\\n"))
                .filter(l -> l.startsWith("|") && !l.contains("---"))
                .toList();
        MentorDtos.PlanSnapshotDto plan = new MentorDtos.PlanSnapshotDto(prdSummary, techRows);

        // Board snapshot
        List<Task> tasks = taskRepository.findByRoomId(room.getId());
        int totalTasks = tasks.size();
        int todo = 0, inProgress = 0, done = 0;
        List<MentorDtos.BlockedTaskDto> blocked = new ArrayList<>();
        for (Task t : tasks) {
            if ("DONE".equalsIgnoreCase(t.getStatus())) done++;
            else if ("IN_PROGRESS".equalsIgnoreCase(t.getStatus())) inProgress++;
            else todo++;

            if ("BLOCKED".equalsIgnoreCase(t.getStatus()) || t.isFlagged()) {
                String reason = t.getBlockedReason() != null && !t.getBlockedReason().isBlank() ? t.getBlockedReason() : "Dependencies pending";
                blocked.add(new MentorDtos.BlockedTaskDto(t.getTaskKey(), t.getSummary(), reason));
            }
        }
        MentorDtos.BoardSnapshotDto board = new MentorDtos.BoardSnapshotDto(totalTasks, todo, inProgress, done, blocked);

        // Team
        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        List<MentorDtos.MentorTeamMemberDto> team = new ArrayList<>();
        for (RoomMember m : members) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            List<String> skills = skillRepository.findByMemberId(m.getId()).stream()
                    .map(RoomMemberSkill::getSkill).toList();
            team.add(new MentorDtos.MentorTeamMemberDto(
                    u != null ? u.getName() : "Builder",
                    m.getRole(),
                    skills
            ));
        }

        // Recent Activity
        List<ActivityEvent> logs = activityEventRepository.findByRoomIdOrderByCreatedAtDesc(room.getId(), PageRequest.of(0, 5));
        List<String> recentActivity = logs.stream().map(ActivityEvent::getSummary).toList();

        // Identity and Problem
        String identity = extractSection(prd, "One-sentence identity");
        String problem = extractSection(prd, "Problem");
        if (identity.isBlank()) identity = room.getName();

        String askTemplate = "Our project is " + identity + ". We are currently working on our core MVP flow. Our question is: ";

        // Frontend context compatibility
        List<BriefRubricItem> rubrics = briefRepository.findByRoomId(room.getId())
                .map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());
        List<MentorDtos.RubricWeightDto> rubricDtos = rubrics.stream()
                .map(r -> new MentorDtos.RubricWeightDto(r.getCriterion(), r.getWeight())).toList();

        MentorDtos.FrontendContextSnapshot context = new MentorDtos.FrontendContextSnapshot(
                room.getName(),
                problem.isBlank() ? "Building solution for event brief" : problem,
                room.getStage() != null ? room.getStage() : "Build",
                rubricDtos,
                now
        );

        return new MentorDtos.MentorContextResponse(
                room.getName(),
                room.getName(),
                identity,
                problem,
                room.getStage(),
                hoursLeft,
                plan,
                board,
                team,
                recentActivity,
                askTemplate,
                link.getExpiresAt(),
                context,
                now
        );
    }

    /**
     * Public question submission by mentor, rate limited and alerting room leaders.
     */
    @Transactional
    public void submitPublicQuestion(String token, String clientIp, MentorDtos.PublicAskRequest req) {
        if (token == null || token.isBlank()) {
            throw new NotFoundException("LINK_NOT_FOUND", "Mentor link not found");
        }
        if (req.question() == null || req.question().trim().length() < 10 || req.question().trim().length() > 1000) {
            throw new BadRequestException("INVALID_QUESTION", "Question must be between 10 and 1000 characters");
        }

        // Rate limit: 5 per token per hour, 20 per IP per hour
        checkRateLimit(tokenAskTimestamps, token, 5, "Too many questions submitted through this mentor link (max 5/hr)");
        if (clientIp != null) {
            checkRateLimit(ipAskTimestamps, clientIp, 20, "Rate limit exceeded from this IP address (max 20/hr)");
        }

        MentorLink link = linkRepository.findByToken(token.trim())
                .orElseThrow(() -> new NotFoundException("LINK_NOT_FOUND", "Mentor link not found"));

        Instant now = Instant.now();
        if (link.getRevokedAt() != null || now.isAfter(link.getExpiresAt())) {
            throw new NotFoundException("LINK_EXPIRED_OR_REVOKED", "This mentor link has expired or been revoked");
        }

        Room room = roomRepository.findById(link.getRoomId())
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));

        String mentorName = req.mentorName() != null && !req.mentorName().isBlank()
                ? req.mentorName().trim() : "Mentor";
        if (mentorName.length() > 60) {
            mentorName = mentorName.substring(0, 60);
        }

        MentorQuestion question = new MentorQuestion(
                room.getId(),
                link.getId(),
                mentorName,
                req.question().trim(),
                "OPEN",
                now
        );
        questionRepository.save(question);

        activityLogger.log(room, null, "MENTOR_QUESTION", mentorName + " asked: " + req.question().trim());
        notificationService.notifyRoomMembers(room, null, NotificationType.MENTOR_QUESTION,
                "New mentor question", mentorName + " asked a question: " + req.question().trim());
    }

    /**
     * Lists mentor questions for room members.
     */
    @Transactional(readOnly = true)
    public List<MentorDtos.MentorQuestionDto> listQuestions(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        return questionRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(this::toQuestionDto).toList();
    }

    /**
     * Records a team answer to a mentor question.
     */
    @Transactional
    public MentorDtos.MentorQuestionDto answerQuestion(UUID roomId, UUID questionId, User user, MentorDtos.AnswerQuestionRequest req) {
        roomAccess.requireMember(roomId, user);
        MentorQuestion q = questionRepository.findById(questionId)
                .filter(item -> item.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("QUESTION_NOT_FOUND", "Mentor question not found"));

        if (req.answer() != null) q.setAnswer(req.answer().trim());
        q.setStatus(req.status() != null ? req.status().trim().toUpperCase(Locale.ROOT) : "ANSWERED");
        q.setAnsweredAt(Instant.now());
        q.setAnsweredBy(user.getId());

        MentorQuestion saved = questionRepository.save(q);
        return toQuestionDto(saved);
    }

    private void checkRateLimit(Map<String, List<Instant>> map, String key, int maxPerHour, String errorMsg) {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        List<Instant> timestamps = map.computeIfAbsent(key, k -> new ArrayList<>());
        synchronized (timestamps) {
            timestamps.removeIf(t -> t.isBefore(cutoff));
            if (timestamps.size() >= maxPerHour) {
                throw new TooManyRequestsException("RATE_LIMIT_EXCEEDED", errorMsg);
            }
            timestamps.add(Instant.now());
        }
    }

    private String generateToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    private MentorDtos.MentorLinkDto toLinkDto(MentorLink l) {
        String base = appProperties.getFrontendUrl();
        if (base == null || base.isBlank()) base = "http://localhost:5173";
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        String url = base + "/mentor/" + l.getToken();

        return new MentorDtos.MentorLinkDto(l.getId(), l.getToken(), url, l.getExpiresAt(), l.getCreatedAt());
    }

    private MentorDtos.MentorQuestionDto toQuestionDto(MentorQuestion q) {
        String answeredByName = null;
        if (q.getAnsweredBy() != null) {
            answeredByName = userRepository.findById(q.getAnsweredBy())
                    .map(User::getName).orElse(null);
        }
        return new MentorDtos.MentorQuestionDto(
                q.getId(),
                q.getMentorName(),
                q.getQuestion(),
                q.getAnswer(),
                q.getStatus(),
                q.getCreatedAt(),
                q.getAnsweredAt(),
                answeredByName
        );
    }

    private String getDocContent(UUID roomId, String fileName) {
        return docRepository.findByRoomIdAndFileName(roomId, fileName)
                .flatMap(d -> docVersionRepository.findByDocIdAndVersion(d.getId(), d.getCurrentVersion()))
                .map(DocVersion::getContent)
                .orElse("");
    }

    private String extractSection(String content, String heading) {
        int idx = content.indexOf(heading);
        if (idx < 0) return "";
        int start = idx + heading.length();
        int end = content.indexOf("\n#", start);
        String sub = end >= 0 ? content.substring(start, end) : content.substring(start);
        return sub.replaceAll("^[\\s:#-]+", "").trim();
    }
}
