package com.hackathonos.backend.ideas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdeaRepository extends JpaRepository<Idea, UUID> {
    List<Idea> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    List<Idea> findByRoomIdAndStatusOrderByCreatedAtDesc(UUID roomId, String status);
    Optional<Idea> findByIdAndRoomId(UUID id, UUID roomId);
    Optional<Idea> findByRoomIdAndPrimaryTrue(UUID roomId);
    long countByRoomId(UUID roomId);
    long countByRoomIdAndStatus(UUID roomId, String status);

    @Modifying
    @Query("UPDATE Idea i SET i.primary = false WHERE i.roomId = :roomId")
    void clearPrimaryForRoom(@Param("roomId") UUID roomId);
}
