package com.hackathonos.backend.conflicts;

import com.hackathonos.backend.common.error.EntityConflictException;
import com.hackathonos.backend.common.idempotency.IdempotencyService;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.docs.DocConflictException;
import com.hackathonos.backend.docs.DocService;
import com.hackathonos.backend.docs.dto.DocDetailDto;
import com.hackathonos.backend.docs.dto.DocRequests.UpdateDocRequest;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.ideas.dto.IdeaDto;
import com.hackathonos.backend.ideas.dto.PostIdeaRequest;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.TaskController;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.tasks.TaskService;
import com.hackathonos.backend.tasks.dto.CreateTaskRequest;
import com.hackathonos.backend.tasks.dto.TaskDetailDto;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("dev")
public class ConflictAndIdempotencyIntegrationTest {

    @Autowired
    private IdeasService ideasService;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private DocService docService;

    private User alice;
    private User bob;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("GITHUB", "gh-alice-" + UUID.randomUUID(), "Alice", "alice@test.com", "alice", "https://avatar.url/alice"));
        bob = userRepository.save(new User("GITHUB", "gh-bob-" + UUID.randomUUID(), "Bob", "bob@test.com", "bob", "https://avatar.url/bob"));

        List<EventTemplate> templates = templateRepository.findAll();
        String templateId = templates.isEmpty() ? "default" : templates.get(0).getId();

        Room room = new Room(
                "Conflict Test Room",
                "Description",
                null,
                templateId,
                alice.getId(),
                Instant.now(),
                Instant.now().plusSeconds(3600),
                "UTC",
                "CR",
                "J" + UUID.randomUUID().toString().substring(0, 5)
        );
        room.setStage("ideate");
        testRoom = roomRepository.save(room);

        memberRepository.save(new RoomMember(testRoom.getId(), alice.getId(), "LEADER"));
        memberRepository.save(new RoomMember(testRoom.getId(), bob.getId(), "BUILDER"));
    }

    private boolean isConflictResult(Object res) {
        if (res instanceof EntityConflictException) {
            return true;
        }
        if (res instanceof DocConflictException) {
            return true;
        }
        if (res instanceof org.springframework.dao.OptimisticLockingFailureException) {
            return true;
        }
        if (res instanceof jakarta.persistence.OptimisticLockException) {
            return true;
        }
        if (res instanceof org.springframework.dao.DataIntegrityViolationException) {
            return true;
        }
        if (res instanceof Throwable t && t.getClass().getSimpleName().contains("OptimisticLock")) {
            return true;
        }
        return false;
    }

    @Test
    void testConcurrentUpdatesWithSameBaseVersionCausesConflict() throws Exception {
        // Create an idea
        IdeaDto initial = ideasService.createIdea(testRoom.getId(), new PostIdeaRequest("Initial text", List.of(), List.of(), false, null), alice);
        UUID ideaId = UUID.fromString(initial.id());
        Long baseVersion = initial.version() != null ? initial.version() : 0L;

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Object> future1 = executor.submit(() -> {
            startLatch.await();
            try {
                return (Object) ideasService.updateIdea(testRoom.getId(), ideaId, new PostIdeaRequest("Alice update 1", List.of(), List.of(), false, baseVersion), alice);
            } catch (Exception e) {
                return (Object) e;
            }
        });

        Future<Object> future2 = executor.submit(() -> {
            startLatch.await();
            try {
                return (Object) ideasService.updateIdea(testRoom.getId(), ideaId, new PostIdeaRequest("Alice update 2", List.of(), List.of(), false, baseVersion), alice);
            } catch (Exception e) {
                return (Object) e;
            }
        });

        startLatch.countDown();
        Object res1 = future1.get(5, TimeUnit.SECONDS);
        Object res2 = future2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one must succeed and the other must fail with a conflict exception (EntityConflictException or OptimisticLockingFailureException)
        boolean oneSucceededOneConflicted =
                (res1 instanceof IdeaDto && isConflictResult(res2)) ||
                (res2 instanceof IdeaDto && isConflictResult(res1));

        assertThat(oneSucceededOneConflicted).isTrue();
    }

    @Test
    void testConcurrentDocUpdatesByTeammatesCausesConflict() throws Exception {
        docService.seedDefaultDocsIfMissing(testRoom.getId(), alice);
        DocDetailDto prd = docService.getDocByFileName(testRoom.getId(), "PRD.md", alice);
        int baseVersion = prd.currentVersion();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Future<Object> future1 = executor.submit(() -> {
            startLatch.await();
            try {
                return (Object) docService.updateDoc(testRoom.getId(), "PRD.md", new UpdateDocRequest("Alice PRD version", "Alice edits", baseVersion), alice);
            } catch (Exception e) {
                return (Object) e;
            }
        });

        Future<Object> future2 = executor.submit(() -> {
            startLatch.await();
            try {
                return (Object) docService.updateDoc(testRoom.getId(), "PRD.md", new UpdateDocRequest("Bob PRD version", "Bob edits", baseVersion), bob);
            } catch (Exception e) {
                return (Object) e;
            }
        });

        startLatch.countDown();
        Object res1 = future1.get(5, TimeUnit.SECONDS);
        Object res2 = future2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        boolean oneSucceededOneConflicted =
                (res1 instanceof DocDetailDto && isConflictResult(res2)) ||
                (res2 instanceof DocDetailDto && isConflictResult(res1));

        assertThat(oneSucceededOneConflicted).isTrue();
    }

    @Test
    void testConcurrentVotesOnIdeaCountAccuratelyWithoutBumpingEntityVersion() throws Exception {
        // Create an idea
        IdeaDto created = ideasService.createIdea(testRoom.getId(), new PostIdeaRequest("Voting idea", List.of(), List.of(), false, null), alice);
        UUID ideaId = UUID.fromString(created.id());

        Idea beforeVote = ideaRepository.findById(ideaId).orElseThrow();
        Long versionBefore = beforeVote.getVersion();

        // 20 unique voters
        int threadCount = 20;
        List<User> voters = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            User voter = userRepository.save(new User("GITHUB", "voter-" + i + "-" + UUID.randomUUID(), "Voter " + i, "voter" + i + "@test.com", "voter" + i, ""));
            memberRepository.save(new RoomMember(testRoom.getId(), voter.getId(), "BUILDER"));
            voters.add(voter);
        }

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger();

        for (int i = 0; i < threadCount; i++) {
            final User voter = voters.get(i);
            executor.submit(() -> {
                try {
                    startLatch.await();
                    ideasService.voteIdea(testRoom.getId(), ideaId, voter);
                    successCount.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(threadCount);
        assertThat(ideasService.getVoteCount(ideaId)).isEqualTo(threadCount);

        // Crucial requirement: Idea @Version must NOT have incremented 20 times!
        Idea afterVote = ideaRepository.findById(ideaId).orElseThrow();
        assertThat(afterVote.getVersion()).isEqualTo(versionBefore);
    }

    @Test
    void testBackwardCompatibilityWithoutBaseVersionSucceeds() {
        IdeaDto initial = ideasService.createIdea(testRoom.getId(), new PostIdeaRequest("Legacy initial", List.of(), List.of(), false, null), alice);
        UUID ideaId = UUID.fromString(initial.id());

        // Update without baseVersion (null) simulates an old client
        PostIdeaRequest legacyRequest = new PostIdeaRequest("Legacy updated", List.of(), List.of(), false, null);
        IdeaDto updated = ideasService.updateIdea(testRoom.getId(), ideaId, legacyRequest, alice);

        assertThat(updated.text()).isEqualTo("Legacy updated");
    }

    @Test
    void testIdempotentCreateTaskReturnsSameResultAndCreatesSingleRecord() {
        testRoom.setStage("build");
        testRoom.setBuildStartedAt(Instant.now());
        roomRepository.save(testRoom);

        CurrentUser currentUser = mock(CurrentUser.class);
        when(currentUser.get()).thenReturn(alice);

        TaskController controller = new TaskController(taskService, currentUser, idempotencyService);

        CreateTaskRequest req = new CreateTaskRequest(
                "Implement hardened conflict resolution",
                "Detailed task description",
                "todo",
                null,
                "high",
                null,
                "Frontend",
                60,
                null,
                List.of("hardening", "step5")
        );

        String idempotencyKey = "idemp-" + UUID.randomUUID();

        long taskCountBefore = taskRepository.count();

        // 1st call
        TaskDetailDto res1 = controller.createTask(testRoom.getId(), req, idempotencyKey);
        assertThat(res1).isNotNull();

        // 2nd call with identical key
        TaskDetailDto res2 = controller.createTask(testRoom.getId(), req, idempotencyKey);
        assertThat(res2).isNotNull();

        // Must return identical Task ID
        assertThat(res2.id()).isEqualTo(res1.id());

        // Exactly one task was created in the database
        long taskCountAfter = taskRepository.count();
        assertThat(taskCountAfter - taskCountBefore).isEqualTo(1);
    }
}
