package com.hackathonos.backend.rooms;

import com.hackathonos.backend.members.MemberService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.dto.MemberItemDto;
import com.hackathonos.backend.members.dto.UpdateRoleRequest;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.rooms.dto.RoomDetailDto;
import com.hackathonos.backend.templates.EventTemplate;
import com.hackathonos.backend.templates.EventTemplateRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RoomIntegrationTest {

    @Autowired
    private RoomService roomService;

    @Autowired
    private MemberService memberService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    private User leaderUser;
    private User builderUser;
    private EventTemplate template;

    @BeforeEach
    void setUp() {
        leaderUser = userRepository.save(new User(
                "GITHUB", "gh-111", "Leader User", "leader@test.com", "leader-gh", "https://avatar.url/1"
        ));
        builderUser = userRepository.save(new User(
                "GITHUB", "gh-222", "Builder User", "builder@test.com", "builder-gh", "https://avatar.url/2"
        ));

        List<EventTemplate> templates = templateRepository.findAll();
        assertThat(templates).isNotEmpty();
        template = templates.get(0);
    }

    @Test
    void testRoomCreationAssignsLeaderRoleKeyPrefixAndUniqueJoinCode() {
        CreateRoomRequest request = new CreateRoomRequest(
                "Cyber Guardians",
                "A cool project",
                "Building security agent",
                template.getId(),
                Instant.now().plusSeconds(3600).toString(),
                "America/New_York"
        );

        RoomDetailDto roomDto = roomService.createRoom(leaderUser, request);

        assertThat(roomDto).isNotNull();
        assertThat(roomDto.name()).isEqualTo("Cyber Guardians");
        assertThat(roomDto.myRole()).isEqualTo("LEADER");
        assertThat(roomDto.isLeader()).isTrue();
        assertThat(roomDto.keyPrefix()).isEqualTo("CG");
        assertThat(roomDto.joinCode()).isNotNull().hasSize(4);

        // Verify database persistence
        Room savedRoom = roomRepository.findById(roomDto.id()).orElseThrow();
        assertThat(savedRoom.getKeyPrefix()).isEqualTo("CG");
        assertThat(savedRoom.getJoinCode()).isEqualTo(roomDto.joinCode());

        List<RoomMember> members = memberRepository.findByRoomId(roomDto.id());
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getUserId()).isEqualTo(leaderUser.getId());
        assertThat(members.get(0).getRole()).isEqualTo("LEADER");
    }

    @Test
    void testLeadershipTransferUpdatesRolesAndRoomOwnerAtomically() {
        CreateRoomRequest request = new CreateRoomRequest(
                "Alpha Hackathon",
                "Alpha description",
                null,
                template.getId(),
                Instant.now().plusSeconds(1800).toString(),
                "UTC"
        );
        RoomDetailDto roomDto = roomService.createRoom(leaderUser, request);

        // Add second user as member
        RoomMember builderMember = memberRepository.save(new RoomMember(roomDto.id(), builderUser.getId(), "BUILDER"));

        // Transfer leadership to builderUser
        MemberItemDto updatedMember = memberService.updateRole(
                leaderUser,
                roomDto.id(),
                builderUser.getId(),
                new UpdateRoleRequest("LEADER")
        );

        assertThat(updatedMember.role()).isEqualTo("LEADER");

        // Verify in DB that old leader is now BUILDER and target is LEADER
        RoomMember oldLeader = memberRepository.findByRoomIdAndUserId(roomDto.id(), leaderUser.getId()).orElseThrow();
        RoomMember newLeader = memberRepository.findByRoomIdAndUserId(roomDto.id(), builderUser.getId()).orElseThrow();
        Room updatedRoom = roomRepository.findById(roomDto.id()).orElseThrow();

        assertThat(oldLeader.getRole()).isEqualTo("BUILDER");
        assertThat(newLeader.getRole()).isEqualTo("LEADER");
        assertThat(updatedRoom.getOwnerId()).isEqualTo(builderUser.getId());
    }
}
