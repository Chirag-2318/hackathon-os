package com.hackathonos.backend.members;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {
    List<RoomMember> findByRoomId(UUID roomId);
    List<RoomMember> findByRoomIdIn(java.util.Collection<UUID> roomIds);
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);
    long countByRoomId(UUID roomId);
    Optional<RoomMember> findByRoomIdAndRole(UUID roomId, String role);
    List<RoomMember> findByUserId(UUID userId);
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
    void deleteByRoomId(UUID roomId);
    void deleteByUserId(UUID userId);
}
