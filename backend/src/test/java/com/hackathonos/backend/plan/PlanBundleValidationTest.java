package com.hackathonos.backend.plan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.activity.ActivityLogger;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefRubricItemRepository;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.events.RoomEventService;
import com.hackathonos.backend.files.FileTextExtractor;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.plan.dto.ValidatePlanResponse;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PlanBundleValidationTest {

    @Mock private RoomAccess roomAccess;
    @Mock private PlanStepRepository planStepRepository;
    @Mock private PlanDownstreamSyncService planDownstreamSyncService;
    @Mock private PlanCompletionService planCompletionService;
    @Mock private PlanPromptService planPromptService;
    @Mock private ObjectProvider<PlanPrepareService> planPrepareServiceProvider;
    @Mock private BriefRepository briefRepository;
    @Mock private BriefRubricItemRepository rubricRepository;
    @Mock private IdeaRepository ideaRepository;
    @Mock private RoomMemberRepository memberRepository;
    @Mock private RoomMemberSkillRepository skillRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoomEventService roomEventService;
    @Mock private ActivityLogger activityLogger;

    private PlanValidationService planValidationService;
    private FileTextExtractor fileTextExtractor;
    private String fixtureContent;
    private UUID roomId;
    private User leaderUser;

    @BeforeEach
    void setUp() throws Exception {
        fileTextExtractor = new FileTextExtractor();
        planValidationService = new PlanValidationService(
                new ObjectMapper(),
                roomAccess,
                planStepRepository,
                planDownstreamSyncService,
                planCompletionService,
                planPromptService,
                planPrepareServiceProvider,
                briefRepository,
                rubricRepository,
                ideaRepository,
                memberRepository,
                skillRepository,
                userRepository,
                roomEventService,
                activityLogger,
                fileTextExtractor
        );
        planValidationService.init();

        try (InputStream is = getClass().getResourceAsStream("/plan-fixtures/step1-bundle.md")) {
            assertNotNull(is, "Fixture /plan-fixtures/step1-bundle.md is missing!");
            fixtureContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }

        roomId = UUID.randomUUID();
        leaderUser = org.mockito.Mockito.mock(User.class);
        lenient().when(leaderUser.getId()).thenReturn(UUID.randomUUID());
        lenient().when(leaderUser.getEmail()).thenReturn("leader@example.com");

        Room room = new Room();
        room.setId(roomId);
        room.setName("TrafficCast");
        room.setPlanStartedAt(Instant.now());

        lenient().when(roomAccess.getActiveRoomOrThrow(roomId)).thenReturn(room);
        lenient().when(planStepRepository.findByRoomIdAndStepKey(eq(roomId), eq("prd"))).thenReturn(Optional.empty());
        lenient().when(planStepRepository.save(any(PlanStep.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private void assertValid(ValidatePlanResponse response, String variantName) {
        assertNotNull(response, variantName + " response was null");
        long blockCount = response.issues().stream().filter(i -> "BLOCK".equalsIgnoreCase(i.severity())).count();
        List<String> blockMessages = response.issues().stream()
                .filter(i -> "BLOCK".equalsIgnoreCase(i.severity()))
                .map(i -> i.code() + ": " + i.message())
                .toList();
        assertTrue(response.ok(), variantName + " should have ok==true, but was false. Blocks: " + blockMessages);
        assertEquals(0, blockCount, variantName + " should have 0 BLOCK issues. Found: " + blockMessages);
    }

    @Test
    void testVariantA_AsIs() {
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant A (as is)");
    }

    @Test
    void testVariantB_WrappedInCodeFence() {
        String wrapped = "```markdown\n" + fixtureContent + "\n```";
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", wrapped.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant B (wrapped in code fence)");
    }

    @Test
    void testVariantC_CrlfLineEndings() {
        String crlf = fixtureContent.replace("\n", "\r\n");
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", crlf.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant C (CRLF line endings)");
    }

    @Test
    void testVariantD_Utf8WithBom() {
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] textBytes = fixtureContent.getBytes(StandardCharsets.UTF_8);
        byte[] combined = new byte[bom.length + textBytes.length];
        System.arraycopy(bom, 0, combined, 0, bom.length);
        System.arraycopy(textBytes, 0, combined, bom.length, textBytes.length);

        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", combined);
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant D (UTF-8 with BOM)");
    }

    @Test
    void testVariantE_Utf16LeWithBom() {
        byte[] bom = new byte[]{(byte) 0xFF, (byte) 0xFE};
        byte[] textBytes = fixtureContent.getBytes(StandardCharsets.UTF_16LE);
        byte[] combined = new byte[bom.length + textBytes.length];
        System.arraycopy(bom, 0, combined, 0, bom.length);
        System.arraycopy(textBytes, 0, combined, bom.length, textBytes.length);

        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", combined);
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant E (UTF-16LE with BOM)");
    }

    @Test
    void testVariantF_SplitIntoTwoFilesMarkerLinesRemoved() {
        int mvpStart = fixtureContent.indexOf("=====FILE: MVP.md=====");
        String prdPart = fixtureContent.substring(0, mvpStart)
                .replace("=====FILE: PRD.md=====", "")
                .replace("=====END FILE=====", "")
                .trim();
        String mvpPart = fixtureContent.substring(mvpStart)
                .replace("=====FILE: MVP.md=====", "")
                .replace("=====END FILE=====", "")
                .trim();

        MockMultipartFile file1 = new MockMultipartFile("files", "PRD.md", "text/markdown", prdPart.getBytes(StandardCharsets.UTF_8));
        MockMultipartFile file2 = new MockMultipartFile("files", "MVP.md", "text/markdown", mvpPart.getBytes(StandardCharsets.UTF_8));

        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file1, file2), false, leaderUser);
        assertValid(resp, "Variant F (split two files)");
    }

    @Test
    void testVariantG_EndMarkersRemoved() {
        String noEnd = fixtureContent.replaceAll("(?m)^[#*=\\s]*END(?: FILE)?[#*=\\s]*$", "");
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", noEnd.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant G (END markers removed)");
    }

    @Test
    void testVariantH_MarkerLinesWrapped() {
        String wrappedMarkers = fixtureContent
                .replace("=====FILE: PRD.md=====", "**FILE: PRD.md**")
                .replace("=====FILE: MVP.md=====", "### FILE: MVP.md");
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", wrappedMarkers.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant H (wrapped marker lines)");
    }

    @Test
    void testVariantI_ProseBeforeAndAfterMarkers() {
        String withProse = "Here is the comprehensive plan generated for Step 1.\n\n"
                + fixtureContent
                + "\n\nPlease review the PRD and MVP documents above.";
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", withProse.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertValid(resp, "Variant I (prose before and after)");
    }

    @Test
    void testVariantJ_FileNames() {
        // step1-bundle.md.txt
        MockMultipartFile f1 = new MockMultipartFile("files", "step1-bundle.md.txt", "text/plain", fixtureContent.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse r1 = planValidationService.validateStepMultipart(roomId, "1", List.of(f1), false, leaderUser);
        assertValid(r1, "Variant J1 (step1-bundle.md.txt)");

        // STEP1-BUNDLE.MD
        MockMultipartFile f2 = new MockMultipartFile("files", "STEP1-BUNDLE.MD", "text/markdown", fixtureContent.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse r2 = planValidationService.validateStepMultipart(roomId, "1", List.of(f2), false, leaderUser);
        // no extension
        MockMultipartFile f3 = new MockMultipartFile("files", "step1-bundle", "application/octet-stream", fixtureContent.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse r3 = planValidationService.validateStepMultipart(roomId, "1", List.of(f3), false, leaderUser);
        assertValid(r3, "Variant J3 (no extension)");
    }

    private void assertBlockedWithCode(ValidatePlanResponse response, String expectedCode, String testName) {
        assertNotNull(response, testName + " response was null");
        assertFalse(response.ok(), testName + " should have ok==false");
        boolean hasCode = response.issues().stream()
                .anyMatch(i -> "BLOCK".equalsIgnoreCase(i.severity()) && expectedCode.equalsIgnoreCase(i.code()));
        List<String> blockCodes = response.issues().stream()
                .filter(i -> "BLOCK".equalsIgnoreCase(i.severity()))
                .map(i -> i.code() + ": " + i.message())
                .toList();
        assertTrue(hasCode, testName + " expected BLOCK code " + expectedCode + ", but found: " + blockCodes);
    }

    @Test
    void testNegative_Readme() {
        String content = """
                # TrafficCast

                A traffic prediction dashboard for city operations.

                ## Installation
                Run `npm install` and `npm start`.

                ## License
                MIT
                """;
        MockMultipartFile file = new MockMultipartFile("files", "README.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "DOCUMENT_TOO_SHORT", "Negative: README");
    }

    @Test
    void testNegative_LoremIpsum() {
        String content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(60);
        MockMultipartFile file = new MockMultipartFile("files", "lorem.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "DOCUMENT_TOO_SHORT", "Negative: Lorem Ipsum");
    }

    @Test
    void testNegative_PromptText() {
        String content = """
                OUTPUT DELIVERY: Return the full PRD and MVP in bundle format.
                {{project_name}}
                <<<USER_DATA>>>
                SELF-CHECK: Ensure all headings match.
                You are writing the plan for TrafficCast.
                """;
        MockMultipartFile file = new MockMultipartFile("files", "step1-prompt.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "LOOKS_LIKE_PROMPT", "Negative: Prompt text");
    }

    @Test
    void testNegative_JsonFile() {
        String content = """
                {
                  "project": "TrafficCast",
                  "version": "1.0.0",
                  "dependencies": {
                    "react": "^18.0.0"
                  }
                }
                """;
        MockMultipartFile file = new MockMultipartFile("files", "package.json", "application/json", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "NOT_A_DOCUMENT", "Negative: JSON file");
    }

    @Test
    void testNegative_Resume() {
        String content = """
                # John Doe - Senior Full Stack Engineer
                TrafficCast Contributor

                ## Experience
                Senior Software Engineer at ACME Corp.
                - Designed scalable APIs and systems.
                - Managed deployment pipelines.

                ## Education
                B.S. in Computer Science.
                """;
        MockMultipartFile file = new MockMultipartFile("files", "resume.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "DOCUMENT_TOO_SHORT", "Negative: Resume");
    }

    @Test
    void testNegative_Step2FileUploadedToStep1() {
        String content = """
                =====FILE: TECH_STACK.md=====
                # Tech stack: TrafficCast
                ## Decision summary
                This is a comprehensive tech stack decision summary for TrafficCast with more than 300 characters of text describing the database, frontend framework, backend service, and all dependencies in complete detail.
                ## New-tech budget
                Budget details.
                ## Rejected options
                Rejected choices.
                ## Cost and limits
                Cost details.
                ## Accounts and setup
                Setup details.
                ## Rule compliance
                Compliant.
                ## Reality check
                Reality checked.
                =====END FILE=====

                =====FILE: ARCHITECTURE.md=====
                # Architecture: TrafficCast
                ## Overview
                Architecture overview.
                ## System diagram
                Diagram.
                ## Core flow sequence
                Sequence.
                ## Data model
                Model.
                ## Components
                Components.
                ## API contract
                Contract.
                ## External services and fallbacks
                Services.
                ## Repository and branches
                Branches.
                ## Environments and demo setup
                Setup.
                ## Security and secrets
                Security.
                ## Failure modes
                Failures.
                ## Reality check
                Check.
                =====END FILE=====
                """;
        MockMultipartFile file = new MockMultipartFile("files", "step2-bundle.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "WRONG_STEP", "Negative: Step 2 file in Step 1");
    }

    @Test
    void testNegative_LongTextNoMatchingHeadings() {
        String longBody = "This is a detailed analysis of TrafficCast without expected sections. ".repeat(50);
        String content = "=====FILE: PRD.md=====\n# PRD: TrafficCast\n" + longBody + "\n=====END FILE=====\n\n"
                + "=====FILE: MVP.md=====\n# MVP: TrafficCast\n" + longBody + "\n=====END FILE=====";
        MockMultipartFile file = new MockMultipartFile("files", "step1-bundle.md", "text/markdown", content.getBytes(StandardCharsets.UTF_8));
        ValidatePlanResponse resp = planValidationService.validateStepMultipart(roomId, "1", List.of(file), false, leaderUser);
        assertBlockedWithCode(resp, "STRUCTURE_MISMATCH", "Negative: Long text with no matching headings");
    }
}

