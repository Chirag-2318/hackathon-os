package com.hackathonos.backend.team;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.MemberStatusCalculator;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskDtoMapper;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.team.dto.TeamDtos.*;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
public class TeamService {

    private static final List<String> ALL_SKILLS = List.of(
            "Frontend", "Backend", "ML/AI", "Design", "Presenter", "Domain", "QA/Demo"
    );

    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;
    private final TeamCharterResponseRepository charterRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final RoomAccess roomAccess;
    private final MemberStatusCalculator statusCalculator;
    private final TaskDtoMapper taskDtoMapper;
    private final Clock clock;

    public TeamService(
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository,
            TeamCharterResponseRepository charterRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            RoomAccess roomAccess,
            MemberStatusCalculator statusCalculator,
            TaskDtoMapper taskDtoMapper,
            Clock clock
    ) {
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
        this.charterRepository = charterRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.roomAccess = roomAccess;
        this.statusCalculator = statusCalculator;
        this.taskDtoMapper = taskDtoMapper;
        this.clock = clock;
    }

    /**
     * Computes the complete team roster with online statuses, skill gap coverage, and sprint charter alignment.
     */
    @Transactional(readOnly = true)
    public TeamResponseDto getTeam(UUID roomId, User viewer) {
        roomAccess.requireMember(roomId, viewer);

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        List<UUID> memberIds = new ArrayList<>();
        Set<UUID> userIds = new HashSet<>();
        for (RoomMember m : members) {
            memberIds.add(m.getId());
            if (m.getUserId() != null) {
                userIds.add(m.getUserId());
            }
        }

        Map<UUID, User> userMap = loadUserMap(userIds);
        Map<UUID, List<String>> skillsMap = loadSkillsMap(memberIds);
        Map<UUID, List<Task>> tasksByUser = loadTasksByUser(roomId);

        List<TeamMemberDto> memberDtos = new ArrayList<>();
        Map<String, List<SkillMemberDto>> skillMembersMap = initSkillMap();
        Map<String, Integer> roleCounts = new LinkedHashMap<>();

        for (RoomMember m : members) {
            if (m.getUserId() == null) {
                continue;
            }
            User u = userMap.get(m.getUserId());
            List<String> skills = skillsMap.getOrDefault(m.getId(), Collections.emptyList());
            List<Task> userTasks = tasksByUser.getOrDefault(m.getUserId(), Collections.emptyList());

            MemberStatusCalculator.MemberStatusResult statusResult =
                    statusCalculator.calculate(m.getUserId(), m.getLastSeenAt(), userTasks);

            long doneCount = 0, openCount = 0;
            for (Task t : userTasks) {
                if ("DONE".equalsIgnoreCase(t.getStatus())) doneCount++;
                else openCount++;
            }

            boolean isLeader = "LEADER".equalsIgnoreCase(m.getRole());
            boolean isMe = viewer != null && viewer.getId() != null && viewer.getId().equals(m.getUserId());
            String name = u != null && u.getName() != null ? u.getName() : "Teammate";
            String avatarUrl = u != null ? u.getAvatarUrl() : null;

            memberDtos.add(new TeamMemberDto(
                    m.getUserId(),
                    name,
                    taskDtoMapper.computeInitials(name),
                    avatarUrl,
                    m.getRole(),
                    skills,
                    statusResult.status(),
                    statusResult.currentTask(),
                    doneCount,
                    openCount,
                    isLeader,
                    isMe
            ));

            roleCounts.put(m.getRole(), roleCounts.getOrDefault(m.getRole(), 0) + 1);

            SkillMemberDto smDto = new SkillMemberDto(m.getUserId(), name, avatarUrl);
            for (String s : skills) {
                if (skillMembersMap.containsKey(s)) {
                    skillMembersMap.get(s).add(smDto);
                }
            }
        }

        List<SkillCoverageDto> coverage = new ArrayList<>();
        for (String skill : ALL_SKILLS) {
            List<SkillMemberDto> smList = skillMembersMap.get(skill);
            coverage.add(new SkillCoverageDto(skill, smList.size(), smList, smList.isEmpty()));
        }

        List<RoleDistributionDto> roles = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : roleCounts.entrySet()) {
            roles.add(new RoleDistributionDto(entry.getKey(), entry.getValue()));
        }

