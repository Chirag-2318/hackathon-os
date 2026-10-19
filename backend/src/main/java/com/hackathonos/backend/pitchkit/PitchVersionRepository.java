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
public interface PitchVersionRepository extends JpaRepository<PitchVersion, UUID> {

    List<PitchVersion> findByRoomIdOrderByVersionDesc(UUID roomId);

    Optional<PitchVersion> findByRoomIdAndVersion(UUID roomId, int version);

    @Modifying
    @Query(value = "DELETE FROM pitch_versions WHERE room_id = :roomId AND id NOT IN (" +
            "SELECT id FROM pitch_versions WHERE room_id = :roomId ORDER BY version DESC LIMIT :limitCount" +
            ")", nativeQuery = true)
    void pruneOlderVersions(@Param("roomId") UUID roomId, @Param("limitCount") int limitCount);
}
