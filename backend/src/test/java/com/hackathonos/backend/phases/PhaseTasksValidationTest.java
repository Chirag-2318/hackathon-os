package com.hackathonos.backend.phases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.team.TeamCharterResponseRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocVersionRepository;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.notifications.NotificationService;
import com.hackathonos.backend.phases.dto.PhaseTaskImportSummaryDto;
import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.plan.PlanPhaseRepository;
import com.hackathonos.backend.plan.PlanPromptService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.tasks.*;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
public class PhaseTasksValidationTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomAccess roomAccess;
    @Mock private PlanPhaseRepository phaseRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private TaskDependencyRepository dependencyRepository;
    @Mock private TaskAcceptanceItemRepository acceptanceRepository;
    @Mock private TaskLabelRepository labelRepository;
    @Mock private TaskHistoryRepository historyRepository;
    @Mock private TaskKeyService taskKeyService;
    @Mock private DocRepository docRepository;
    @Mock private DocVersionRepository docVersionRepository;
    @Mock private RoomPhaseDocRepository roomPhaseDocRepository;
    @Mock private RoomMemberRepository memberRepository;
    @Mock private RoomMemberSkillRepository skillRepository;
    @Mock private UserRepository userRepository;
    @Mock private TeamCharterResponseRepository charterRepository;
    @Mock private BriefRepository briefRepository;
    @Mock private BriefRubricItemRepository rubricRepository;
    @Mock private IdeaRepository ideaRepository;
    @Mock private IdeasService ideasService;
    @Mock private com.hackathonos.backend.ai.AiService aiService;
    @Mock private PlanPromptService planPromptService;
    @Mock private NotificationService notificationService;
    @Mock private RoomEventService roomEventService;
    @Mock private ActivityLogger activityLogger;

    private PhaseService phaseService;
    private UUID roomId;
    private User leaderUser;
    private PlanPhase p1Phase;
    private String fixtureContent;

    @BeforeEach
    void setUp() throws Exception {
        phaseService = new PhaseService(
                roomRepository,
                roomAccess,
                phaseRepository,
                taskRepository,
                dependencyRepository,
                acceptanceRepository,
                labelRepository,
                historyRepository,
                taskKeyService,
                docRepository,
                docVersionRepository,
                roomPhaseDocRepository,
                memberRepository,
                skillRepository,
                userRepository,
                charterRepository,
                briefRepository,
                rubricRepository,
                ideaRepository,
                ideasService,
                aiService,
                planPromptService,
                notificationService,
                roomEventService,
                activityLogger,
                new ObjectMapper()
        );

        roomId = UUID.randomUUID();
        leaderUser = org.mockito.Mockito.mock(User.class);
        UUID leaderId = UUID.randomUUID();
        lenient().when(leaderUser.getId()).thenReturn(leaderId);
        lenient().when(leaderUser.getEmail()).thenReturn("leader@example.com");

        Room room = new Room();
        room.setId(roomId);
        room.setName("TrafficCast");
        room.setPlanStartedAt(Instant.now());

        p1Phase = new PlanPhase(roomId, "P1", 0, "Phase 1: Foundation", BigDecimal.ZERO, BigDecimal.valueOf(25), "Checkpoint 1", "[]");
        p1Phase.setId(UUID.randomUUID());
        p1Phase.setStatus("ACTIVE");

        lenient().when(roomAccess.getActiveRoomOrThrow(roomId)).thenReturn(room);
        lenient().when(phaseRepository.findByRoomIdAndPlanKey(eq(roomId), eq("P1"))).thenReturn(Optional.of(p1Phase));
        lenient().when(phaseRepository.findByRoomIdOrderByPositionAsc(roomId)).thenReturn(List.of(p1Phase));

        // Mock users and handles
        UUID aliceId = UUID.randomUUID();
        User alice = org.mockito.Mockito.mock(User.class);
        lenient().when(alice.getId()).thenReturn(aliceId);
        lenient().when(alice.getUsername()).thenReturn("alice");
        lenient().when(alice.getName()).thenReturn("Alice Smith");

        UUID bobId = UUID.randomUUID();
        User bob = org.mockito.Mockito.mock(User.class);
        lenient().when(bob.getId()).thenReturn(bobId);
        lenient().when(bob.getUsername()).thenReturn("bob");
        lenient().when(bob.getName()).thenReturn("Bob Jones");

        RoomMember mAlice = new RoomMember(roomId, aliceId, "LEADER");
        RoomMember mBob = new RoomMember(roomId, bobId, "MEMBER");

        lenient().when(memberRepository.findByRoomId(roomId)).thenReturn(List.of(mAlice, mBob));
        lenient().when(userRepository.findById(aliceId)).thenReturn(Optional.of(alice));
        lenient().when(userRepository.findById(bobId)).thenReturn(Optional.of(bob));
        lenient().when(planPromptService.getHandle(alice)).thenReturn("@alice");
        lenient().when(planPromptService.getHandle(bob)).thenReturn("@bob");

        int[] counter = new int[]{1};
        lenient().when(taskKeyService.nextKeyResult(any(Room.class)))
                .thenAnswer(inv -> new TaskKeyService.TaskKeyResult("T-" + (counter[0]++), counter[0]));

        lenient().when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        lenient().when(docRepository.findByRoomIdAndFileName(eq(roomId), anyString())).thenReturn(Optional.empty());
        lenient().when(docRepository.save(any(Doc.class))).thenAnswer(inv -> {
            Doc d = inv.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });

        try (InputStream is = getClass().getResourceAsStream("/plan-fixtures/phase-tasks-sample.md")) {
            assertNotNull(is, "Fixture /plan-fixtures/phase-tasks-sample.md is missing!");
            fixtureContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void assertImportOk(PhaseTaskImportSummaryDto summary, String variant) {
        assertNotNull(summary, variant + " summary is null");
        List<String> blocks = summary.issues() != null
                ? summary.issues().stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).map(i -> i.code() + ": " + i.message()).toList()
                : List.of();
        assertTrue(summary.ok(), variant + " should have ok==true but was false. Blocks: " + blocks);
        assertEquals(0, blocks.size(), variant + " had blocking issues: " + blocks);
        assertTrue(summary.tasksCreated() >= 2, variant + " expected >= 2 tasks created, got " + summary.tasksCreated());
    }

    @Test
    void testSampleAsIs() {
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Sample as-is");
    }

    @Test
    void testVariant_LocalIdsL1VsT001() {
        String content = fixtureContent.replace("T-001", "L1").replace("T-002", "L2");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Local IDs L1 vs T-001");
    }

    @Test
    void testVariant_WithoutBundleMarkers() {
        String content = fixtureContent
                .replace("=====FILE: TASKS_P1.md=====", "")
                .replace("=====END FILE=====", "")
                .trim();
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Without bundle markers");
    }

    @Test
    void testVariant_WrappedInCodeFence() {
        String content = "```markdown\n" + fixtureContent + "\n```";
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Wrapped in code fence");
    }

    @Test
    void testVariant_CrlfLineEndings() {
        String content = fixtureContent.replace("\n", "\r\n");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "CRLF line endings");
    }

    @Test
    void testVariant_Utf8WithBom() {
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] text = fixtureContent.getBytes(StandardCharsets.UTF_8);
        byte[] combined = new byte[bom.length + text.length];
        System.arraycopy(bom, 0, combined, 0, bom.length);
        System.arraycopy(text, 0, combined, bom.length, text.length);

        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", combined);
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "UTF-8 with BOM");
    }

    @Test
    void testVariant_FileNames() {
        // tasks.md
        MockMultipartFile f1 = new MockMultipartFile("files", "tasks.md", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto s1 = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{f1}, "FRESH", false, leaderUser);
        assertImportOk(s1, "Filename: tasks.md");

        // phase-p1-tasks.md
        MockMultipartFile f2 = new MockMultipartFile("files", "phase-p1-tasks.md", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto s2 = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{f2}, "FRESH", false, leaderUser);
        assertImportOk(s2, "Filename: phase-p1-tasks.md");
    }

    @Test
    void testVariant_PhaseKeyVariations() {
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));

        // "Phase: P1"
        PhaseTaskImportSummaryDto s1 = phaseService.validateAndImportTasks(roomId, "Phase: P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(s1, "Phase key: Phase: P1");

        // "Phase 1"
        PhaseTaskImportSummaryDto s2 = phaseService.validateAndImportTasks(roomId, "Phase 1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(s2, "Phase key: Phase 1");

        // "P1"
        PhaseTaskImportSummaryDto s3 = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(s3, "Phase key: P1");
    }

    @Test
    void testVariant_AssigneeWithAndWithoutAt() {
        String content = fixtureContent.replace("@alice", "alice").replace("@bob", "bob");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Assignee without @");
    }

    @Test
    void testVariant_RoleSynonyms() {
        String content = fixtureContent.replace("Role: Backend", "Role: server").replace("Role: Frontend", "Role: UI");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Role synonyms");
    }

    @Test
    void testVariant_EstimateFormats() {
        String content = fixtureContent.replace("Estimate: 2h", "Estimate: 2 hours").replace("Estimate: 3h", "Estimate: 3");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Estimate formats: '2 hours' and '3'");
    }

    @Test
    void testVariant_DependsOnFormats() {
        String content = fixtureContent.replace("Depends on: none", "Depends on: -").replace("Depends on: T-001", "Depends on: L1, L2");
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Depends on: '-' and 'L1, L2'");
    }

    @Test
    void testVariant_AcceptanceNestedOrNumbered() {
        String nestedContent = fixtureContent.replace(
                "  - Spring Boot app boots cleanly on port 8080\n  - Health check endpoint returns 200 OK",
                "  1. Spring Boot app boots cleanly on port 8080\n  2. Health check endpoint returns 200 OK"
        ).replace(
                "  - Vite dev server starts without lint or console errors\n  - Theme tokens toggle between light and dark modes cleanly",
                "  - [ ] Vite dev server starts without lint or console errors\n  - [x] Theme tokens toggle between light and dark modes cleanly"
        );
        MockMultipartFile file = new MockMultipartFile("files", "TASKS_P1.md", "text/markdown", nestedContent.getBytes(StandardCharsets.UTF_8));
        PhaseTaskImportSummaryDto summary = phaseService.validateAndImportTasks(roomId, "P1", new MockMultipartFile[]{file}, "FRESH", false, leaderUser);
        assertImportOk(summary, "Acceptance criteria nested or numbered");
    }
}
