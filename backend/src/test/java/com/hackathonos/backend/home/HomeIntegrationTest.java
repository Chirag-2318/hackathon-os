package com.hackathonos.backend.home;

import com.hackathonos.backend.common.error.AccountDeletedException;
import com.hackathonos.backend.common.error.UnauthenticatedException;
import com.hackathonos.backend.home.HomeDtos.HomeResponseDto;
import com.hackathonos.backend.members.RoomInvitation;
import com.hackathonos.backend.members.RoomInvitationRepository;
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
import com.hackathonos.backend.users.UserSettingsRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class HomeIntegrationTest {

    @Autowired
    private HomeController homeController;

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomInvitationRepository invitationRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    private User testUser;
    private EventTemplate testTemplate;

    @BeforeEach
    void setUp() {
        testTemplate = templateRepository.findById("online-48h")
                .orElseGet(() -> templateRepository.findAll().get(0));

        testUser = userRepository.save(new User(
                "GITHUB", "gh-9999", "Home Tester", "hometester@test.com", "https://avatar.test/1", "hometester"
        ));

        setAuthenticatedUser(testUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(User user) {
        Map<String, Object> attributes = Map.of(
                "id", user.getProviderUserId(),
                "login", user.getLogin() != null ? user.getLogin() : "user",
                "name", user.getName(),
                "email", user.getEmail() != null ? user.getEmail() : "user@test.com"
        );
        OAuth2User principal = new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "id"
        );
        OAuth2AuthenticationToken token = new OAuth2AuthenticationToken(
                principal,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                "github"
        );
        SecurityContextHolder.getContext().setAuthentication(token);
    }

    private RoomDetailDto createTestRoom(String name) {
        CreateRoomRequest request = new CreateRoomRequest(
                name, "Test room description", "Project target", testTemplate.getId(),
                Instant.now().plusSeconds(172800).toString(), "Asia/Kolkata"
        );
        return roomService.createRoom(testUser, request);
    }

    @Test
    @DisplayName("GET /api/v1/home for user with no rooms returns empty room cards and selected = null")
    void testUserWithNoRooms() {
        HomeResponseDto response = homeController.getHome(null);

        assertThat(response).isNotNull();
        assertThat(response.user()).isNotNull();
        assertThat(response.user().firstName()).isEqualTo("Home");
        assertThat(response.rooms()).isEmpty();
        assertThat(response.selected()).isNull();
    }

    @Test
    @DisplayName("GET /api/v1/home for user with a planning room returns planning room details")
    void testUserWithPlanningRoom() {
        RoomDetailDto roomDto = createTestRoom("Planning Room");

        HomeResponseDto response = homeController.getHome(null);

        assertThat(response.rooms()).hasSize(1);
        assertThat(response.selected()).isNotNull();
        assertThat(response.selected().roomId()).isEqualTo(roomDto.id());
        assertThat(response.selected().variant()).isEqualTo("planning");
    }

    @Test
    @DisplayName("GET /api/v1/home for user with a build room returns build room details")
    void testUserWithBuildRoom() {
        RoomDetailDto roomDto = createTestRoom("Build Room");
        Room room = roomRepository.findById(roomDto.id()).orElseThrow();
        room.setBuildStartedAt(Instant.now());
        room.setStage("build");
        roomRepository.save(room);

        HomeResponseDto response = homeController.getHome(null);

        assertThat(response.rooms()).hasSize(1);
        assertThat(response.selected()).isNotNull();
        assertThat(response.selected().roomId()).isEqualTo(roomDto.id());
        assertThat(response.selected().variant()).isEqualTo("build");
    }

    @Test
    @DisplayName("GET /api/v1/home for room with pending invitations does not fail with NullPointerException")
    void testRoomWithPendingInvitations() {
        RoomDetailDto roomDto = createTestRoom("Room With Invites");

        invitationRepository.save(new RoomInvitation(
                roomDto.id(), "pending-invitee@test.com", "BUILDER", testUser.getId()
        ));

        HomeResponseDto response = homeController.getHome(null);

        assertThat(response).isNotNull();
        assertThat(response.selected()).isNotNull();
        assertThat(response.selected().roomId()).isEqualTo(roomDto.id());
    }

    @Test
    @DisplayName("GET /api/v1/home for room with unassigned tasks does not fail with NullPointerException")
    void testRoomWithUnassignedTasks() {
        RoomDetailDto roomDto = createTestRoom("Room With Tasks");

        // Add task with no assignee
        Task unassignedTask = new Task(
                roomDto.id(), "CG-1", 1, "Unassigned Task", "desc", "TODO",
                null, testUser.getId(), "MEDIUM", null, "Frontend", 60, null, 0, "PLAN"
        );
        taskRepository.save(unassignedTask);

        // Add task assigned to current user
        Task myTask = new Task(
                roomDto.id(), "CG-2", 2, "My Assigned Task", "desc", "IN_PROGRESS",
                testUser.getId(), testUser.getId(), "HIGH", null, "Frontend", 60, null, 1, "PLAN"
        );
        taskRepository.save(myTask);

        HomeResponseDto response = homeController.getHome(null);

        assertThat(response).isNotNull();
        assertThat(response.selected()).isNotNull();
        assertThat(response.selected().myTasks()).isNotNull();
        assertThat(response.selected().myTasks().openCount()).isEqualTo(1);
        assertThat(response.selected().myTasks().items()).hasSize(1);
        assertThat(response.selected().myTasks().items().get(0).key()).isEqualTo("CG-2");
    }

    @Test
    @DisplayName("Valid session whose users row was deleted self-heals by recreating user row and succeeds")
    void testValidSessionWhoseUserRowWasDeletedRecreatesRow() {
        String newProviderUserId = "gh-selfheal-8888";
        Map<String, Object> attributes = Map.of(
                "id", newProviderUserId,
                "login", "selfhealer",
                "name", "Self Healing User",
                "email", "selfheal@test.com"
        );
        OAuth2User principal = new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "id"
        );
        OAuth2AuthenticationToken token = new OAuth2AuthenticationToken(
                principal,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                "github"
        );
        SecurityContextHolder.getContext().setAuthentication(token);

        // Ensure DB row does not exist
        assertThat(userRepository.findByProviderAndProviderUserId("GITHUB", newProviderUserId)).isEmpty();

        // Call homeController.getHome
        HomeResponseDto response = homeController.getHome(null);

        // Assert success and that row was recreated
        assertThat(response).isNotNull();
        assertThat(response.user().firstName()).isEqualTo("Self");

        Optional<User> recreated = userRepository.findByProviderAndProviderUserId("GITHUB", newProviderUserId);
        assertThat(recreated).isPresent();
        assertThat(recreated.get().getEmail()).isEqualTo("selfheal@test.com");
        assertThat(userSettingsRepository.existsById(recreated.get().getId())).isTrue();
    }

    @Test
    @DisplayName("Authenticated request for deleted account throws AccountDeletedException (401)")
    void testDeletedAccountThrowsAccountDeletedException() {
        testUser.setDeletedAt(Instant.now());
        userRepository.save(testUser);

        assertThatThrownBy(() -> homeController.getHome(null))
                .isInstanceOf(AccountDeletedException.class)
                .hasMessageContaining("deleted");
    }

    @Test
    @DisplayName("Unauthenticated request throws UnauthenticatedException (401)")
    void testUnauthenticatedThrowsUnauthenticatedException() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> homeController.getHome(null))
                .isInstanceOf(UnauthenticatedException.class)
                .hasMessageContaining("Authentication required");
    }
}
