package com.hackathonos.backend.loadtest;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.checkpoints.CheckpointService;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserSettings;
import com.hackathonos.backend.users.UserSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Profile("loadtest")
public class LoadtestSeedService {

    private static final Logger log = LoggerFactory.getLogger(LoadtestSeedService.class);

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;
    private final TaskRepository taskRepository;
    private final DocRepository docRepository;
    private final DocVersionRepository docVersionRepository;
    private final IdeaRepository ideaRepository;
    private final BriefRepository briefRepository;
    private final CheckpointService checkpointService;
    private final SessionRepository<? extends Session> sessionRepository;

    public LoadtestSeedService(
            UserRepository userRepository,
            UserSettingsRepository userSettingsRepository,
            RoomRepository roomRepository,
            RoomMemberRepository memberRepository,
            TaskRepository taskRepository,
            DocRepository docRepository,
            DocVersionRepository docVersionRepository,
            IdeaRepository ideaRepository,
            BriefRepository briefRepository,
            CheckpointService checkpointService,
            SessionRepository<? extends Session> sessionRepository
    ) {
        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
        this.docRepository = docRepository;
        this.docVersionRepository = docVersionRepository;
        this.ideaRepository = ideaRepository;
        this.briefRepository = briefRepository;
        this.checkpointService = checkpointService;
        this.sessionRepository = sessionRepository;
    }

    public record SeedUserResult(UUID id, String email, String displayName, String sessionId, String csrfToken, List<UUID> roomIds) {}
    public record SeedRoomResult(UUID id, String name, String roomCode, String inviteCode, List<UUID> memberUserIds, List<UUID> taskIds, List<UUID> docIds, List<UUID> ideaIds) {}
    public record SeedResponse(int userCount, int roomCount, int taskCount, int docCount, int ideaCount, List<SeedUserResult> users, List<SeedRoomResult> rooms) {}

    @Transactional
    @SuppressWarnings({"unchecked", "rawtypes"})
    public SeedResponse seed(int userCount, int roomCount, int tasksPerRoom, int docsPerRoom, int ideasPerRoom) {
        log.info("Starting load-test seed: users={}, rooms={}, tasks/room={}, docs/room={}, ideas/room={}",
                userCount, roomCount, tasksPerRoom, docsPerRoom, ideasPerRoom);

        // 1. Create Users
        List<User> users = new ArrayList<>(userCount);
        Map<UUID, List<UUID>> userRoomMap = new HashMap<>();

        for (int i = 1; i <= userCount; i++) {
            String email = "loadtest_user_" + i + "@bracket.loadtest";
            String username = "lt_user_" + i;
            String displayName = "LoadTester " + i;

            User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user == null) {
                user = new User("GITHUB", "gh_lt_" + i, displayName, email, "https://api.dicebear.com/7.x/bottts/svg?seed=lt_" + i, username);
                user.setUsername(username);
                user.setOnboardingCompleted(true);
                user = userRepository.save(user);

                UserSettings settings = new UserSettings(user.getId(), displayName);
                userSettingsRepository.save(settings);
            }
            users.add(user);
            userRoomMap.put(user.getId(), new ArrayList<>());
        }

        // 2. Create Rooms with teams of 5 (or userCount / roomCount)
        List<SeedRoomResult> roomResults = new ArrayList<>(roomCount);
        int totalTasks = 0;
        int totalDocs = 0;
        int totalIdeas = 0;

        int usersPerRoom = Math.max(1, userCount / Math.max(1, roomCount));

