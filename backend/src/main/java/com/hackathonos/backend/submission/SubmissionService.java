package com.hackathonos.backend.submission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.ai.AiService;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.http.SafeHttpClient;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.EntityConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.users.dto.UserSummaryDto;
import com.hackathonos.backend.demo.DemoMedia;
import com.hackathonos.backend.demo.DemoMediaRepository;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.github.GithubRepo;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service managing final hackathon project submission, verification, and link validation.
 */
@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionChecklistItemRepository checklistRepository;
    private final SubmissionLinkRepository linkRepository;
    private final DemoMediaRepository mediaRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final BriefRepository briefRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomAccess roomAccess;
    private final CheckpointService checkpointService;
    private final NotificationService notificationService;
    private final AiService aiService;
    private final SafeHttpClient safeHttpClient;
    private final ObjectMapper objectMapper;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;
    private final com.hackathonos.backend.activity.ActivityLogger activityLogger;
    private final com.hackathonos.backend.email.MailService mailService;
    private final com.hackathonos.backend.common.config.AppProperties appProperties;
    private final com.hackathonos.backend.users.UserRepository userRepository;

    public SubmissionService(
            SubmissionRepository submissionRepository,
            SubmissionChecklistItemRepository checklistRepository,
            SubmissionLinkRepository linkRepository,
            DemoMediaRepository mediaRepository,
            GithubRepoRepository githubRepoRepository,
            BriefRepository briefRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            RoomAccess roomAccess,
            CheckpointService checkpointService,
            NotificationService notificationService,
            AiService aiService,
            SafeHttpClient safeHttpClient,
            ObjectMapper objectMapper,
            com.hackathonos.backend.events.RoomEventService roomEventService,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            com.hackathonos.backend.activity.ActivityLogger activityLogger,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            com.hackathonos.backend.email.MailService mailService,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            com.hackathonos.backend.common.config.AppProperties appProperties,
            @org.springframework.beans.factory.annotation.Autowired(required = false)
            com.hackathonos.backend.users.UserRepository userRepository
    ) {
        this.submissionRepository = submissionRepository;
        this.checklistRepository = checklistRepository;
        this.linkRepository = linkRepository;
        this.mediaRepository = mediaRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.briefRepository = briefRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.roomAccess = roomAccess;
        this.checkpointService = checkpointService;
        this.notificationService = notificationService;
        this.aiService = aiService;
        this.safeHttpClient = safeHttpClient;
        this.objectMapper = objectMapper;
        this.roomEventService = roomEventService;
        this.activityLogger = activityLogger;
        this.mailService = mailService;
        this.appProperties = appProperties;
        this.userRepository = userRepository;
    }

    /**
     * Retrieves the submission dashboard model, calculating auto checklist items and blockers.
     */
    @Transactional
    public SubmissionDtos.SubmissionResponse getSubmission(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);

        Room room = roomRepository.findById(roomId).orElseThrow();
        Submission sub = submissionRepository.findByRoomId(roomId).orElseGet(() -> {
            Submission newSub = new Submission(roomId, "DRAFT", "{}", "[]", Instant.now());
            return submissionRepository.save(newSub);
        });

        // Ensure default checklist items exist
        List<SubmissionChecklistItem> items = checklistRepository.findByRoomIdOrderByLabelAsc(roomId);
        if (items.isEmpty()) {
            items = seedChecklist(roomId);
        }

        // Auto-ticks update
        updateAutoChecklistItems(roomId, items);

        // Parse Draft
        Map<String, String> draftMap = parseDraftMap(sub.getDraft());
        SubmissionDtos.SubmissionDraftDto draftDto = toDraftDto(draftMap);

        // Deadline
        Instant now = Instant.now();
        Instant deadlineAt = room.getEventEnd() != null ? room.getEventEnd() : now.plus(Duration.ofHours(24));
        long hoursLeft = Duration.between(now, deadlineAt).toHours();
        String deadlineStatus = now.isAfter(deadlineAt) ? "PASSED" : (hoursLeft <= 3 ? "URGENT" : "ON_TRACK");
        SubmissionDtos.DeadlineInfoDto deadlineDto = new SubmissionDtos.DeadlineInfoDto(deadlineAt, hoursLeft, deadlineStatus);

        // Requirements lines from Brief
        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        List<String> requirements = new ArrayList<>();
        if (brief != null) {
            if (brief.getDeliverables() != null && !brief.getDeliverables().isBlank()) {
                requirements.addAll(parseRequirementsList(brief.getDeliverables()));
            }
            if (brief.getTracksAndPrizes() != null && !brief.getTracksAndPrizes().isBlank()) {
                requirements.addAll(parseRequirementsList(brief.getTracksAndPrizes()));
            }
        }

        // Form fields
        List<SubmissionDtos.FormFieldDto> formFields = parseFormFields(sub.getFormFields());

        // Links
        List<SubmissionLink> links = linkRepository.findByRoomIdOrderByLabelAsc(roomId);
        List<SubmissionDtos.SubmissionLinkDto> linkDtos = links.stream().map(l ->
                new SubmissionDtos.SubmissionLinkDto(l.getId(), l.getLabel(), l.getUrl(), l.getOk(), l.getHttpStatus(), l.getLastCheckedAt())
        ).toList();

        List<SubmissionDtos.LinkCheckRowDto> linkCheckRows = links.stream().map(l ->
                new SubmissionDtos.LinkCheckRowDto(l.getUrl(), Boolean.TRUE.equals(l.getOk()) ? "verified" : (Boolean.FALSE.equals(l.getOk()) ? "failing" : "unknown"), null)
        ).toList();

        // Judge view preview
        StringBuilder previewSb = new StringBuilder();
        List<String> missingSections = new ArrayList<>();
        appendSection(previewSb, missingSections, "What It Does", draftDto.whatItDoes());
        appendSection(previewSb, missingSections, "Why It Matters", draftDto.whyItMatters());
        appendSection(previewSb, missingSections, "How We Built It", draftDto.howBuilt());
        appendSection(previewSb, missingSections, "Challenges", draftDto.challenges());
        appendSection(previewSb, missingSections, "What's Next", draftDto.whatsNext());

        String previewText = previewSb.toString().trim();
        int wordCount = previewText.isBlank() ? 0 : previewText.split("\\s+").length;
        int readingSeconds = (wordCount * 60) / 200;
        SubmissionDtos.JudgeViewDto judgeView = new SubmissionDtos.JudgeViewDto(wordCount, readingSeconds, missingSections, previewText);

        // Blockers evaluation
        List<String> blockers = new ArrayList<>();
        for (SubmissionChecklistItem item : items) {
            if (item.isRequired() && !item.isDone()) {
                blockers.add("Checklist incomplete: " + item.getLabel());
            }
        }
        for (SubmissionLink link : links) {
            if (link.getOk() == null || !link.getOk()) {
                blockers.add("Link verification failed: " + link.getLabel() + " (" + link.getUrl() + ")");
            }
        }
        for (String missing : missingSections) {
            blockers.add("Draft section empty: " + missing);
        }

        boolean canVerify = blockers.isEmpty();
        boolean lateEdit = room.getEventEnd() != null && now.isAfter(room.getEventEnd());

        List<SubmissionDtos.ChecklistItemDto> checklistDtos = items.stream().map(this::toChecklistDto).toList();

        boolean isLeader = false;
        try {
            RoomMember member = roomAccess.requireMember(roomId, user);
            isLeader = member != null && "leader".equalsIgnoreCase(member.getRole());
        } catch (Exception ignored) {}

        String demoUrl = mediaRepository.findByRoomId(roomId).map(DemoMedia::getVideoUrl).orElse(null);
        String repoUrl = githubRepoRepository.findById(roomId).map(GithubRepo::getUrl).orElse(null);
        String liveUrl = links.stream()
                .filter(l -> l.getLabel() != null && (l.getLabel().toLowerCase().contains("live") || l.getLabel().toLowerCase().contains("demo") || l.getLabel().toLowerCase().contains("app")))
                .map(SubmissionLink::getUrl)
                .findFirst().orElse(null);

        Instant submittedAt = room.getSubmittedAt() != null ? room.getSubmittedAt() : sub.getSubmittedAt();
        String effectiveStatus = submittedAt != null ? "submitted" : sub.getStatus().toLowerCase(Locale.ROOT);

        SubmissionDtos.LeaderInfoDto leaderInfo = null;
        try {
            RoomMember leaderMember = memberRepository.findByRoomId(roomId).stream()
                    .filter(m -> "leader".equalsIgnoreCase(m.getRole()))
                    .findFirst().orElse(null);
            if (leaderMember != null && userRepository != null) {
                User leaderUser = userRepository.findById(leaderMember.getUserId()).orElse(null);
                if (leaderUser != null) {
                    leaderInfo = new SubmissionDtos.LeaderInfoDto(
                            leaderUser.getId(),
                            leaderUser.getUsername(),
                            leaderUser.getName(),
                            leaderUser.getAvatarUrl()
                    );
                }
            }
        } catch (Exception ignored) {}

        return new SubmissionDtos.SubmissionResponse(
                effectiveStatus,
                deadlineDto,
                requirements,
                formFields,
                draftDto,
                checklistDtos,
                checklistDtos,
                linkDtos,
                linkCheckRows,
                judgeView,
                canVerify,
                blockers,
                lateEdit,
                now,
                isLeader,
                null,
                demoUrl,
                liveUrl,
                repoUrl,
                submittedAt,
                leaderInfo
        );
    }

    private List<String> parseRequirementsList(String val) {
        if (val == null || val.isBlank()) return Collections.emptyList();
        try {
            List<String> list = objectMapper.readValue(val, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            if (list != null && !list.isEmpty()) {
                return list.stream().filter(s -> s != null && !s.isBlank()).toList();
            }
        } catch (Exception ignored) {}
        return Arrays.stream(val.split("\\r?\\n"))
                .map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    /**
     * Updates draft section contents (up to 3000 chars per section).
     */
    @Transactional
    public SubmissionDtos.SubmissionDraftDto updateDraft(UUID roomId, User user, SubmissionDtos.UpdateDraftRequest req) {
        roomAccess.requireMember(roomId, user);
        validateDraftLength("whatItDoes", req.whatItDoes());
        validateDraftLength("whyItMatters", req.whyItMatters());
        validateDraftLength("howBuilt", req.getEffectiveHowBuilt());
        validateDraftLength("challenges", req.challenges());
        validateDraftLength("whatsNext", req.whatsNext());

        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseGet(() -> new Submission(roomId, "DRAFT", "{}", "[]", Instant.now()));

        if (req.version() != null && req.version() != sub.getVersion()) {
            UserSummaryDto lastEditor = sub.getLastEditedBy() != null && userRepository != null
                    ? userRepository.findById(sub.getLastEditedBy()).map(UserSummaryDto::from).orElse(null)
                    : null;
            SubmissionDtos.SubmissionDraftDto latestDraft = getSubmission(roomId, user).draft();
            throw new EntityConflictException("CHANGED", "Submission draft was updated by another team member", sub.getVersion(), lastEditor, sub.getCreatedAt(), latestDraft);
        }
        sub.setLastEditedBy(user.getId());

        Map<String, String> map = new HashMap<>();
        map.put("whatItDoes", req.whatItDoes() != null ? req.whatItDoes().trim() : "");
        map.put("whyItMatters", req.whyItMatters() != null ? req.whyItMatters().trim() : "");
        map.put("howBuilt", req.getEffectiveHowBuilt().trim());
        map.put("challenges", req.challenges() != null ? req.challenges().trim() : "");
        map.put("whatsNext", req.whatsNext() != null ? req.whatsNext().trim() : "");

        try {
            sub.setDraft(objectMapper.writeValueAsString(map));
        } catch (Exception ignored) {}
        submissionRepository.save(sub);

        return toDraftDto(map);
    }

    /**
     * Auto-populates empty draft fields from project documents, with optional AI polish.
     */
    @Transactional
    public SubmissionDtos.SubmissionDraftDto generateDraft(UUID roomId, User user, SubmissionDtos.GenerateDraftRequest req) {
        roomAccess.requireMember(roomId, user);
        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseGet(() -> new Submission(roomId, "DRAFT", "{}", "[]", Instant.now()));

        Map<String, String> map = parseDraftMap(sub.getDraft());

        String prd = getDocContent(roomId, "PRD.md");
        String tech = getDocContent(roomId, "TECH_STACK.md");
        String risks = getDocContent(roomId, "RISKS.md");
        String cutList = getDocContent(roomId, "CUT_LIST.md");

        if (map.getOrDefault("whatItDoes", "").isBlank()) {
            map.put("whatItDoes", extractDocSection(prd, "One-sentence identity", "Problem"));
        }
        if (map.getOrDefault("whyItMatters", "").isBlank()) {
            map.put("whyItMatters", extractDocSection(prd, "Problem", "Target user"));
        }
        if (map.getOrDefault("howBuilt", "").isBlank()) {
            map.put("howBuilt", !tech.isBlank() ? tech.substring(0, Math.min(tech.length(), 600)) : "Built using fullstack architecture.");
        }
        if (map.getOrDefault("challenges", "").isBlank()) {
            map.put("challenges", !risks.isBlank() ? risks.substring(0, Math.min(risks.length(), 600)) : "Navigating integration constraints and time limits.");
        }
        if (map.getOrDefault("whatsNext", "").isBlank()) {
            map.put("whatsNext", !cutList.isBlank() ? cutList.substring(0, Math.min(cutList.length(), 600)) : "Deploying production release and onboarding initial users.");
        }

        if (Boolean.TRUE.equals(req.useAi())) {
            String prompt = "Please polish and refine this hackathon submission draft to be clear, professional, and compelling for judges:\n" +
                    "What it does: " + map.get("whatItDoes") + "\n" +
                    "Why it matters: " + map.get("whyItMatters") + "\n" +
                    "How we built it: " + map.get("howBuilt") + "\n" +
                    "Challenges: " + map.get("challenges") + "\n" +
                    "What's next: " + map.get("whatsNext") + "\n\n" +
                    "Return ONLY JSON with keys: \"whatItDoes\", \"whyItMatters\", \"howBuilt\", \"challenges\", \"whatsNext\".";
            String response = aiService.complete(user.getId(), prompt);
            if (response != null && !response.isBlank()) {
                try {
                    Map<String, String> aiMap = objectMapper.readValue(response, new TypeReference<>() {});
                    if (aiMap != null) map.putAll(aiMap);
                } catch (Exception ignored) {}
            }
        }

        try {
            sub.setDraft(objectMapper.writeValueAsString(map));
            submissionRepository.save(sub);
        } catch (Exception ignored) {}

        return toDraftDto(map);
    }

    /**
     * Updates submission form fields.
     */
    @Transactional
    public List<SubmissionDtos.FormFieldDto> updateFormFields(UUID roomId, User user, SubmissionDtos.UpdateFormFieldsRequest req) {
        roomAccess.requireMember(roomId, user);
        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseGet(() -> new Submission(roomId, "DRAFT", "{}", "[]", Instant.now()));

        List<SubmissionDtos.FormFieldDto> fields = req.fields() != null ? req.fields() : Collections.emptyList();
        try {
            sub.setFormFields(objectMapper.writeValueAsString(fields));
            submissionRepository.save(sub);
        } catch (Exception ignored) {}
        return fields;
    }

    /**
     * Toggles a manual checklist item.
     */
    @Transactional
    public SubmissionDtos.ChecklistItemDto toggleChecklistItem(UUID roomId, String itemKey, User user, SubmissionDtos.ToggleChecklistRequest req) {
        roomAccess.requireMember(roomId, user);
        SubmissionChecklistItem item = checklistRepository.findByRoomIdAndItemKey(roomId, itemKey)
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Checklist item not found"));

        if (item.isAuto()) {
            throw new BadRequestException("AUTO_ITEM", "This checklist item is automatically updated by [brackit]");
        }

        boolean newState = req.done() != null ? req.done() : !item.isDone();
        item.setDone(newState);
        SubmissionChecklistItem saved = checklistRepository.save(item);
        return toChecklistDto(saved);
    }

    /**
     * Adds an external project link to verify.
     */
    @Transactional
    public SubmissionDtos.SubmissionLinkDto addLink(UUID roomId, User user, SubmissionDtos.CreateLinkRequest req) {
        roomAccess.requireMember(roomId, user);
        validateLinkUrl(req.url());

        SubmissionLink link = new SubmissionLink(
                roomId,
                req.label() != null ? req.label().trim() : "Link",
                req.url().trim(),
                null,
                null,
                null
        );
        SubmissionLink saved = linkRepository.save(link);
        return new SubmissionDtos.SubmissionLinkDto(saved.getId(), saved.getLabel(), saved.getUrl(), saved.getOk(), saved.getHttpStatus(), saved.getLastCheckedAt());
    }

    /**
     * Deletes an external project link.
     */
    @Transactional
    public void deleteLink(UUID roomId, UUID linkId, User user) {
        roomAccess.requireMember(roomId, user);
        SubmissionLink link = linkRepository.findById(linkId)
                .filter(l -> l.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("LINK_NOT_FOUND", "Link not found"));
        linkRepository.delete(link);
    }

    /**
     * Checks all submission links using SSRF-safe HTTP client.
     */
    @Transactional
    public List<SubmissionDtos.SubmissionLinkDto> checkLinks(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        List<SubmissionLink> links = linkRepository.findByRoomIdOrderByLabelAsc(roomId);

        for (SubmissionLink link : links) {
            SafeHttpClient.SafeHttpResponse result = safeHttpClient.headOrGet(link.getUrl(), 5000);
            link.setOk(result.ok());
            link.setHttpStatus(result.httpStatus());
            link.setLastCheckedAt(Instant.now());
        }
        List<SubmissionLink> saved = linkRepository.saveAll(links);

        return saved.stream().map(l ->
                new SubmissionDtos.SubmissionLinkDto(l.getId(), l.getLabel(), l.getUrl(), l.getOk(), l.getHttpStatus(), l.getLastCheckedAt())
        ).toList();
    }

    /**
     * Verifies the submission against all blockers and marks it VERIFIED.
     */
    @Transactional
    public SubmissionDtos.VerifyResultDto verify(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new NotFoundException("SUBMISSION_NOT_FOUND", "Submission not found"));

        SubmissionDtos.SubmissionResponse current = getSubmission(roomId, user);
        if (!current.canVerify()) {
            throw new BadRequestException("SUBMISSION_BLOCKED", "Submission has " + current.blockers().size() + " blockers preventing verification");
        }

        sub.setStatus("VERIFIED");
        sub.setVerifiedAt(Instant.now());
        submissionRepository.save(sub);
        roomEventService.recordEvent(roomId, "submission.changed", "submission", sub.getId().toString(), user.getId());

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room != null) {
            checkpointService.evaluate(room);
            notificationService.notifyRoomMembers(room, null, NotificationType.SUBMISSION_VERIFIED,
                    "Submission verified", "All submission requirements and links have been verified!");
        }

        return new SubmissionDtos.VerifyResultDto(true, Collections.emptyList());
    }

    /**
     * Marks submission as SUBMITTED; room leader only.
     * Idempotent; clears preconditions; updates clockStatus to SUBMITTED via room.submittedAt.
     */
    @Transactional
    public SubmissionDtos.SubmissionResponse markSubmitted(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));

        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Submission newSub = new Submission(roomId, "DRAFT", "{}", "[]", Instant.now());
                    return submissionRepository.save(newSub);
                });

        // Idempotent: submitting twice returns the same submittedAt
        if (room.getSubmittedAt() != null) {
            return getSubmission(roomId, user);
        }

        Instant now = Instant.now();
        room.setSubmittedAt(now);
        room.setWorkflowStage("REVIEW");
        roomRepository.save(room);

        sub.setStatus("SUBMITTED");
        sub.setSubmittedAt(now);
        sub.setSubmittedBy(user.getId());
        submissionRepository.save(sub);

        roomEventService.recordEvent(roomId, "SUBMITTED", "room", roomId.toString(), user.getId());
        roomEventService.recordEvent(roomId, "submission.changed", "submission", sub.getId().toString(), user.getId());
        if (activityLogger != null) {
            activityLogger.log(room, user, "SUBMITTED", "Project marked as submitted");
        }

        checkpointService.evaluate(room);

        // Notify every member in-app with a deepLink to the page, and send email under CHECKPOINTS category
        String roomName = room.getName() != null && !room.getName().isBlank() ? room.getName() : "Project";
        String subject = roomName + " is submitted";
        String deepLink = "/app/room/" + roomId + "/submission";
        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        for (RoomMember m : members) {
            try {
                notificationService.notifyUser(m.getUserId(), roomId, NotificationType.PROJECT_SUBMITTED,
                        subject, "Project marked as submitted.", deepLink);
            } catch (Exception ignored) {}
        }

        return getSubmission(roomId, user);
    }

    /**
     * Reopens submission back to DRAFT; room leader only.
     */
    @Transactional
    public SubmissionDtos.SubmissionResponse reopen(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("ROOM_NOT_FOUND", "Room not found"));

        Submission sub = submissionRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Submission newSub = new Submission(roomId, "DRAFT", "{}", "[]", Instant.now());
                    return submissionRepository.save(newSub);
                });

        room.setSubmittedAt(null);
        if ("REVIEW".equalsIgnoreCase(room.getWorkflowStage())) {
            room.setWorkflowStage("PRESENT");
        }
        roomRepository.save(room);

        sub.setStatus("DRAFT");
        sub.setVerifiedAt(null);
        sub.setSubmittedAt(null);
        sub.setSubmittedBy(null);
        submissionRepository.save(sub);

        roomEventService.recordEvent(roomId, "REOPENED", "room", roomId.toString(), user.getId());
        roomEventService.recordEvent(roomId, "submission.changed", "submission", sub.getId().toString(), user.getId());
        if (activityLogger != null) {
            activityLogger.log(room, user, "REOPENED", "Project submission reopened");
        }

        checkpointService.evaluate(room);

        return getSubmission(roomId, user);
    }

    private void updateAutoChecklistItems(UUID roomId, List<SubmissionChecklistItem> items) {
        Optional<DemoMedia> media = mediaRepository.findByRoomId(roomId);
        boolean hasVideo = media.map(m -> m.getVideoUrl() != null && !m.getVideoUrl().isBlank()).orElse(false);

        Optional<GithubRepo> repo = githubRepoRepository.findById(roomId);
        boolean hasPublicRepo = repo.map(r -> "public".equalsIgnoreCase(r.getVisibility())).orElse(false);
        if (!hasPublicRepo) {
            hasPublicRepo = linkRepository.findByRoomIdOrderByLabelAsc(roomId).stream()
                    .anyMatch(l -> l.getUrl().toLowerCase(Locale.ROOT).contains("github.com"));
        }

        for (SubmissionChecklistItem item : items) {
            if ("demo_video".equalsIgnoreCase(item.getItemKey())) {
                item.setDone(hasVideo);
            } else if ("repo_link".equalsIgnoreCase(item.getItemKey())) {
                item.setDone(hasPublicRepo);
            }
        }
        checklistRepository.saveAll(items);
    }

    private List<SubmissionChecklistItem> seedChecklist(UUID roomId) {
        List<SubmissionChecklistItem> list = new ArrayList<>();
        list.add(new SubmissionChecklistItem(roomId, "demo_video", "Demo video link added", true, false, true));
        list.add(new SubmissionChecklistItem(roomId, "repo_link", "Repository link added", true, false, true));
        list.add(new SubmissionChecklistItem(roomId, "teammates_added", "All teammates are registered on the event platform", true, false, false));
        list.add(new SubmissionChecklistItem(roomId, "track_selected", "Correct track selected", true, false, false));
        list.add(new SubmissionChecklistItem(roomId, "prizes_selected", "Prizes selected", true, false, false));
        list.add(new SubmissionChecklistItem(roomId, "forms_filled", "Submission form fields filled", true, false, false));
        return checklistRepository.saveAll(list);
    }

    private SubmissionDtos.ChecklistItemDto toChecklistDto(SubmissionChecklistItem i) {
        String group = i.isAuto() ? "required" : (i.getItemKey().contains("teammate") ? "team" : "required");
        String category = i.getItemKey();
        String route = switch (i.getItemKey()) {
            case "demo_video" -> "/demo";
            case "repo_link" -> "/github";
            case "teammates_added" -> "/team";
            default -> "/submission";
        };

        return new SubmissionDtos.ChecklistItemDto(
                i.getItemKey(),
                i.getItemKey(),
                i.getLabel(),
                i.isDone(),
                i.isRequired(),
                i.isAuto(),
                route,
                group,
                category
        );
    }

    private Map<String, String> parseDraftMap(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private SubmissionDtos.SubmissionDraftDto toDraftDto(Map<String, String> map) {
        String whatItDoes = map.getOrDefault("whatItDoes", "");
        String whyItMatters = map.getOrDefault("whyItMatters", "");
        String howBuilt = map.getOrDefault("howBuilt", "");
        String challenges = map.getOrDefault("challenges", "");
        String whatsNext = map.getOrDefault("whatsNext", "");
        return new SubmissionDtos.SubmissionDraftDto(whatItDoes, whyItMatters, howBuilt, howBuilt, challenges, whatsNext);
    }

    private List<SubmissionDtos.FormFieldDto> parseFormFields(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void appendSection(StringBuilder sb, List<String> missing, String title, String text) {
        if (text == null || text.isBlank()) {
            missing.add(title);
        } else {
            sb.append("### ").append(title).append("\n").append(text.trim()).append("\n\n");
        }
    }

    private void validateDraftLength(String field, String val) {
        if (val != null && val.length() > 3000) {
            throw new BadRequestException("TEXT_TOO_LONG", field + " exceeds 3,000 characters");
        }
    }

    private void validateLinkUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BadRequestException("INVALID_URL", "Link URL cannot be empty");
        }
        String lower = url.trim().toLowerCase(Locale.ROOT);
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw new BadRequestException("INVALID_URL", "Link URL must start with http:// or https://");
        }
    }

    private String getDocContent(UUID roomId, String fileName) {
        return docRepository.findByRoomIdAndFileName(roomId, fileName)
                .flatMap(d -> docVersionRepository.findByDocIdAndVersion(d.getId(), d.getCurrentVersion()))
                .map(DocVersion::getContent)
                .orElse("");
    }

    private String extractDocSection(String doc, String startHeading, String endHeading) {
        int s = doc.indexOf(startHeading);
        if (s < 0) return "";
        int e = doc.indexOf(endHeading, s + startHeading.length());
        String part = e > s ? doc.substring(s + startHeading.length(), e) : doc.substring(s + startHeading.length());
        return part.replaceAll("^[\\s:#-]+", "").trim();
    }
}
