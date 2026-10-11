package com.hackathonos.backend.users;

import com.hackathonos.backend.common.error.BadRequestException;
import com.hackathonos.backend.common.error.ConflictException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.rooms.RoomRepository;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.dto.DeleteAccountRequest;
import com.hackathonos.backend.users.dto.UpdateSettingsRequest;
import com.hackathonos.backend.users.dto.UserSettingsDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UserIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository memberRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    private User primaryUser;
    private User peerUser;
    private EventTemplate template;

    @BeforeEach
    void setUp() {
        primaryUser = userRepository.save(new User(
                "GITHUB", "usr-1", "Primary Tester", "primary@test.com", "primary-tester", "https://avatar.url/p"
        ));
        peerUser = userRepository.save(new User(
                "GOOGLE", "usr-2", "Peer Tester", "peer@test.com", null, "https://avatar.url/peer"
        ));

        List<EventTemplate> templates = templateRepository.findAll();
        assertThat(templates).isNotEmpty();
        template = templates.get(0);
    }

    @Test
    void testSettingsUpdateTimezoneValidation() {
        // Valid timezone
        UpdateSettingsRequest validReq = new UpdateSettingsRequest(
                "Primary Updated",
                "dark",
                "America/Los_Angeles",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        UserSettingsDto dto = userService.updateSettings(primaryUser, validReq);
        assertThat(dto.appearance().timezone()).isEqualTo("America/Los_Angeles");
        assertThat(dto.profile().displayName()).isEqualTo("Primary Updated");
        assertThat(dto.appearance().theme()).isEqualTo("dark");

        // Invalid timezone should fail
        UpdateSettingsRequest invalidReq = new UpdateSettingsRequest(
                null,
                null,
                "Mars/Olympus_Mons",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        assertThatThrownBy(() -> userService.updateSettings(primaryUser, invalidReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid timezone");
    }

    @Test
    void testAccountDeleteThrowsConflictWhenLeaderOfMultiMemberRoom() {
        Room room = roomRepository.save(new Room(
                "Team Alpha",
                "Multi member room",
                null,
                template.getId(),
                primaryUser.getId(),
                Instant.now(),
                Instant.now().plusSeconds(3600),
                "UTC",
                "TA",
                "C123"
        ));

        // Add primary user as LEADER and peerUser as BUILDER
        memberRepository.save(new RoomMember(room.getId(), primaryUser.getId(), "LEADER"));
        memberRepository.save(new RoomMember(room.getId(), peerUser.getId(), "BUILDER"));

        MockHttpServletRequest request = new MockHttpServletRequest();

        // Attempt account delete
        assertThatThrownBy(() -> userService.deleteAccount(primaryUser, new DeleteAccountRequest("DELETE"), request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Transfer leadership before deleting your account");
    }

    @Test
    void testAccountDeleteSucceedsWhenSoloLeader() {
        Room room = roomRepository.save(new Room(
                "Solo Room",
                "Single member room",
                null,
                template.getId(),
                primaryUser.getId(),
                Instant.now(),
                Instant.now().plusSeconds(3600),
                "UTC",
                "SR",
                "C567"
        ));

        memberRepository.save(new RoomMember(room.getId(), primaryUser.getId(), "LEADER"));

        MockHttpServletRequest request = new MockHttpServletRequest();
        userService.deleteAccount(primaryUser, new DeleteAccountRequest("DELETE"), request);

        // Room should be deleted and user anonymized
        assertThat(roomRepository.findById(room.getId())).isEmpty();
        User anonymized = userRepository.findById(primaryUser.getId()).orElseThrow();
        assertThat(anonymized.getName()).isEqualTo("Deleted user");
        assertThat(anonymized.getEmail()).isNull();
        assertThat(anonymized.getDeletedAt()).isNotNull();
    }
}
