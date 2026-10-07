package com.hackathonos.backend.room;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    List<RoomMember> findByRoomId(Long roomId);
    List<RoomMember> findByUserId(Long userId);
}
