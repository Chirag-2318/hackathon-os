package com.hackathonos.backend.mvp;

import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.mvp.dto.MvpDtos.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
public class MvpService {

    private final MvpStateRepository mvpStateRepository;
    private final MvpFlowStepRepository flowStepRepository;
    private final MvpLedgerRowRepository ledgerRowRepository;
    private final MvpCutItemRepository cutItemRepository;
    private final MvpSeedService seedService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final ActivityLogger activityLogger;
    private final CheckpointService checkpointService;
    private final Clock clock;

    public MvpService(
            MvpStateRepository mvpStateRepository,
            MvpFlowStepRepository flowStepRepository,
            MvpLedgerRowRepository ledgerRowRepository,
            MvpCutItemRepository cutItemRepository,
            MvpSeedService seedService,
            TaskRepository taskRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            ActivityLogger activityLogger,
            CheckpointService checkpointService,
            Clock clock
    ) {
        this.mvpStateRepository = mvpStateRepository;
        this.flowStepRepository = flowStepRepository;
        this.ledgerRowRepository = ledgerRowRepository;
        this.cutItemRepository = cutItemRepository;
        this.seedService = seedService;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.activityLogger = activityLogger;
        this.checkpointService = checkpointService;
        this.clock = clock;
    }

    /**
     * Retrieves or auto-seeds the MVP Studio state including core flow, reality ledger, and judge prep.
     */
    @Transactional
    public MvpStateResponseDto getMvp(UUID roomId, User user) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        seedService.seedFromPlan(room);
        MvpState state = mvpStateRepository.findById(roomId)
                .orElse(new MvpState(roomId, "", ""));