        TeamCharterSummaryDto charter = computeCharterSummary(roomId, members.size(), viewer != null ? viewer.getId() : null);
        return new TeamResponseDto(memberDtos, coverage, roles, charter, clock.instant());
    }

    /**
     * Saves or updates the caller's hackathon charter commitment (goal, available sprint hours, norms).
     */
    @Transactional
    public TeamResponseDto saveCharter(UUID roomId, User user, SaveCharterRequest request) {
        roomAccess.requireMember(roomId, user);

        String goal = request.goal() != null ? request.goal().trim().toUpperCase() : "WIN";
        if (!Set.of("WIN", "LEARN", "PORTFOLIO", "ALL").contains(goal)) {
            throw new BadRequestException("INVALID_GOAL", "Goal must be one of WIN, LEARN, PORTFOLIO, ALL");
        }

        int hours = request.hoursAvailable() != null ? Math.max(0, Math.min(120, request.hoursAvailable())) : 0;
        boolean norms = request.normsAcknowledged() != null && request.normsAcknowledged();

        TeamCharterResponse response = charterRepository.findByRoomIdAndUserId(roomId, user.getId())
                .orElse(new TeamCharterResponse(roomId, user.getId(), goal, hours, norms));

        response.setGoal(goal);
        response.setHoursAvailable(hours);
        response.setNormsAcknowledged(norms);
        response.setUpdatedAt(clock.instant());
        charterRepository.save(response);

        return getTeam(roomId, user);
    }

    private Map<UUID, User> loadUserMap(Set<UUID> userIds) {
        Map<UUID, User> map = new HashMap<>();
        if (userIds.isEmpty()) return map;
        for (User u : userRepository.findAllById(userIds)) map.put(u.getId(), u);
        return map;
    }

    private Map<UUID, List<String>> loadSkillsMap(List<UUID> memberIds) {
        Map<UUID, List<String>> map = new HashMap<>();
        if (memberIds.isEmpty()) return map;
        for (RoomMemberSkill s : skillRepository.findByMemberIdIn(memberIds)) {
            map.computeIfAbsent(s.getMemberId(), k -> new ArrayList<>()).add(s.getSkill());
        }
        return map;
    }

    private Map<UUID, List<Task>> loadTasksByUser(UUID roomId) {
        Map<UUID, List<Task>> map = new HashMap<>();
        for (Task t : taskRepository.findByRoomId(roomId)) {
            if (t.isDropped()) continue;
            if (t.getAssigneeId() != null) {
                map.computeIfAbsent(t.getAssigneeId(), k -> new ArrayList<>()).add(t);
            }
        }
        return map;
    }

    private Map<String, List<SkillMemberDto>> initSkillMap() {
        Map<String, List<SkillMemberDto>> map = new LinkedHashMap<>();
        for (String s : ALL_SKILLS) map.put(s, new ArrayList<>());
        return map;
    }

    private TeamCharterSummaryDto computeCharterSummary(UUID roomId, int totalMembers, UUID currentUserId) {
        List<TeamCharterResponse> responses = charterRepository.findByRoomId(roomId);
        int win = 0, learn = 0, portfolio = 0, all = 0;
        int totalHours = 0, normsAck = 0;
        MyCharterDto mine = null;

        for (TeamCharterResponse r : responses) {
            String g = r.getGoal() != null ? r.getGoal().toUpperCase() : "WIN";
            if ("WIN".equals(g)) win++;
            else if ("LEARN".equals(g)) learn++;
            else if ("PORTFOLIO".equals(g)) portfolio++;
            else if ("ALL".equals(g)) all++;

            totalHours += r.getHoursAvailable();
            if (r.isNormsAcknowledged()) normsAck++;

            if (currentUserId != null && currentUserId.equals(r.getUserId())) {
                mine = new MyCharterDto(r.getGoal(), r.getHoursAvailable(), r.isNormsAcknowledged());
            }
        }

        int distinctGoals = 0;
        if (win > 0) distinctGoals++;
        if (learn > 0) distinctGoals++;
        if (portfolio > 0) distinctGoals++;
        if (all > 0) distinctGoals++;

        double avgHours = responses.isEmpty() ? 0.0 : Math.round((double) totalHours / responses.size() * 10.0) / 10.0;
        CharterGoalsCountDto goalsCount = new CharterGoalsCountDto(win, learn, portfolio, all);
        CharterNormsDto norms = new CharterNormsDto(normsAck, totalMembers);

        return new TeamCharterSummaryDto(goalsCount, avgHours, distinctGoals > 1, norms, mine);
    }
}
