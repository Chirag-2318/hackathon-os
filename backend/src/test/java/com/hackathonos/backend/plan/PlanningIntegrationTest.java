package com.hackathonos.backend.plan;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.brief.BriefService;
import com.hackathonos.backend.brief.dto.*;
import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.docs.Doc;
import com.hackathonos.backend.docs.DocRepository;
import com.hackathonos.backend.docs.DocService;
import com.hackathonos.backend.docs.dto.DocListResponseDto;
import com.hackathonos.backend.ideas.IdeasService;
import com.hackathonos.backend.ideas.dto.IdeaDto;
import com.hackathonos.backend.ideas.dto.PostIdeaRequest;
import com.hackathonos.backend.ideas.dto.RejectIdeaRequest;
import com.hackathonos.backend.members.MemberService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.plan.dto.*;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.rooms.RoomStageService;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
class PlanningIntegrationTest {

    @Autowired
    private RoomService roomService;
    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoomMemberRepository memberRepository;
    @Autowired
    private RoomMemberSkillRepository skillRepository;
    @Autowired
    private BriefService briefService;
    @Autowired
    private BriefRepository briefRepository;
    @Autowired
    private IdeasService ideasService;
    @Autowired
    private PlanService planService;
    @Autowired
    private PlanCompletionService planCompletionService;
    @Autowired
    private DocService docService;
    @Autowired
    private DocRepository docRepository;
    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private RoomStageService stageService;

    private User leader;
    private User builder;
    private Room room;

