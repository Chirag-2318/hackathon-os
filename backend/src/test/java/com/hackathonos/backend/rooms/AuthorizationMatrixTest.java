package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.security.RoomAccess;
import com.hackathonos.backend.members.MemberService;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.dto.UpdateRoleRequest;
import com.hackathonos.backend.rooms.dto.CreateRoomRequest;
import com.hackathonos.backend.rooms.dto.RoomDetailDto;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AuthorizationMatrixTest {

    @Autowired
    private RoomAccess roomAccess;

    @Autowired
    private RoomService roomService;

    @Autowired
    private MemberService memberService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomMemberRepository memberRepository;

    @Autowired
    private EventTemplateRepository templateRepository;

    private User leader;
    private User member;
    private User nonMember;
    private UUID roomId;
    private RoomMember leaderMember;
    private RoomMember memberRecord;

    @BeforeEach
    void setUp() {
        leader = userRepository.save(new User("DEV", "lead-auth", "Leader", "leader@auth.com", null, null));
        member = userRepository.save(new User("DEV", "mem-auth", "Member", "member@auth.com", null, null));
        nonMember = userRepository.save(new User("DEV", "non-auth", "NonMember", "non@auth.com", null, null));

        if (!templateRepository.existsById("48h-hackathon")) {
            templateRepository.save(new EventTemplate("48h-hackathon", "Campus 48h", "desc", 48, 2, 4, "clock", 1, "[]"));
        }

        RoomDetailDto roomDto = roomService.createRoom(leader, new CreateRoomRequest(
                "Auth Test Room", "desc", "project", "48h-hackathon", Instant.now().toString(), "UTC"
        ));
        roomId = roomDto.id();

        memberRecord = memberRepository.save(new RoomMember(roomId, member.getId(), "BUILDER"));
        leaderMember = memberRepository.findByRoomIdAndUserId(roomId, leader.getId()).orElseThrow();
    }

    @Test
    @DisplayName("Matrix: requireMember passes for leader and member, fails with 403 for non-member")
    void testRequireMemberMatrix() {
        RoomMember leadRes = roomAccess.requireMember(roomId, leader);
        assertThat(leadRes.getUserId()).isEqualTo(leader.getId());

        RoomMember memRes = roomAccess.requireMember(roomId, member);
        assertThat(memRes.getUserId()).isEqualTo(member.getId());

        assertThatThrownBy(() -> roomAccess.requireMember(roomId, nonMember))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("Matrix: requireLeader passes only for leader, fails for member and non-member")
    void testRequireLeaderMatrix() {
        RoomMember leadRes = roomAccess.requireLeader(roomId, leader);
        assertThat(leadRes.getRole()).isEqualTo("LEADER");

        assertThatThrownBy(() -> roomAccess.requireLeader(roomId, member))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the room leader");

        assertThatThrownBy(() -> roomAccess.requireLeader(roomId, nonMember))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Matrix: Leader can update roles, but non-leader is forbidden")
    void testRoleUpdatePermissions() {
        memberService.updateRole(leader, roomId, member.getId(), new UpdateRoleRequest("DESIGNER"));

        RoomMember updated = memberRepository.findById(memberRecord.getId()).orElseThrow();
        assertThat(updated.getRole()).isEqualTo("DESIGNER");

        assertThatThrownBy(() -> memberService.updateRole(member, roomId, leader.getId(), new UpdateRoleRequest("QA")))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Matrix: Leader can archive room, but regular member is forbidden")
    void testArchiveRoomPermissions() {
        assertThatThrownBy(() -> roomService.archiveRoom(member, roomId))
                .isInstanceOf(ForbiddenException.class);

        roomService.archiveRoom(leader, roomId);
        assertThatThrownBy(() -> roomService.getRoomDetail(leader, roomId))
                .isInstanceOf(Exception.class);
    }
}