        for (int r = 1; r <= roomCount; r++) {
            int leadIdx = ((r - 1) * usersPerRoom) % userCount;
            User leader = users.get(leadIdx);

            Instant startsAt = Instant.now().minus(10, ChronoUnit.HOURS);
            Instant endsAt = startsAt.plus(36, ChronoUnit.HOURS);
            String roomCode = String.format("LT%02d", (r % 99) + 1);
            String inviteCode = ("LT" + r + UUID.randomUUID().toString().replace("-", "")).substring(0, 12);

            Room room = new Room(
                    "LoadTest Project " + r,
                    "Automated high-scale load testing room " + r,
                    "Scalable distributed collaborative engineering platform",
                    "sih-36h",
                    leader.getId(),
                    startsAt,
                    endsAt,
                    "UTC",
                    roomCode,
                    inviteCode
            );
            room.setDurationHours(36);
            room.setStage("build");
            room.setWorkflowStage("BUILD");
            room.setBriefDone(true);
            room.setIdeateDone(true);
            room.setPlanDone(true);
            room = roomRepository.save(room);

            // Add members
            List<UUID> memberIds = new ArrayList<>();
            memberRepository.save(new RoomMember(room.getId(), leader.getId(), "LEADER"));
            memberIds.add(leader.getId());
            userRoomMap.get(leader.getId()).add(room.getId());

            for (int m = 1; m < usersPerRoom; m++) {
                int memberIdx = (((r - 1) * usersPerRoom) + m) % userCount;
                User member = users.get(memberIdx);
                if (!memberIds.contains(member.getId())) {
                    memberRepository.save(new RoomMember(room.getId(), member.getId(), "BUILDER"));
                    memberIds.add(member.getId());
                    userRoomMap.get(member.getId()).add(room.getId());
                }
            }

            // Create Brief
            Brief brief = new Brief(room.getId(), "manual");
            brief.setProblemStatement("Load testing scalability problem statement for room " + r);
            brief.setTargetAudience("Engineers, Judges, Evaluators");
            brief.setConfirmed(true);
            brief.setConfirmedAt(startsAt.plus(1, ChronoUnit.HOURS));
            brief.setConfirmedBy(leader.getId());
            briefRepository.save(brief);

            // Create Checkpoints
            try {
                checkpointService.createForRoom(room);
            } catch (Exception ignored) {}

            // Create Ideas
            List<UUID> ideaIds = new ArrayList<>();
            for (int i = 1; i <= ideasPerRoom; i++) {
                User author = users.get((leadIdx + i) % users.size());
                Idea idea = new Idea(room.getId(), author.getId(), "Idea #" + i + " for room " + r + ": " + UUID.randomUUID().toString().substring(0, 16));
                idea.setStatus(i % 3 == 0 ? "APPROVED" : "PENDING");
                idea.setVoteCount(i * 2);
                idea = ideaRepository.save(idea);
                ideaIds.add(idea.getId());
                totalIdeas++;
            }

            // Create Tasks
            List<UUID> taskIds = new ArrayList<>();
            for (int t = 1; t <= tasksPerRoom; t++) {
                User assignee = users.get((leadIdx + t) % users.size());
                String status = t % 3 == 0 ? "DONE" : (t % 2 == 0 ? "IN_PROGRESS" : "TODO");
                String priority = t % 4 == 0 ? "HIGHEST" : "MEDIUM";
                Task task = new Task(
                        room.getId(),
                        "TASK-" + t,
                        t,
                        "Implement feature #" + t + " in room " + r,
                        "Detailed description of task " + t + " for load-testing synthetic scenario.",
                        status,
                        assignee.getId(),
                        leader.getId(),
                        priority,
                        null,
                        "Dev",
                        60,
                        null,
                        t,
                        "PLAN"
                );
                task = taskRepository.save(task);
                taskIds.add(task.getId());
                totalTasks++;
            }

            // Create Docs
            List<UUID> docIds = new ArrayList<>();
            for (int d = 1; d <= docsPerRoom; d++) {
                Doc doc = new Doc(room.getId(), "doc-" + d + ".md", "Document #" + d + " Spec", 1);
                doc = docRepository.save(doc);

                DocVersion version = new DocVersion(
                        doc.getId(),
                        1,
                        "Initial architecture specification content for document " + d + " in room " + r + ".\n\n# System Design\nDetails here.",
                        "Initial spec",
                        leader.getId()
                );
                docVersionRepository.save(version);
                docIds.add(doc.getId());
                totalDocs++;
            }

            roomResults.add(new SeedRoomResult(room.getId(), room.getName(), roomCode, inviteCode, memberIds, taskIds, docIds, ideaIds));
        }

        // 3. Create pre-authenticated Spring Sessions & CSRF tokens for all users
        List<SeedUserResult> userResults = new ArrayList<>(userCount);
        for (User u : users) {
            String sessionId = createAuthenticatedSession(u);
            String csrfToken = UUID.randomUUID().toString();
            userResults.add(new SeedUserResult(u.getId(), u.getEmail(), u.getDisplayName(), sessionId, csrfToken, userRoomMap.get(u.getId())));
        }

        log.info("Load-test seed completed: created {} users, {} rooms, {} tasks, {} docs, {} ideas",
                users.size(), roomResults.size(), totalTasks, totalDocs, totalIdeas);

        return new SeedResponse(users.size(), roomResults.size(), totalTasks, totalDocs, totalIdeas, userResults, roomResults);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public String createAuthenticatedSession(User user) {
        Session session = sessionRepository.createSession();
        session.setMaxInactiveInterval(Duration.ofHours(24));

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        securityContext.setAuthentication(auth);

        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        ((SessionRepository) sessionRepository).save(session);
        return session.getId();
    }
}

