package com.hackathonos.backend.e2e;

import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRepository;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.ideas.IdeaRepository;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.overview.OverviewService;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.rooms.dto.RoomDetailDto;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UserStoryIntegrationTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private OverviewService overviewService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomMemberRepository memberRepository;

    @Autowired
    private BriefRepository briefRepository;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    private User leader;
    private User builder;

    @BeforeEach
    void setUp() {
        leader = userRepository.save(new User("DEV", "lead-story", "Aria Stark", "aria@story.com", null, null));
        builder = userRepository.save(new User("DEV", "build-story", "Bran Stark", "bran@story.com", null, null));

        if (!templateRepository.existsById("48h-hackathon")) {
            templateRepository.save(new EventTemplate("48h-hackathon", "Campus 48h", "desc", 48, 2, 4, "clock", 1, "[]"));
        }
    }

    @Test
    @DisplayName("End-to-End User Story: Room creation -> Team join -> Brief -> Ideas -> Build -> Task completion -> Overview vitals")
    void testCompleteUserStoryJourney() {
        // Step 1: Leader creates room
        RoomDetailDto roomDto = roomService.createRoom(leader, new CreateRoomRequest(
                "Winterfell OS", "AI autonomous project", "Platform", "48h-hackathon", Instant.now().toString(), "UTC"
        ));
        UUID roomId = roomDto.id();
        assertThat(roomDto.stage()).isEqualTo("brief");

        // Step 2: Teammate joins
        RoomMember builderMember = memberRepository.save(new RoomMember(roomId, builder.getId(), "BUILDER"));
        assertThat(builderMember.getRole()).isEqualTo("BUILDER");

        // Step 3: Brief definition and confirmation
        Brief brief = new Brief(roomId, "manual");
        brief.setProblemStatement("Fragmented tools cause teams to miss hackathon submission deadlines.");
        brief.setConfirmed(true);
        brief.setConfirmedBy(leader.getId());
        brief.setConfirmedAt(Instant.now());
        briefRepository.save(brief);

        // Advance to Ideate
        Room room = roomRepository.findById(roomId).orElseThrow();
        room.setBriefDone(true);
        room.setStage("ideate");
        roomRepository.save(room);

        // Step 4: Brainstorm ideas & select primary
        Idea idea = new Idea(roomId, leader.getId(), "Unified Real-Time Hackathon Operating System");
        idea.setStatus("APPROVED");
        idea.setPrimary(true);
        ideaRepository.save(idea);

        // Advance to Build
        room.setIdeateDone(true);
        room.setPlanDone(true);
        room.setStage("build");
        room.setBuildStartedAt(Instant.now());
        roomRepository.save(room);

        // Step 5: Create and progress execution tasks
        Task task1 = new Task(
                roomId, "WIN-1", 1, "Setup PostgreSQL database", "Core storage layer",
                "DONE", builder.getId(), leader.getId(), "HIGHEST", null, "Backend", 60,
                Instant.now().plus(6, ChronoUnit.HOURS), 0, "PLAN"
        );
        task1.setCompletedAt(Instant.now());
        taskRepository.save(task1);

        Task task2 = new Task(
                roomId, "WIN-2", 2, "Implement Pitch Rehearsal Studio", "Rehearsal timing",
                "IN_PROGRESS", builder.getId(), leader.getId(), "HIGH", null, "Frontend", 90,
                Instant.now().plus(12, ChronoUnit.HOURS), 1, "PLAN"
        );
        taskRepository.save(task2);

        // Step 6: Query Overview service and verify overview object is created
        Object overview = overviewService.getOverview(roomId, leader);
        assertThat(overview).isNotNull();
    }
}
