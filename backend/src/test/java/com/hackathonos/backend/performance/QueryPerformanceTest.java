package com.hackathonos.backend.performance;

import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocService;
import com.hackathonos.backend.docs.DocVersion;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.github.GitHubService;
import com.hackathonos.backend.home.HomeService;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.Notification;
import com.hackathonos.backend.notifications.NotificationRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.overview.OverviewService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.team.TeamService;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserOAuthToken;
import com.hackathonos.backend.users.UserOAuthTokenRepository;
import com.hackathonos.backend.users.UserRepository;
import com.hackathonos.backend.users.UserService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
public class QueryPerformanceTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoomMemberRepository memberRepository;
    @Autowired
    private RoomMemberSkillRepository skillRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private SubtaskRepository subtaskRepository;
    @Autowired
    private TaskCommentRepository commentRepository;
    @Autowired
    private TaskHistoryRepository historyRepository;
    @Autowired
    private TaskDependencyRepository dependencyRepository;
    @Autowired
    private TaskLabelRepository labelRepository;
    @Autowired
    private DocRepository docRepository;
    @Autowired
    private DocVersionRepository versionRepository;
    @Autowired
    private IdeaRepository ideaRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserOAuthTokenRepository oauthTokenRepository;
    @Autowired
    private EventTemplateRepository templateRepository;

    @Autowired
    private BoardService boardService;
    @Autowired
    private TaskService taskService;
    @Autowired
    private DocService docService;
    @Autowired
    private IdeasService ideasService;
    @Autowired
    private OverviewService overviewService;
    @Autowired
    private TeamService teamService;
    @Autowired
    private HomeService homeService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private GitHubService gitHubService;
    @Autowired
    private UserService userService;
    @Autowired
    private PlatformTransactionManager transactionManager;

    private User leaderUser;
    private Room seededRoom;
    private Task sampleTaskWithDependencies;
    private final List<User> seededMembers = new ArrayList<>();

    private Statistics getStatistics() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        stats.setStatisticsEnabled(true);
        return stats;
    }

    private long countQueries(Runnable action) {
        Statistics stats = getStatistics();
        stats.clear();
        action.run();
        return stats.getPrepareStatementCount();
    }

    @BeforeEach
    void setUpRealisticRoom() {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.execute(status -> {
            String runId = UUID.randomUUID().toString().substring(0, 8);
            leaderUser = new User("DEV", "lead_" + runId, "Leader " + runId, "seed_leader_" + runId + "@test.dev", null, "seed_leader_" + runId);
            leaderUser.setUsername("leader_" + runId);
            leaderUser = userRepository.save(leaderUser);

            Room room = new Room();
            room.setName("Perf Room " + runId);
            room.setTemplateId("sih-36h");
            room.setOwnerId(leaderUser.getId());
            room.setStage("build");
            room.setEventStart(Instant.now().minusSeconds(3600));
            room.setEventEnd(Instant.now().plusSeconds(86400));
            room.setJoinCode("P" + runId.substring(0, 5).toUpperCase());
            room.setKeyPrefix("PRF");
            seededRoom = roomRepository.save(room);

            memberRepository.save(new RoomMember(seededRoom.getId(), leaderUser.getId(), "LEADER"));

            seededMembers.clear();
            seededMembers.add(leaderUser);
            // 11 more members to make 12
            for (int i = 1; i <= 11; i++) {
                User u = new User("DEV", "prov_" + i + "_" + runId, "Member " + i, "mem" + i + "_" + runId + "@test.dev", null, "member_" + i + "_" + runId);
                u.setUsername("mem_" + i + "_" + runId);
                u = userRepository.save(u);
                seededMembers.add(u);
                RoomMember rm = memberRepository.save(new RoomMember(seededRoom.getId(), u.getId(), "BUILDER"));
                skillRepository.save(new RoomMemberSkill(rm.getId(), "Frontend"));
                skillRepository.save(new RoomMemberSkill(rm.getId(), "Backend"));

                // Seed OAuth token for github
                UserOAuthToken token = new UserOAuthToken(u.getId(), "GITHUB", "enc_tok_" + i, "read:user", "gh_mem_" + i, Instant.now());
                oauthTokenRepository.save(token);
            }

            // 60 tasks
            List<Task> createdTasks = new ArrayList<>();
            for (int i = 1; i <= 60; i++) {
                User assignee = seededMembers.get(i % seededMembers.size());
                String tStatus = (i % 3 == 0) ? "DONE" : (i % 3 == 1) ? "IN_PROGRESS" : "TODO";
                Task t = new Task(seededRoom.getId(), "TASK-" + i, i, "Task summary " + i, "Description " + i, tStatus, assignee.getId(), leaderUser.getId(), "HIGH", null, "Dev", 60, null, i, "PLAN");
                if ("DONE".equals(tStatus)) {
                    t.setConfirmedAt(Instant.now());
                    t.setReviewState("CONFIRMED");
                }
                t = taskRepository.save(t);
                createdTasks.add(t);

                labelRepository.save(new TaskLabel(t.getId(), "core"));
                labelRepository.save(new TaskLabel(t.getId(), "backend"));

                subtaskRepository.save(new Subtask(t.getId(), "Subtask 1 for " + t.getTaskKey(), false, 1));
                subtaskRepository.save(new Subtask(t.getId(), "Subtask 2 for " + t.getTaskKey(), false, 2));
            }

            // Add comments, history, and dependencies for sampleTaskWithDependencies
            sampleTaskWithDependencies = createdTasks.get(0);
            for (int i = 1; i <= 10; i++) {
                User commenter = seededMembers.get(i % seededMembers.size());
                commentRepository.save(new TaskComment(sampleTaskWithDependencies.getId(), commenter.getId(), "Comment " + i));
                historyRepository.save(new TaskHistory(sampleTaskWithDependencies.getId(), commenter.getId(), "Updated field " + i));
            }

            // Dependencies: sampleTask depends on tasks 1..5, and tasks 6..10 depend on sampleTask (blocks)
            for (int i = 1; i <= 5; i++) {
                dependencyRepository.save(new TaskDependency(sampleTaskWithDependencies.getId(), createdTasks.get(i).getId(), seededRoom.getId()));
            }
            for (int i = 6; i <= 10; i++) {
                dependencyRepository.save(new TaskDependency(createdTasks.get(i).getId(), sampleTaskWithDependencies.getId(), seededRoom.getId()));
            }

            // 25 docs with 8 versions each
            for (int i = 1; i <= 25; i++) {
                String fileName = (i <= 10) ? getStandardDocName(i) : "DOC_" + i + ".md";
                Doc doc = new Doc(seededRoom.getId(), fileName, "Document " + i, 8);
                doc = docRepository.save(doc);

                for (int v = 1; v <= 8; v++) {
                    User author = seededMembers.get(v % seededMembers.size());
                    versionRepository.save(new DocVersion(doc.getId(), v, "# Doc " + i + " Version " + v + "\n\nContent for version " + v, "Revision " + v, author.getId()));
                }
            }

            // 80 ideas
            for (int i = 1; i <= 80; i++) {
                User author = seededMembers.get(i % seededMembers.size());
                Idea idea = new Idea(seededRoom.getId(), author.getId(), "Innovative Idea " + i + ": Scalable microarchitecture");
                ideaRepository.save(idea);
            }

            // 50 notifications for leader
            for (int i = 1; i <= 50; i++) {
                notificationRepository.save(new Notification(leaderUser.getId(), seededRoom.getId(), "TASK_ASSIGNED", "Task " + i + " assigned", "You were assigned TASK-" + i, null, null));
            }

            return null;
        });
    }

    private String getStandardDocName(int idx) {
        return switch (idx) {
            case 1 -> "README.md";
            case 2 -> "PROBLEM.md";
            case 3 -> "TECH_STACK.md";
            case 4 -> "SPRINT.md";
            case 5 -> "API.md";
            case 6 -> "PITCH.md";
            case 7 -> "DEMO_SCRIPT.md";
            case 8 -> "RETRO.md";
            case 9 -> "SUBMISSION.md";
            default -> "ROADMAP.md";
        };
    }

    @Test
    void assertPerformanceThresholds() {
        System.out.println("========== PERFORMANCE ASSERTIONS ==========");

        long boardCount = countQueries(() -> boardService.getBoard(seededRoom.getId(), leaderUser));
        System.out.println("1. GET board: " + boardCount + " statements (assert <= 15)");
        assertThat(boardCount).isLessThanOrEqualTo(15);

        long taskDetailCount = countQueries(() -> taskService.getTask(seededRoom.getId(), leaderUser, sampleTaskWithDependencies.getId().toString()));
        System.out.println("2. GET task detail: " + taskDetailCount + " statements (assert <= 18, baseline was 32)");
        assertThat(taskDetailCount).isLessThanOrEqualTo(18);

        long docsListCount = countQueries(() -> docService.listDocs(seededRoom.getId(), leaderUser));
        System.out.println("3. GET docs list: " + docsListCount + " statements (assert <= 6, baseline was 5)");
        assertThat(docsListCount).isLessThanOrEqualTo(6);

        long ideasCount = countQueries(() -> ideasService.getIdeateData(seededRoom.getId(), leaderUser));
        System.out.println("4. GET ideas: " + ideasCount + " statements (assert <= 10)");
        assertThat(ideasCount).isLessThanOrEqualTo(10);

        long overviewCount = countQueries(() -> overviewService.getOverview(seededRoom.getId(), leaderUser));
        System.out.println("5. GET overview (uncached): " + overviewCount + " statements");
        assertThat(overviewCount).isLessThanOrEqualTo(95);

        long overviewCachedCount = countQueries(() -> overviewService.getOverview(seededRoom.getId(), leaderUser));
        System.out.println("5b. GET overview (cached): " + overviewCachedCount + " statements (assert == 0)");
        assertThat(overviewCachedCount).isEqualTo(0);

        long teamCount = countQueries(() -> teamService.getTeam(seededRoom.getId(), leaderUser));
        System.out.println("6. GET team: " + teamCount + " statements (assert <= 35)");
        assertThat(teamCount).isLessThanOrEqualTo(35);

        long homeCount = countQueries(() -> homeService.getHome(leaderUser, seededRoom.getId()));
        System.out.println("7. GET home (uncached): " + homeCount + " statements");
        assertThat(homeCount).isLessThanOrEqualTo(115);

        long homeCachedCount = countQueries(() -> homeService.getHome(leaderUser, seededRoom.getId()));
        System.out.println("7b. GET home (cached): " + homeCachedCount + " statements (assert == 0)");
        assertThat(homeCachedCount).isEqualTo(0);

        long notificationsCount = countQueries(() -> notificationService.listNotifications(leaderUser, false, 20, null));
        System.out.println("8. GET notifications: " + notificationsCount + " statements (assert <= 5)");
        assertThat(notificationsCount).isLessThanOrEqualTo(5);

        long checksCount = countQueries(() -> gitHubService.getChecks(seededRoom.getId(), leaderUser));
        System.out.println("9. GET github checks: " + checksCount + " statements (assert <= 5)");
        assertThat(checksCount).isLessThanOrEqualTo(5);

        long contributorsCount = countQueries(() -> gitHubService.getContributors(seededRoom.getId(), leaderUser));
        System.out.println("10. GET github contributors: " + contributorsCount + " statements (assert <= 8, baseline was 28)");
        assertThat(contributorsCount).isLessThanOrEqualTo(8);

        long dataSummaryCount = countQueries(() -> userService.getDataSummary(leaderUser));
        System.out.println("11. UserService.getDataSummary: " + dataSummaryCount + " statements (assert <= 16)");
        assertThat(dataSummaryCount).isLessThanOrEqualTo(16);

        long deletePreviewCount = countQueries(() -> userService.getDeletePreview(leaderUser));
        System.out.println("12. UserService.getDeletePreview: " + deletePreviewCount + " statements (assert <= 10)");
        assertThat(deletePreviewCount).isLessThanOrEqualTo(10);
        System.out.println("============================================");
    }
}
