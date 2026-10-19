package com.hackathonos.backend.pitchkit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QnaItemRepository extends JpaRepository<QnaItem, UUID> {

    List<QnaItem> findByRoomIdAndActiveOrderByPositionAsc(UUID roomId, boolean active);

    Optional<QnaItem> findByRoomIdAndHash(UUID roomId, String hash);

    Optional<QnaItem> findByRoomIdAndId(UUID roomId, UUID id);

    long countByRoomIdAndActive(UUID roomId, boolean active);

    @Modifying
    @Query("UPDATE QnaItem q SET q.active = false WHERE q.roomId = :roomId AND q.source = 'DOC'")
    void markDocItemsInactive(@Param("roomId") UUID roomId);
}
