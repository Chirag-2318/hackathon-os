package com.hackathonos.backend.ideas;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.ideas.dto.*;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.notifications.NotificationType;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing ideation lifecycle, team ideas, decisions, and markdown export.
 */
@Service
public class IdeasService {

    private final IdeaRepository ideaRepository;
    private final IdeaLinkRepository linkRepository;
    private final IdeaNoteRepository noteRepository;
    private final BriefRepository briefRepository;
    private final BriefRubricItemRepository rubricRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomAccess roomAccess;
    private final RoomStageService stageService;
    private final ActivityLogger activityLogger;
    private final NotificationService notificationService;
    private final IdeasMapper ideasMapper;
    private final com.hackathonos.backend.events.RoomEventService roomEventService;
    private final org.springframework.beans.factory.ObjectProvider<com.hackathonos.backend.plan.PlanPrepareService> planPrepareServiceProvider;

    public IdeasService(
            IdeaRepository ideaRepository,
            IdeaLinkRepository linkRepository,
            IdeaNoteRepository noteRepository,
            BriefRepository briefRepository,
            BriefRubricItemRepository rubricRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            RoomAccess roomAccess,
            RoomStageService stageService,
            ActivityLogger activityLogger,
            NotificationService notificationService,
            IdeasMapper ideasMapper,
            com.hackathonos.backend.events.RoomEventService roomEventService,
            org.springframework.beans.factory.ObjectProvider<com.hackathonos.backend.plan.PlanPrepareService> planPrepareServiceProvider) {
        this.ideaRepository = ideaRepository;
        this.linkRepository = linkRepository;
        this.noteRepository = noteRepository;
        this.briefRepository = briefRepository;
        this.rubricRepository = rubricRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.roomAccess = roomAccess;
        this.stageService = stageService;
        this.activityLogger = activityLogger;
        this.notificationService = notificationService;
        this.ideasMapper = ideasMapper;
        this.roomEventService = roomEventService;
        this.planPrepareServiceProvider = planPrepareServiceProvider;
    }

    /**
     * Retrieves the room ideation feed, counts, primary idea, and role-based permissions.
     */
    @Transactional(readOnly = true)
    public IdeateResponseDto getIdeateData(UUID roomId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());

        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        String problemStatement = briefOpt.map(Brief::getProblemStatement).orElse("");
        boolean briefConfirmed = briefOpt.map(Brief::isConfirmed).orElse(false);
        IdeateTopicDto topic = new IdeateTopicDto(problemStatement, briefConfirmed);

        List<Idea> ideas = ideaRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
        List<UUID> ideaIds = ideas.stream().map(Idea::getId).toList();

        Map<UUID, List<IdeaLink>> linksMap = linkRepository.findByIdeaIdIn(ideaIds).stream()
                .collect(Collectors.groupingBy(IdeaLink::getIdeaId));
        Map<UUID, List<IdeaNote>> notesMap = noteRepository.findByIdeaIdIn(ideaIds).stream()
                .collect(Collectors.groupingBy(IdeaNote::getIdeaId));

        Set<UUID> authorIds = ideas.stream().map(Idea::getAuthorId).collect(Collectors.toSet());
        Map<UUID, User> userMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<IdeaDto> ideaDtos = new ArrayList<>();
        long pendingCount = 0;
        long approvedCount = 0;
        long rejectedCount = 0;
        String primaryIdeaId = null;

        Map<UUID, Long> contributorCounts = new HashMap<>();

        for (Idea idea : ideas) {
            String status = idea.getStatus().toUpperCase();
            if ("PENDING".equals(status)) pendingCount++;
            else if ("APPROVED".equals(status)) approvedCount++;
            else if ("REJECTED".equals(status)) rejectedCount++;

            if (idea.isPrimary()) {
                primaryIdeaId = idea.getId().toString();
            }

            contributorCounts.put(idea.getAuthorId(), contributorCounts.getOrDefault(idea.getAuthorId(), 0L) + 1);

            User author = userMap.get(idea.getAuthorId());
            ideaDtos.add(ideasMapper.toDto(
                    idea,
                    linksMap.get(idea.getId()),
                    notesMap.get(idea.getId()),
                    author,
                    user.getId()
            ));
        }