        return buildResponse(roomId, state);
    }

    /**
     * Updates one-sentence product identity and wow moment description.
     */
    @Transactional
    public MvpStateResponseDto updatePitch(UUID roomId, User user, UpdatePitchRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        MvpState state = getOrCreateState(roomId);

        String identity = request.identity() != null ? request.identity().trim() : "";
        if (identity.length() > 140) identity = identity.substring(0, 140);
        String wow = request.wow() != null ? request.wow().trim() : "";
        if (wow.length() > 400) wow = wow.substring(0, 400);

        state.setIdentity(identity);
        state.setWow(wow);
        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        activityLogger.log(room, user, "MVP_UPDATED", "updated the MVP pitch");
        return buildResponse(roomId, state);
    }

    /**
     * Updates core flow steps and linked tasks with size constraints between 3 and 5 items.
     */
    @Transactional
    public MvpStateResponseDto updateCoreFlow(UUID roomId, User user, UpdateCoreFlowRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<CoreFlowStepInput> steps = request.steps() != null ? request.steps() : Collections.emptyList();
        if (steps.size() < 3 || steps.size() > 5) {
            throw new BadRequestException("INVALID_STEP_COUNT", "Core flow must contain between 3 and 5 steps");
        }

        validateTaskBelongsToRoom(roomId, steps);

        flowStepRepository.deleteByRoomId(roomId);
        int pos = 0;
        for (CoreFlowStepInput input : steps) {
            String title = input.title() != null ? input.title().trim() : "Step";
            if (title.length() > 120) title = title.substring(0, 120);
            String status = normalizeFlowStatus(input.status());
            flowStepRepository.save(new MvpFlowStep(roomId, pos++, title, status, input.taskId()));
        }

        MvpState state = getOrCreateState(roomId);
        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        activityLogger.log(room, user, "MVP_UPDATED", "updated the MVP core flow");
        return buildResponse(roomId, state);
    }

    /**
     * Updates reality ledger components and builds tracking status up to 40 items.
     */
    @Transactional
    public MvpStateResponseDto updateLedger(UUID roomId, User user, UpdateLedgerRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<LedgerRowInput> rows = request.rows() != null ? request.rows() : Collections.emptyList();
        if (rows.size() > 40) {
            throw new BadRequestException("TOO_MANY_ROWS", "Reality ledger cannot exceed 40 rows");
        }

        ledgerRowRepository.deleteByRoomId(roomId);
        int pos = 0;
        for (LedgerRowInput r : rows) {
            String part = r.part() != null ? r.part().trim() : "Component";
            String status = normalizeLedgerStatus(r.status());
            ledgerRowRepository.save(new MvpLedgerRow(roomId, pos++, part, status, r.ownerId(), r.taskId(), r.notes()));
        }

        MvpState state = getOrCreateState(roomId);
        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        activityLogger.log(room, user, "MVP_UPDATED", "updated the MVP reality ledger");
        return buildResponse(roomId, state);
    }

    /**
     * Updates MVP health checks and triggers auto-evaluation of related checkpoints.
     */
    @Transactional
    public MvpStateResponseDto updateHealth(UUID roomId, User user, UpdateHealthRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        MvpState state = getOrCreateState(roomId);

        if (request.runs() != null) state.setHealthRuns(request.runs());
        if (request.stable() != null) state.setHealthStable(request.stable());
        if (request.clear30() != null) state.setHealthClear30(request.clear30());
        if (request.wow60() != null) state.setHealthWow60(request.wow60());

        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        checkpointService.evaluate(room);
        activityLogger.log(room, user, "MVP_UPDATED", "updated MVP health checks");
        return buildResponse(roomId, state);
    }

    /**
     * Updates competitive differentiation and anticipated failure point analysis for judging prep.
     */
    @Transactional
    public MvpStateResponseDto updateJudgePrep(UUID roomId, User user, UpdateJudgePrepRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);
        MvpState state = getOrCreateState(roomId);

        String diff = request.differentiation() != null ? request.differentiation().trim() : "";
        if (diff.length() > 240) diff = diff.substring(0, 240);
        String breaks = request.breaksFirst() != null ? request.breaksFirst().trim() : "";
        if (breaks.length() > 240) breaks = breaks.substring(0, 240);

        state.setDifferentiation(diff);
        state.setBreaksFirst(breaks);
        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        activityLogger.log(room, user, "MVP_UPDATED", "updated the MVP judge prep");
        return buildResponse(roomId, state);
    }

    /**
     * Updates feature cut list up to 20 items.
     */
    @Transactional
    public MvpStateResponseDto updateCutList(UUID roomId, User user, UpdateCutListRequest request) {
        Room room = roomAccess.getActiveRoomOrThrow(roomId);
        roomAccess.requireMember(roomId, user);

        List<CutItemInput> items = request.items() != null ? request.items() : Collections.emptyList();
        if (items.size() > 20) {
            throw new BadRequestException("TOO_MANY_ITEMS", "Cut list cannot exceed 20 items");
        }

        cutItemRepository.deleteByRoomId(roomId);
        int pos = 0;
        for (CutItemInput it : items) {
            String text = it.text() != null ? it.text().trim() : "";
            boolean cut = it.cut() != null ? it.cut() : true;
            cutItemRepository.save(new MvpCutItem(roomId, pos++, text, cut));
        }

        MvpState state = getOrCreateState(roomId);
        state.setUpdatedAt(clock.instant());
        mvpStateRepository.save(state);

        activityLogger.log(room, user, "MVP_UPDATED", "updated the MVP cut list");
        return buildResponse(roomId, state);
    }

    /**
     * Updates full MVP state across all sections in a single transaction.
     */
    @Transactional
    public MvpStateResponseDto updateFullMvp(UUID roomId, User user, UpdateFullMvpRequest req) {
        if (req == null) return getMvp(roomId, user);
        if (req.identity() != null || req.wow() != null) {
            updatePitch(roomId, user, new UpdatePitchRequest(req.identity(), req.wow()));
        }
        if (req.coreFlow() != null && !req.coreFlow().isEmpty()) {
            updateCoreFlow(roomId, user, new UpdateCoreFlowRequest(req.coreFlow()));
        }
        if (req.ledger() != null) {
            updateLedger(roomId, user, new UpdateLedgerRequest(req.ledger()));
        }
        if (req.health() != null) {
            updateHealth(roomId, user, req.health());
        }
        if (req.differentiation() != null || req.breaksFirst() != null) {
            updateJudgePrep(roomId, user, new UpdateJudgePrepRequest(req.differentiation(), req.breaksFirst()));
        }
        if (req.cutList() != null) {
            updateCutList(roomId, user, new UpdateCutListRequest(req.cutList()));
        }
        return getMvp(roomId, user);
    }

    private MvpState getOrCreateState(UUID roomId) {
        return mvpStateRepository.findById(roomId)
                .orElseGet(() -> mvpStateRepository.save(new MvpState(roomId, "", "")));
    }

    private void validateTaskBelongsToRoom(UUID roomId, List<CoreFlowStepInput> steps) {
        for (CoreFlowStepInput s : steps) {
            if (s.taskId() != null) {
                Task t = taskRepository.findById(s.taskId())
                        .orElseThrow(() -> new BadRequestException("TASK_NOT_FOUND", "Task not found: " + s.taskId()));
                if (!t.getRoomId().equals(roomId)) {
                    throw new BadRequestException("CROSS_ROOM_TASK", "Task does not belong to this room");
                }
            }
        }
    }

    private String normalizeFlowStatus(String status) {
        if (status == null) return "NOT_YET";
        String s = status.trim().toUpperCase();
        if ("WORKING".equals(s)) return "WORKING";
        if ("MOCKED".equals(s)) return "MOCKED";
        return "NOT_YET";
    }

    private String normalizeLedgerStatus(String status) {
        if (status == null) return "PLANNED";
        String s = status.trim().toUpperCase();
        if ("BUILT".equals(s)) return "BUILT";
        if ("EXISTING".equals(s)) return "EXISTING";
        if ("MOCKED".equals(s)) return "MOCKED";
        return "PLANNED";
    }

    private MvpStateResponseDto buildResponse(UUID roomId, MvpState state) {
        List<MvpFlowStep> steps = flowStepRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<MvpLedgerRow> rows = ledgerRowRepository.findByRoomIdOrderByPositionAsc(roomId);
        List<MvpCutItem> cuts = cutItemRepository.findByRoomIdOrderByPositionAsc(roomId);

        Set<UUID> taskIds = new HashSet<>();
        Set<UUID> userIds = new HashSet<>();
        for (MvpFlowStep s : steps) if (s.getTaskId() != null) taskIds.add(s.getTaskId());
        for (MvpLedgerRow r : rows) {
            if (r.getTaskId() != null) taskIds.add(r.getTaskId());
            if (r.getOwnerId() != null) userIds.add(r.getOwnerId());
        }

        Map<UUID, Task> taskMap = new HashMap<>();
        for (Task t : taskRepository.findAllById(taskIds)) taskMap.put(t.getId(), t);

        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);

        List<CoreFlowStepDto> stepDtos = new ArrayList<>();
        for (MvpFlowStep s : steps) {
            MvpTaskRefDto taskRef = null;
            if (s.getTaskId() != null && taskMap.containsKey(s.getTaskId())) {
                taskRef = new MvpTaskRefDto(s.getTaskId(), taskMap.get(s.getTaskId()).getTaskKey());
            }
            stepDtos.add(new CoreFlowStepDto(
                    s.getId(),
                    s.getTitle(),
                    s.getStatus().toLowerCase().replace("_", ""),
                    taskRef
            ));
        }

        List<LedgerRowDto> rowDtos = new ArrayList<>();
        for (MvpLedgerRow r : rows) {
            MvpTaskRefDto taskRef = null;
            if (r.getTaskId() != null && taskMap.containsKey(r.getTaskId())) {
                taskRef = new MvpTaskRefDto(r.getTaskId(), taskMap.get(r.getTaskId()).getTaskKey());
            }
            MvpOwnerDto ownerDto = null;
            if (r.getOwnerId() != null && userMap.containsKey(r.getOwnerId())) {
                User u = userMap.get(r.getOwnerId());
                ownerDto = new MvpOwnerDto(u.getId(), u.getName(), u.getAvatarUrl());
            }
            rowDtos.add(new LedgerRowDto(
                    r.getId(),
                    r.getPart(),
                    r.getStatus().toLowerCase(),
                    ownerDto,
                    taskRef,
                    r.getNotes()
            ));
        }

        List<CutItemDto> cutDtos = new ArrayList<>();
        for (MvpCutItem c : cuts) {
            cutDtos.add(new CutItemDto(c.getId(), c.getText(), c.isCut()));
        }

        int passed = (state.isHealthRuns() ? 1 : 0) + (state.isHealthStable() ? 1 : 0)
                + (state.isHealthClear30() ? 1 : 0) + (state.isHealthWow60() ? 1 : 0);
        MvpHealthDto health = new MvpHealthDto(
                state.isHealthRuns(), state.isHealthStable(), state.isHealthClear30(), state.isHealthWow60(),
                passed, 4
        );

        return new MvpStateResponseDto(
                state.getIdentity() != null ? state.getIdentity() : "",
                state.getWow() != null ? state.getWow() : "",
                stepDtos,
                rowDtos,
                health,
                state.getDifferentiation() != null ? state.getDifferentiation() : "",
                state.getBreaksFirst() != null ? state.getBreaksFirst() : "",
                cutDtos,
                state.getUpdatedAt()
        );
    }
}
