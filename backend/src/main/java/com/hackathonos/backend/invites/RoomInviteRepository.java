package com.hackathonos.backend.invites;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomInviteRepository extends JpaRepository<RoomInvite, UUID> {

    Optional<RoomInvite> findByTokenHash(String tokenHash);

    Optional<RoomInvite> findFirstByRoomIdAndEmailNormalizedAndStatus(UUID roomId, String emailNormalized, String status);

    Optional<RoomInvite> findByIdAndRoomId(UUID id, UUID roomId);

    long countByRoomIdAndStatus(UUID roomId, String status);

    long countByInvitedByAndCreatedAtGreaterThanEqual(UUID invitedBy, Instant since);

    @Query("SELECT r FROM RoomInvite r WHERE r.roomId = :roomId AND (r.status = 'PENDING' OR (r.status = 'EXPIRED' AND r.expiresAt >= :recentCutoff)) ORDER BY r.createdAt DESC")
    List<RoomInvite> findPendingAndRecentlyExpired(
            @Param("roomId") UUID roomId,
            @Param("recentCutoff") Instant recentCutoff
    );

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE RoomInvite r SET r.status = 'REVOKED' WHERE r.invitedBy = :userId AND r.status = 'PENDING'")
    void revokePendingByInvitedBy(@Param("userId") UUID userId);

    void deleteByRoomId(UUID roomId);
}