    private String readSample(String filename) {
        try (InputStream is = getClass().getResourceAsStream("/plan-samples/" + filename)) {
            assertNotNull(is, "Sample not found: " + filename);
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @BeforeEach
    void setup() {
        leader = userRepository.save(new User("DEV", "leader_" + UUID.randomUUID() + "@dev.com", "Leader", null, null, null));
        builder = userRepository.save(new User("DEV", "builder_" + UUID.randomUUID() + "@dev.com", "Builder", null, null, null));

        var roomDto = roomService.createRoom(leader, new CreateRoomRequest("Planning Room", "HACK", null, "online-48h", null, null));
        room = roomRepository.findById(roomDto.id()).orElseThrow();

        // Add builder member with Frontend skill
        RoomMember builderMember = memberRepository.save(new RoomMember(room.getId(), builder.getId(), "BUILDER"));
        skillRepository.save(new RoomMemberSkill(builderMember.getId(), "Frontend"));

        // Add Backend skill to leader
        RoomMember leaderMember = memberRepository.findByRoomIdAndUserId(room.getId(), leader.getId()).orElseThrow();
        skillRepository.save(new RoomMemberSkill(leaderMember.getId(), "Backend"));
    }

    @Test
    void testBriefRulesRubricSumAndConfirm() {
        // 1. Rubric weights not summing to 100 on PUT throws BadRequestException
        BriefFieldsDto badFields = new BriefFieldsDto(
                "Solve climate change with IoT",
                "City residents",
                List.of(new RubricCriterionDto("Impact", 50), new RubricCriterionDto("Execution", 30)), // sums to 80
                new DeadlinesDto("2026-11-01T09:00:00Z", "2026-11-02T12:00:00Z", "2026-11-02T18:00:00Z"),
                "Open to all",
                "Open source",
                "AI allowed",
                List.of("Source code"),
                List.of("Main track"),
                "Live demo",
                List.of("Hardware failure")
        );
        BadRequestException sumEx = assertThrows(BadRequestException.class, () ->
                briefService.saveBrief(room.getId(), new SaveBriefRequest("manual", null, null, null, badFields, Map.of(), List.of()), leader));
        assertTrue(sumEx.getMessage().contains("add up to 100"));

        // 2. Valid fields summing to 100
        BriefFieldsDto goodFields = new BriefFieldsDto(
                "Solve climate change with IoT",
                "City residents",
                List.of(new RubricCriterionDto("Impact", 50), new RubricCriterionDto("Execution", 50)),
                new DeadlinesDto("2026-11-01T09:00:00Z", "2026-11-02T12:00:00Z", "2026-11-02T18:00:00Z"),
                "Open to all",
                "Open source",
                "AI allowed",
                List.of("Source code"),
                List.of("Main track"),
                "Live demo",
                List.of("Hardware failure")
        );
        briefService.saveBrief(room.getId(), new SaveBriefRequest("manual", null, null, null, goodFields, Map.of(), List.of()), leader);

        // 3. Confirm brief without ticking confirmedFields throws BRIEF_INCOMPLETE
        BadRequestException incEx = assertThrows(BadRequestException.class, () ->
                briefService.confirmBrief(room.getId(), new ConfirmBriefRequest(true), leader));
        assertEquals("BRIEF_INCOMPLETE", incEx.getCode());

        // 4. Tick all filled fields
        String[] fields = {"problemStatement", "targetAudience", "rubric", "deadlines", "eligibility",
                "techRules", "aiPolicy", "deliverables", "tracksAndPrizes", "judgingFormat", "risks"};
        for (String f : fields) {
            briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest(f, true), leader);
        }

        // 5. Confirm succeeds and applies dates
        var confirmed = briefService.confirmBrief(room.getId(), new ConfirmBriefRequest(true), leader);
        assertTrue(confirmed.confirmed());

        Room updatedRoom = roomRepository.findById(room.getId()).orElseThrow();
        assertTrue(updatedRoom.isBriefDone());
        assertNotNull(updatedRoom.getEventStart());
        assertNotNull(updatedRoom.getEventEnd());
    }

    @Test
    void testIdeasPermissionsDecisionsAndLockedState() {
        // 1. Any member posts an idea
        PostIdeaRequest postReq = new PostIdeaRequest(
                "Autonomous drone delivery for campus medicines during hackathons",
                List.of(),
                List.of("Urgent need")
        );
        IdeaDto builderIdea = ideasService.createIdea(room.getId(), postReq, builder);
        assertNotNull(builderIdea);
        assertEquals("pending", builderIdea.status());

        // 2. Leader cannot edit builder's idea, only builder can edit while pending
        PostIdeaRequest editReq = new PostIdeaRequest("Updated drone delivery concept with GPS route optimization", List.of(), List.of());
        assertThrows(ForbiddenException.class, () ->
                ideasService.updateIdea(room.getId(), UUID.fromString(builderIdea.id()), editReq, leader));

        IdeaDto updated = ideasService.updateIdea(room.getId(), UUID.fromString(builderIdea.id()), editReq, builder);
        assertTrue(updated.text().contains("Updated drone delivery"));

        // 3. Leader approves builder's idea
        IdeaDto approved = ideasService.approveIdea(room.getId(), UUID.fromString(builderIdea.id()), leader);
        assertEquals("approved", approved.status());

        // 4. Leader marks as primary
        IdeaDto primary = ideasService.setPrimaryIdea(room.getId(), UUID.fromString(builderIdea.id()), leader);
        assertTrue(primary.isPrimary());

        // 5. Finishing ideation succeeds since there is an approved idea
        ideasService.markIdeationDone(room.getId(), leader);
        Room roomAfterIdeate = roomRepository.findById(room.getId()).orElseThrow();
        assertTrue(roomAfterIdeate.isIdeateDone());

        // 6. Posting after ideation done is rejected with IDEATION_LOCKED
        assertThrows(ConflictException.class, () ->
                ideasService.createIdea(room.getId(), postReq, builder));

        // 7. Brief deletion after ideation done is rejected with BRIEF_LOCKED
        assertThrows(ConflictException.class, () ->
                briefService.deleteBrief(room.getId(), leader));

        // 8. Reopen ideation works before build started
        ideasService.reopenIdeation(room.getId(), leader);
        Room reopenedRoom = roomRepository.findById(room.getId()).orElseThrow();
        assertFalse(reopenedRoom.isIdeateDone());
    }

    @Test
    void testFullPlanningFlowCompletionAndBuildLocking() {
        // Set up brief and approved idea so context pack passes
        BriefFieldsDto setupFields = new BriefFieldsDto(
                "Hackathon OS challenge", "Developers", List.of(new RubricCriterionDto("Execution", 100)),
                new DeadlinesDto("2026-10-10T10:00:00Z", "2026-10-11T10:00:00Z", "2026-10-11T12:00:00Z"),
                "All", "None", "Allowed", List.of(), List.of(), "Pitch", List.of()
        );
        briefService.saveBrief(room.getId(), new SaveBriefRequest("manual", null, null, null, setupFields, Map.of(), List.of()), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("problemStatement", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("targetAudience", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("rubric", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("deadlines", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("eligibility", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("techRules", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("aiPolicy", true), leader);
        briefService.updateConfirmedField(room.getId(), new ConfirmedFieldRequest("judgingFormat", true), leader);
        briefService.confirmBrief(room.getId(), new ConfirmBriefRequest(true), leader);

        IdeaDto idea = ideasService.createIdea(room.getId(), new PostIdeaRequest("Smart hackathon assistant", List.of(), List.of()), leader);
        ideasService.approveIdea(room.getId(), UUID.fromString(idea.id()), leader);
        ideasService.setPrimaryIdea(room.getId(), UUID.fromString(idea.id()), leader);
        ideasService.markIdeationDone(room.getId(), leader);

        // 1. Step ordering check: validating step 'tech' before 'prd' throws STEP_ORDER
        assertThrows(ConflictException.class, () ->
                planService.validateStep(room.getId(), new ValidatePlanRequest("tech", readSample("tech-good.md")), leader));

        // 2. Validate all 5 steps in order
        var prdRes = planService.validateStep(room.getId(), new ValidatePlanRequest("prd", readSample("prd-good.md")), leader);
        assertTrue(prdRes.valid());
        assertEquals("tech", prdRes.nextStepKey());

        var techRes = planService.validateStep(room.getId(), new ValidatePlanRequest("tech", readSample("tech-good.md")), leader);
        assertTrue(techRes.valid());
        assertEquals("phases", techRes.nextStepKey());

        var phasesRes = planService.validateStep(room.getId(), new ValidatePlanRequest("phases", readSample("phases-good.json")), leader);
        assertTrue(phasesRes.valid());
        assertEquals("tasks", phasesRes.nextStepKey());

        var tasksRes = planService.validateStep(room.getId(), new ValidatePlanRequest("tasks", readSample("tasks-good.json")), leader);
        assertTrue(tasksRes.valid());
        assertEquals("demo", tasksRes.nextStepKey());

        var demoRes = planService.validateStep(room.getId(), new ValidatePlanRequest("demo", readSample("demo-good.md")), leader);
        assertTrue(demoRes.valid());
        assertTrue(demoRes.planComplete());
        assertNotNull(demoRes.completion());

        // 3. Verify PlanCompletionService generated the 9 docs cleanly
        DocListResponseDto docList = docService.listDocs(room.getId(), leader);
        assertEquals(10, docList.items().size(), "Must generate 10 docs: PRD, MVP, PROBLEM, CUT_LIST, RISKS, TECH_STACK, PHASES, DEMO_SCRIPT, QA, DECISIONS");

        for (var item : docList.items()) {
            var docDetail = docService.getDocByFileName(room.getId(), item.fileName(), leader);
            assertFalse(docDetail.content().contains("TODO"), "Generated doc should not have placeholder TODO: " + item.fileName());
            assertTrue(docDetail.content().contains("Generated from the plan on"), "Must have header line in " + item.fileName());
        }

        // 4. Verify tasks generated with formatted keys and assignments
        List<Task> tasks = taskRepository.findByRoomIdOrderByPositionAsc(room.getId());
        assertFalse(tasks.isEmpty());
        for (Task t : tasks) {
            assertTrue(t.getTaskKey().startsWith(room.getKeyPrefix() + "-"));
            assertNotNull(t.getDueAt());
        }

        // 5. Enter build phase
        planService.enterBuild(room.getId(), leader);
        Room buildRoom = roomRepository.findById(room.getId()).orElseThrow();
        assertEquals("build", buildRoom.getStage());
        assertNotNull(buildRoom.getBuildStartedAt());

        // 6. After build started, plan steps are locked
        assertThrows(ConflictException.class, () ->
                planService.saveStepDraft(room.getId(), "prd", new SaveStepRequest("New answer", false), leader));
    }
}
