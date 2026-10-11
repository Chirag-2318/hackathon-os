package com.hackathonos.backend.retro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RetroItemRepository extends JpaRepository<RetroItem, UUID> {
    List<RetroItem> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
    List<RetroItem> findByRoomIdAndKindOrderByCreatedAtAsc(UUID roomId, String kind);
    void deleteByRoomId(UUID roomId);
}