        IdeaCountsDto counts = new IdeaCountsDto(ideas.size(), pendingCount, approvedCount, rejectedCount);

        List<ContributorDto> contributors = new ArrayList<>();
        for (Map.Entry<UUID, Long> entry : contributorCounts.entrySet()) {
            User u = userMap.get(entry.getKey());
            if (u != null) {
                String name = u.getName() != null ? u.getName() : (u.getEmail() != null ? u.getEmail() : "Member");
                com.hackathonos.backend.users.dto.UserSummaryDto summary = com.hackathonos.backend.users.dto.UserSummaryDto.from(u, name);
                contributors.add(new ContributorDto(u.getId().toString(), name, summary.avatarUrl(), entry.getValue()));
            }
        }

        boolean buildStarted = room.getBuildStartedAt() != null;
        boolean canPost = !room.isIdeateDone() && !buildStarted;
        boolean canDecide = isLeader && !room.isIdeateDone() && !buildStarted;
        boolean canFinish = isLeader && !room.isIdeateDone() && !buildStarted && approvedCount > 0;
        boolean canReopen = isLeader && room.isIdeateDone() && !buildStarted;

        IdeatePermissionsDto permissions = new IdeatePermissionsDto(canPost, canDecide, canFinish, canReopen);
        return new IdeateResponseDto(topic, ideaDtos, counts, room.isIdeateDone(), primaryIdeaId, contributors, permissions);
    }

    /**
     * Posts a new idea, enforcing length limits and notifying room leaders.
     */
    @Transactional
    public IdeaDto createIdea(UUID roomId, PostIdeaRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.isIdeateDone() || room.getBuildStartedAt() != null) {
            throw new ConflictException("IDEATION_LOCKED", "Ideation has ended or room is in build phase");
        }

        if (ideaRepository.countByRoomId(roomId) >= 200) {
            throw new com.hackathonos.backend.common.error.LimitReachedException(
                    com.hackathonos.backend.common.error.ErrorCode.LIMIT_REACHED,
                    "This room has reached the limit of 200 ideas."
            );
        }

        validateIdeaInput(req);

        boolean isAnonymous = Boolean.TRUE.equals(req.anonymous());
        UUID authorId = isAnonymous ? null : user.getId();

        Idea idea = ideaRepository.save(new Idea(roomId, authorId, req.text().trim()));

        List<IdeaLink> savedLinks = saveLinks(idea.getId(), req.links());
        List<IdeaNote> savedNotes = saveNotes(idea.getId(), req.notes());

        activityLogger.log(room, user, "IDEA_POSTED", isAnonymous ? "Posted an idea anonymously" : "Posted an idea");
        roomEventService.recordEvent(roomId, "idea.posted", "idea", idea.getId().toString(), authorId);

        // Notify leader if poster is not the leader
        Optional<RoomMember> leaderMember = memberRepository.findByRoomIdAndRole(roomId, "leader").stream().findFirst();
        if (leaderMember.isPresent() && !leaderMember.get().getUserId().equals(user.getId())) {
            userRepository.findById(leaderMember.get().getUserId()).ifPresent(leader -> {
                String snippet = idea.getText().length() > 50 ? idea.getText().substring(0, 50) + "..." : idea.getText();
                String msg = isAnonymous
                        ? "An anonymous teammate posted: \"" + snippet + "\""
                        : user.getName() + " posted: \"" + snippet + "\"";
                notificationService.notifyUser(leader, room, NotificationType.IDEA_POSTED,
                        "New idea posted", msg);
            });
        }

        return ideasMapper.toDto(idea, savedLinks, savedNotes, isAnonymous ? null : user, user.getId());
    }

    /**
     * Updates an existing pending idea, allowed only for the original author.
     */
    @Transactional
    public IdeaDto updateIdea(UUID roomId, UUID ideaId, PostIdeaRequest req, User user) {
        roomAccess.requireMember(roomId, user);
        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        if (!idea.getAuthorId().equals(user.getId())) {
            throw new ForbiddenException("FORBIDDEN", "Only the author may edit this idea");
        }
        if (!"PENDING".equalsIgnoreCase(idea.getStatus())) {
            throw new ForbiddenException("FORBIDDEN", "Only pending ideas can be modified");
        }

        validateIdeaInput(req);

        idea.setText(req.text().trim());
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        linkRepository.deleteByIdeaId(savedIdea.getId());
        noteRepository.deleteByIdeaId(savedIdea.getId());

        List<IdeaLink> savedLinks = saveLinks(savedIdea.getId(), req.links());
        List<IdeaNote> savedNotes = saveNotes(savedIdea.getId(), req.notes());

        return ideasMapper.toDto(savedIdea, savedLinks, savedNotes, user, user.getId());
    }

    /**
     * Deletes an idea, permitted for authors while pending or leaders before ideation ends.
     */
    @Transactional
    public void deleteIdea(UUID roomId, UUID ideaId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        boolean isLeader = "leader".equalsIgnoreCase(member.getRole());
        boolean isAuthor = idea.getAuthorId().equals(user.getId());

        if (!isAuthor && !isLeader) {
            throw new ForbiddenException("FORBIDDEN", "Only the author or leader may delete this idea");
        }
        if (!isLeader && !"PENDING".equalsIgnoreCase(idea.getStatus())) {
            throw new ForbiddenException("FORBIDDEN", "Authors can only delete pending ideas");
        }
        if (isLeader && room.isIdeateDone()) {
            throw new ConflictException("IDEATION_LOCKED", "Cannot delete idea once ideation is marked done");
        }

        linkRepository.deleteByIdeaId(ideaId);
        noteRepository.deleteByIdeaId(ideaId);
        ideaRepository.delete(idea);
    }

    /**
     * Approves an idea, setting decider metadata and notifying author.
     */
    @Transactional
    public IdeaDto approveIdea(UUID roomId, UUID ideaId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.isIdeateDone() || room.getBuildStartedAt() != null) {
            throw new ConflictException("IDEATION_LOCKED", "Ideation has ended");
        }

        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        idea.setStatus("APPROVED");
        idea.setDecidedBy(user.getId());
        idea.setDecidedAt(Instant.now());
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        userRepository.findById(savedIdea.getAuthorId()).ifPresent(author ->
                notificationService.notifyUser(author, room, NotificationType.IDEA_APPROVED,
                        "Idea approved", "Your idea was approved by " + user.getName()));

        activityLogger.log(room, user, "IDEA_APPROVED", "Approved an idea");
        roomEventService.recordEvent(roomId, "idea.approved", "idea", savedIdea.getId().toString(), user.getId());

        return loadFullIdeaDto(savedIdea, user.getId());
    }

    /**
     * Rejects an idea with an optional reason up to 200 characters.
     */
    @Transactional
    public IdeaDto rejectIdea(UUID roomId, UUID ideaId, RejectIdeaRequest req, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.isIdeateDone() || room.getBuildStartedAt() != null) {
            throw new ConflictException("IDEATION_LOCKED", "Ideation has ended");
        }

        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        if (req != null && req.reason() != null && req.reason().length() > 200) {
            throw new BadRequestException("INVALID_REASON", "Reject reason must be at most 200 characters");
        }

        idea.setStatus("REJECTED");
        idea.setRejectReason(req != null ? req.reason() : null);
        idea.setDecidedBy(user.getId());
        idea.setDecidedAt(Instant.now());
        if (idea.isPrimary()) {
            idea.setPrimary(false);
        }
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        userRepository.findById(savedIdea.getAuthorId()).ifPresent(author ->
                notificationService.notifyUser(author, room, NotificationType.IDEA_REJECTED,
                        "Idea rejected", "Your idea was marked as rejected"));

        activityLogger.log(room, user, "IDEA_REJECTED", "Rejected an idea");
        roomEventService.recordEvent(roomId, "idea.rejected", "idea", savedIdea.getId().toString(), user.getId());

        return loadFullIdeaDto(savedIdea, user.getId());
    }

    /**
     * Restores a decided idea back to pending status.
     */
    @Transactional
    public IdeaDto restoreIdea(UUID roomId, UUID ideaId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.isIdeateDone() || room.getBuildStartedAt() != null) {
            throw new ConflictException("IDEATION_LOCKED", "Ideation has ended");
        }

        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        idea.setStatus("PENDING");
        idea.setRejectReason(null);
        idea.setDecidedBy(null);
        idea.setDecidedAt(null);
        if (idea.isPrimary()) {
            idea.setPrimary(false);
        }
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        activityLogger.log(room, user, "IDEA_RESTORED", "Restored idea to pending");

        return loadFullIdeaDto(savedIdea, user.getId());
    }

    /**
     * Sets an approved idea as the room's single primary idea, clearing previous.
     */
    @Transactional
    public IdeaDto setPrimaryIdea(UUID roomId, UUID ideaId, User user) {
        roomAccess.requireLeader(roomId, user);
        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        if (!"APPROVED".equalsIgnoreCase(idea.getStatus())) {
            throw new BadRequestException("NOT_APPROVED", "Only approved ideas can be set as primary");
        }

        ideaRepository.clearPrimaryForRoom(roomId);
        idea.setPrimary(true);
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        return loadFullIdeaDto(savedIdea, user.getId());
    }

    /**
     * Clears the primary status from an idea.
     */
    @Transactional
    public IdeaDto clearPrimaryIdea(UUID roomId, UUID ideaId, User user) {
        roomAccess.requireLeader(roomId, user);
        Idea idea = ideaRepository.findByIdAndRoomId(ideaId, roomId)
                .orElseThrow(() -> new NotFoundException("IDEA_NOT_FOUND", "Idea not found"));

        idea.setPrimary(false);
        idea.setUpdatedAt(Instant.now());
        Idea savedIdea = ideaRepository.save(idea);

        return loadFullIdeaDto(savedIdea, user.getId());
    }

    /**
     * Finalizes ideation stage if at least one idea is approved, advancing room stage.
     */
    @Transactional
    public void markIdeationDone(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        long approved = ideaRepository.countByRoomIdAndStatus(roomId, "APPROVED");
        if (approved == 0) {
            throw new BadRequestException("NEED_APPROVED_IDEA", "At least one idea must be approved before completing ideation");
        }

        room.setIdeateDone(true);
        stageService.recompute(room);
        roomRepository.save(room);

        activityLogger.log(room, user, "IDEATION_DONE", "Completed ideation");
        notificationService.notifyRoomMembers(room, null, NotificationType.IDEATION_DONE,
                "Ideation complete", "Ideation phase completed! Team is moving to Plan.");

        // Asynchronously start prepare for step 1 inside transition (fire and forget, never fail transition)
        try {
            planPrepareServiceProvider.ifAvailable(svc -> svc.triggerPrepareAsync(roomId, 1));
        } catch (Exception e) {
            // Fire and forget, never fail the transition
        }
    }

    /**
     * Reopens ideation stage prior to build start, resetting subsequent plan progress.
     */
    @Transactional
    public void reopenIdeation(UUID roomId, User user) {
        roomAccess.requireLeader(roomId, user);
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        if (room.getBuildStartedAt() != null) {
            throw new ConflictException("IDEATION_LOCKED", "Cannot reopen ideation once build phase has started");
        }

        room.setIdeateDone(false);
        room.setPlanDone(false);
        stageService.recompute(room);
        roomRepository.save(room);

        activityLogger.log(room, user, "IDEATION_REOPENED", "Reopened ideation stage");
    }

    /**
     * Exports full room ideation summary into structured Markdown format.
     */
    @Transactional(readOnly = true)
    public String exportIdeasMarkdown(UUID roomId, User user) {
        if (user != null) {
            roomAccess.requireMember(roomId, user);
        }
        Room room = roomAccess.getActiveRoomOrThrow(roomId);

        Optional<Brief> briefOpt = briefRepository.findByRoomId(roomId);
        String problemStatement = briefOpt.map(Brief::getProblemStatement).filter(s -> !s.isBlank()).orElse("Not added");

        List<BriefRubricItem> rubricItems = briefOpt.map(b -> rubricRepository.findByBriefIdOrderByPositionAsc(b.getId()))
                .orElse(Collections.emptyList());

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<UUID, User> memberUsers = userRepository.findAllById(members.stream().map(RoomMember::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));

        List<Idea> ideas = ideaRepository.findByRoomIdOrderByCreatedAtDesc(roomId);
        Map<UUID, User> authors = userRepository.findAllById(ideas.stream().map(Idea::getAuthorId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<UUID, List<IdeaLink>> links = linkRepository.findByIdeaIdIn(ideas.stream().map(Idea::getId).toList())
                .stream().collect(Collectors.groupingBy(IdeaLink::getIdeaId));
        Map<UUID, List<IdeaNote>> notes = noteRepository.findByIdeaIdIn(ideas.stream().map(Idea::getId).toList())
                .stream().collect(Collectors.groupingBy(IdeaNote::getIdeaId));

        StringBuilder sb = new StringBuilder();
        sb.append("# Ideas: ").append(room.getName()).append("\n");
        sb.append("Generated: ").append(DateTimeFormatter.ISO_INSTANT.format(Instant.now())).append("\n\n");

        sb.append("## Hackathon problem\n").append(problemStatement).append("\n\n");

        sb.append("## Rubric\n");
        if (rubricItems.isEmpty()) {
            sb.append("Not added\n\n");
        } else {
            for (BriefRubricItem r : rubricItems) {
                sb.append("- ").append(r.getCriterion()).append(": ").append(r.getWeight()).append("%\n");
            }
            sb.append("\n");
        }

        sb.append("## Team skills\n");
        for (RoomMember m : members) {
            User u = memberUsers.get(m.getUserId());
            String name = u != null ? (u.getName() != null ? u.getName() : (u.getEmail() != null ? u.getEmail() : "Member")) : "Member";
            String role = m.getRole();
            List<RoomMemberSkill> mSkills = skillRepository.findByMemberId(m.getId());
            String skills = mSkills.stream().map(RoomMemberSkill::getSkill).collect(Collectors.joining(", "));
            sb.append("- ").append(name).append(": ").append(role).append(skills.isBlank() ? "" : ", " + skills).append("\n");
        }
        sb.append("\n");

        Optional<Idea> primaryIdea = ideas.stream().filter(Idea::isPrimary).findFirst();
        sb.append("## Primary idea\n");
        if (primaryIdea.isPresent()) {
            Idea pi = primaryIdea.get();
            String authorName = authors.get(pi.getAuthorId()) != null ? authors.get(pi.getAuthorId()).getName() : "Unknown";
            sb.append(extractFirstSentence(pi.getText())).append(", by ").append(authorName).append("\n\n");
        } else {
            sb.append("None selected\n\n");
        }

        List<Idea> approvedIdeas = ideas.stream().filter(i -> "APPROVED".equalsIgnoreCase(i.getStatus())).toList();
        sb.append("## Approved ideas\n");
        if (approvedIdeas.isEmpty()) {
            sb.append("None approved yet\n\n");
        } else {
            int idx = 1;
            for (Idea ai : approvedIdeas) {
                String firstSentence = extractFirstSentence(ai.getText());
                if (firstSentence.length() > 100) firstSentence = firstSentence.substring(0, 97) + "...";
                sb.append("### ").append(idx++).append(". ").append(firstSentence).append("\n");
                sb.append(ai.getText()).append("\n\n");

                List<IdeaLink> ideaLinks = links.get(ai.getId());
                if (ideaLinks != null && !ideaLinks.isEmpty()) {
                    sb.append("Links:\n");
                    for (IdeaLink l : ideaLinks) {
                        sb.append("- ").append(l.getUrl()).append(l.getTitle() != null ? " (" + l.getTitle() + ")" : "").append("\n");
                    }
                    sb.append("\n");
                }

                List<IdeaNote> ideaNotes = notes.get(ai.getId());
                if (ideaNotes != null && !ideaNotes.isEmpty()) {
                    sb.append("Notes:\n");
                    for (IdeaNote n : ideaNotes) {
                        sb.append("- ").append(n.getText()).append("\n");
                    }
                    sb.append("\n");
                }

                String authorName = authors.get(ai.getAuthorId()) != null ? authors.get(ai.getAuthorId()).getName() : "Unknown";
                sb.append("By ").append(authorName).append("\n\n");
            }
        }

        List<Idea> rejectedIdeas = ideas.stream().filter(i -> "REJECTED".equalsIgnoreCase(i.getStatus())).toList();
        sb.append("## Rejected ideas\n");
        if (rejectedIdeas.isEmpty()) {
            sb.append("None\n");
        } else {
            for (Idea ri : rejectedIdeas) {
                String firstSentence = extractFirstSentence(ri.getText());
                String reason = ri.getRejectReason() != null ? ri.getRejectReason() : "No reason provided";
                sb.append("- ").append(firstSentence).append(": ").append(reason).append("\n");
            }
        }

        return sb.toString();
    }

    private IdeaDto loadFullIdeaDto(Idea idea, UUID currentUserId) {
        List<IdeaLink> links = linkRepository.findByIdeaId(idea.getId());
        List<IdeaNote> notes = noteRepository.findByIdeaId(idea.getId());
        User author = userRepository.findById(idea.getAuthorId()).orElse(null);
        return ideasMapper.toDto(idea, links, notes, author, currentUserId);
    }

    private void validateIdeaInput(PostIdeaRequest req) {
        if (req == null || req.text() == null || req.text().trim().length() < 10 || req.text().trim().length() > 4000) {
            throw new BadRequestException("INVALID_TEXT", "Idea text must be between 10 and 4000 characters");
        }
        if (req.links() != null) {
            if (req.links().size() > 10) {
                throw new BadRequestException("TOO_MANY_LINKS", "At most 10 links allowed per idea");
            }
            for (IdeaLinkDto l : req.links()) {
                if (l.url() == null || (!l.url().startsWith("http://") && !l.url().startsWith("https://"))) {
                    throw new BadRequestException("INVALID_URL", "Idea link URL must start with http:// or https://");
                }
            }
        }
        if (req.notes() != null) {
            if (req.notes().size() > 10) {
                throw new BadRequestException("TOO_MANY_NOTES", "At most 10 notes allowed per idea");
            }
            for (String note : req.notes()) {
                if (note != null && note.length() > 300) {
                    throw new BadRequestException("NOTE_TOO_LONG", "Note text must not exceed 300 characters");
                }
            }
        }
    }

    private List<IdeaLink> saveLinks(UUID ideaId, List<IdeaLinkDto> links) {
        if (links == null || links.isEmpty()) return Collections.emptyList();
        List<IdeaLink> saved = new ArrayList<>();
        for (IdeaLinkDto l : links) {
            saved.add(linkRepository.save(new IdeaLink(ideaId, l.url(), l.title())));
        }
        return saved;
    }

    private List<IdeaNote> saveNotes(UUID ideaId, List<String> notes) {
        if (notes == null || notes.isEmpty()) return Collections.emptyList();
        List<IdeaNote> saved = new ArrayList<>();
        for (String n : notes) {
            if (n != null && !n.isBlank()) {
                saved.add(noteRepository.save(new IdeaNote(ideaId, n.trim())));
            }
        }
        return saved;
    }

    private String extractFirstSentence(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        int dot = trimmed.indexOf('.');
        int newline = trimmed.indexOf('\n');
        int split = -1;
        if (dot >= 0 && newline >= 0) split = Math.min(dot, newline);
        else if (dot >= 0) split = dot;
        else if (newline >= 0) split = newline;

        if (split >= 0) {
            return trimmed.substring(0, split).trim();
        }
        return trimmed;
    }
}
