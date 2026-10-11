package com.hackathonos.backend.prep;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.members.RoomMember;
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
 * Service managing pre-hackathon logistics, laptop setup verification, and pre-work rules.
 */
@Service
public class PrepService {

    private final PrepItemRepository prepItemRepository;
    private final RoomRepository roomRepository;
    private final BriefRepository briefRepository;
    private final GithubRepoRepository githubRepoRepository;
    private final RoomAccess roomAccess;

    public PrepService(
            PrepItemRepository prepItemRepository,
            RoomRepository roomRepository,
            BriefRepository briefRepository,
            GithubRepoRepository githubRepoRepository,
            RoomAccess roomAccess
    ) {
        this.prepItemRepository = prepItemRepository;
        this.roomRepository = roomRepository;
        this.briefRepository = briefRepository;
        this.githubRepoRepository = githubRepoRepository;
        this.roomAccess = roomAccess;
    }

    /**
     * Gets prep status, countdown, pre-work allowance, and checklist items.
     */
    @Transactional
    public PrepDtos.PrepResponse getPrep(UUID roomId, User user) {
        roomAccess.requireMember(roomId, user);
        Room room = roomRepository.findById(roomId).orElseThrow();

        Instant now = Instant.now();
        Instant startsAt = room.getEventStart() != null ? room.getEventStart() : now.plus(Duration.ofHours(6));
        long hoursToStart = Math.max(0, Duration.between(now, startsAt).toHours());
        PrepDtos.CountdownDto countdown = new PrepDtos.CountdownDto(startsAt, hoursToStart);

        Brief brief = briefRepository.findByRoomId(roomId).orElse(null);
        PrepDtos.PreWorkDto preWork = evaluatePreWork(brief != null ? brief.getDeliverables() : "");

        List<PrepItem> items = prepItemRepository.findByRoomIdOrderByPositionAsc(roomId);
        if (items.isEmpty()) {
            items = seedDefaultPrepItems(roomId);
        }

        int doneCount = (int) items.stream().filter(PrepItem::isDone).count();
        PrepDtos.PrepProgressDto progress = new PrepDtos.PrepProgressDto(doneCount, items.size());

        boolean githubConnected = githubRepoRepository.findById(roomId).isPresent();

        List<PrepDtos.PrepChecklistItemDto> dtos = items.stream().map(i ->
                new PrepDtos.PrepChecklistItemDto(i.getId(), i.getLabel(), i.isDone(), i.getDueAt(), i.getDoneBy())
        ).toList();

        return new PrepDtos.PrepResponse(
                countdown,
                preWork,
                dtos,
                progress,
                githubConnected,
                Boolean.TRUE.equals(preWork.allowed()),
                now
        );
    }

    /**
     * Adds a new prep item; room leader only.
     */
    @Transactional
    public PrepDtos.PrepChecklistItemDto createItem(UUID roomId, User user, PrepDtos.CreatePrepItemRequest req) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        if (!"leader".equalsIgnoreCase(member.getRole())) {
            throw new ForbiddenException("LEADER_ONLY", "Only the room leader can add prep items");
        }
        if (req.label() == null || req.label().isBlank()) {
            throw new BadRequestException("INVALID_LABEL", "Label cannot be empty");
        }

        List<PrepItem> existing = prepItemRepository.findByRoomIdOrderByPositionAsc(roomId);
        PrepItem item = new PrepItem(
                roomId,
                existing.size(),
                req.label().trim(),
                false,
                req.dueAt(),
                null
        );
        PrepItem saved = prepItemRepository.save(item);
        return new PrepDtos.PrepChecklistItemDto(saved.getId(), saved.getLabel(), saved.isDone(), saved.getDueAt(), saved.getDoneBy());
    }

    /**
     * Toggles done status of a prep item; any room member.
     */
    @Transactional
    public PrepDtos.PrepChecklistItemDto toggleItem(UUID roomId, UUID itemId, User user, PrepDtos.TogglePrepItemRequest req) {
        roomAccess.requireMember(roomId, user);
        PrepItem item = prepItemRepository.findById(itemId)
                .filter(i -> i.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Prep item not found"));

        boolean newState = req.done() != null ? req.done() : !item.isDone();
        item.setDone(newState);
        item.setDoneBy(newState ? user.getId() : null);
        PrepItem saved = prepItemRepository.save(item);

        return new PrepDtos.PrepChecklistItemDto(saved.getId(), saved.getLabel(), saved.isDone(), saved.getDueAt(), saved.getDoneBy());
    }

    /**
     * Deletes a prep item; room leader only.
     */
    @Transactional
    public void deleteItem(UUID roomId, UUID itemId, User user) {
        RoomMember member = roomAccess.requireMember(roomId, user);
        if (!"leader".equalsIgnoreCase(member.getRole())) {
            throw new ForbiddenException("LEADER_ONLY", "Only the room leader can delete prep items");
        }

        PrepItem item = prepItemRepository.findById(itemId)
                .filter(i -> i.getRoomId().equals(roomId))
                .orElseThrow(() -> new NotFoundException("ITEM_NOT_FOUND", "Prep item not found"));
        prepItemRepository.delete(item);
    }

    private List<PrepItem> seedDefaultPrepItems(UUID roomId) {
        List<PrepItem> list = List.of(
                new PrepItem(roomId, 0, "Everyone has repo access", false, null, null),
                new PrepItem(roomId, 1, "Event platform logins work", false, null, null),
                new PrepItem(roomId, 2, "Dev setup works on every laptop", false, null, null),
                new PrepItem(roomId, 3, "Stack sandbox tested", false, null, null),
                new PrepItem(roomId, 4, "Logistics (who attends and who presents)", false, null, null),
                new PrepItem(roomId, 5, "Read the brief together", false, null, null)
        );
        return prepItemRepository.saveAll(list);
    }

    private PrepDtos.PreWorkDto evaluatePreWork(String deliverables) {
        if (deliverables == null || deliverables.isBlank()) {
            return new PrepDtos.PreWorkDto(null, "Check event platform guidelines for pre-existing code rules.");
        }
        String text = deliverables.toLowerCase(Locale.ROOT);
        if (text.contains("pre-built") || text.contains("boilerplate") || text.contains("prior work")) {
            if (text.contains("not allowed") || text.contains("prohibited") || text.contains("from scratch")) {
                return new PrepDtos.PreWorkDto(false, "Pre-existing code is prohibited by event rules. Build from scratch.");
            }
            return new PrepDtos.PreWorkDto(true, "Boilerplates and public libraries are permitted.");
        }
        return new PrepDtos.PreWorkDto(null, "Check event platform guidelines for pre-existing code rules.");
    }
}
