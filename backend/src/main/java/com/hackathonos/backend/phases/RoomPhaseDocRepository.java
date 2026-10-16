package com.hackathonos.backend.phases;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomPhaseDocRepository extends JpaRepository<RoomPhaseDoc, UUID> {
    List<RoomPhaseDoc> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
    List<RoomPhaseDoc> findByRoomIdAndPhaseKey(UUID roomId, String phaseKey);
    Optional<RoomPhaseDoc> findByRoomIdAndPhaseKeyAndDocId(UUID roomId, String phaseKey, UUID docId);
    void deleteByRoomId(UUID roomId);
}
