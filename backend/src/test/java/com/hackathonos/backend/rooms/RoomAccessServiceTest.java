package com.hackathonos.backend.rooms;

import com.hackathonos.backend.common.error.ForbiddenException;
import com.hackathonos.backend.common.error.NotFoundException;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.users.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomAccessServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomMemberRepository memberRepository;

    private RoomAccessService roomAccessService;

    private UUID roomId;
    private UUID ownerId;
    private UUID leaderId;
    private UUID memberId;
    private UUID nonMemberId;
    private Room room;

    @BeforeEach
    void setUp() {
        roomAccessService = new RoomAccessService(roomRepository, memberRepository);

        roomId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        leaderId = UUID.randomUUID();
        memberId = UUID.randomUUID();
        nonMemberId = UUID.randomUUID();

        room = new Room();
        room.setId(roomId);
        room.setOwnerId(ownerId);
    }

    @Test
    @DisplayName("getActiveRoomOrThrow returns room when active")
    void testGetActiveRoomOrThrowSuccess() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        Room result = roomAccessService.getActiveRoomOrThrow(roomId);
        assertThat(result).isSameAs(room);
    }

    @Test
    @DisplayName("getActiveRoomOrThrow throws NotFoundException when room not found")
    void testGetActiveRoomOrThrowNotFound() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roomAccessService.getActiveRoomOrThrow(roomId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Room not found");
    }

    @Test
    @DisplayName("getActiveRoomOrThrow throws NotFoundException when room is soft-deleted or archived")
    void testGetActiveRoomOrThrowArchivedOrDeleted() {
        room.setDeletedAt(Instant.now());
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> roomAccessService.getActiveRoomOrThrow(roomId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("archived");

        room.setDeletedAt(null);
        room.setArchivedAt(Instant.now());

        assertThatThrownBy(() -> roomAccessService.getActiveRoomOrThrow(roomId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("archived");
    }

    @Test
    @DisplayName("requireMember succeeds for room member and fails for non-member")
    void testRequireMember() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        RoomMember member = new RoomMember(roomId, memberId, "MEMBER");
        when(memberRepository.findByRoomIdAndUserId(roomId, memberId)).thenReturn(Optional.of(member));
        when(memberRepository.findByRoomIdAndUserId(roomId, nonMemberId)).thenReturn(Optional.empty());

        RoomMember resolved = roomAccessService.requireMember(roomId, memberId);
        assertThat(resolved).isSameAs(member);

        assertThatThrownBy(() -> roomAccessService.requireMember(roomId, nonMemberId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("requireLeader succeeds for room owner or LEADER role, fails for standard member")
    void testRequireLeader() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        // 1. Owner with any or no member role
        RoomMember ownerMember = new RoomMember(roomId, ownerId, "BUILDER");
        when(memberRepository.findByRoomIdAndUserId(roomId, ownerId)).thenReturn(Optional.of(ownerMember));
        RoomMember resolvedOwner = roomAccessService.requireLeader(roomId, ownerId);
        assertThat(resolvedOwner).isSameAs(ownerMember);

        // 2. Explicit LEADER role
        RoomMember leaderMember = new RoomMember(roomId, leaderId, "LEADER");
        when(memberRepository.findByRoomIdAndUserId(roomId, leaderId)).thenReturn(Optional.of(leaderMember));
        RoomMember resolvedLeader = roomAccessService.requireLeader(roomId, leaderId);
        assertThat(resolvedLeader).isSameAs(leaderMember);

        // 3. Regular MEMBER role without ownership
        RoomMember regularMember = new RoomMember(roomId, memberId, "MEMBER");
        when(memberRepository.findByRoomIdAndUserId(roomId, memberId)).thenReturn(Optional.of(regularMember));
        assertThatThrownBy(() -> roomAccessService.requireLeader(roomId, memberId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("leader can perform this action");
    }

    @Test
    @DisplayName("isMember and isLeader boolean helpers evaluate correctly")
    void testIsMemberAndIsLeader() {
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(memberRepository.existsByRoomIdAndUserId(roomId, memberId)).thenReturn(true);
        when(memberRepository.existsByRoomIdAndUserId(roomId, nonMemberId)).thenReturn(false);

        assertThat(roomAccessService.isMember(roomId, memberId)).isTrue();
        assertThat(roomAccessService.isMember(roomId, nonMemberId)).isFalse();

        // Owner is leader
        assertThat(roomAccessService.isLeader(roomId, ownerId)).isTrue();

        // Non-owner member
        RoomMember regularMember = new RoomMember(roomId, memberId, "MEMBER");
        when(memberRepository.findByRoomIdAndUserId(roomId, memberId)).thenReturn(Optional.of(regularMember));
        assertThat(roomAccessService.isLeader(roomId, memberId)).isFalse();

        // Non-owner leader
        RoomMember leaderMember = new RoomMember(roomId, leaderId, "LEADER");
        when(memberRepository.findByRoomIdAndUserId(roomId, leaderId)).thenReturn(Optional.of(leaderMember));
        assertThat(roomAccessService.isLeader(roomId, leaderId)).isTrue();
    }
}

