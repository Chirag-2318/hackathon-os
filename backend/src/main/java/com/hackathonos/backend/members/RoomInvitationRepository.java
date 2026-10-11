package com.hackathonos.backend.members;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomInvitationRepository extends JpaRepository<RoomInvitation, UUID> {
    List<RoomInvitation> findByRoomIdAndStatus(UUID roomId, String status);
    Optional<RoomInvitation> findByIdAndRoomId(UUID id, UUID roomId);
    Optional<RoomInvitation> findFirstByRoomIdAndInviteeTextIgnoreCaseAndStatus(UUID roomId, String inviteeText, String status);
    void deleteByRoomId(UUID roomId);
}
