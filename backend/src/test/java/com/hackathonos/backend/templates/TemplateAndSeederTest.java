package com.hackathonos.backend.templates;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.common.error.ApiExceptionHandler;
import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.dev.DemoRoomSeeder;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomController;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.rooms.RoomService;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TemplateAndSeederTest {

    @Autowired
    private EventTemplateRepository templateRepository;

    @Autowired
    private DemoRoomSeeder demoRoomSeeder;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApiExceptionHandler apiExceptionHandler;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(new User(
                "GITHUB", "gh-template-user", "Template User", "template@example.com", "templateuser", "https://avatar.url/t"
        ));

        CurrentUser currentUser = mock(CurrentUser.class);
        when(currentUser.get()).thenReturn(testUser);

        RoomController roomController = new RoomController(roomService, currentUser);
        mockMvc = MockMvcBuilders
                .standaloneSetup(roomController)
                .setControllerAdvice(apiExceptionHandler)
                .build();
    }

    @Test
    void testSeedMigrationCreatesAllSixExpectedTemplateIds() {
        List<String> expectedSlugs = List.of(
                "sih-36h", "online-48h", "weekend-mlh", "ai-sprint-4h", "corporate", "solo"
        );

        for (String slug : expectedSlugs) {
            assertThat(templateRepository.existsById(slug))
                    .as("Template slug '%s' must exist in database", slug)
                    .isTrue();
        }
    }

    @Test
    void testDemoRoomSeederWorksAgainstRealTemplate() {
        Map<String, Object> result = demoRoomSeeder.seedDemoRoom(testUser);

        assertThat(result).isNotNull();
        assertThat(result.get("id")).isNotNull();
        UUID roomId = UUID.fromString((String) result.get("id"));

        Room seededRoom = roomRepository.findById(roomId).orElseThrow();
        assertThat(seededRoom.getName()).isEqualTo("Campus Build Sprint 2026");
        assertThat(seededRoom.getTemplateId()).isEqualTo("online-48h");
    }

    @Test
    void testCreateRoomWithTplCampusReturnsBadRequestWithFieldError() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                "Tpl Campus Test Room",
                "Description",
                "Project description",
                "tpl-campus",
                null,
                "UTC"
        );

        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_TEMPLATE"))
                .andExpect(jsonPath("$.fieldErrors.templateId").value("Unknown event template"))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }

    @Test
    void testCreateRoomWithOnline48hSucceeds() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                "Online 48h Room",
                "Description",
                "Project description",
                "online-48h",
                null,
                "UTC"
        );

        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Online 48h Room"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }
}
