package com.hackathonos.backend.rooms;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    Optional<Room> findByIdAndArchivedAtIsNull(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id AND r.archivedAt IS NULL")
    Optional<Room> findWithLockById(@Param("id") UUID id);

    Optional<Room> findByJoinCodeIgnoreCaseAndArchivedAtIsNull(String joinCode);

    boolean existsByJoinCodeIgnoreCase(String joinCode);

    // Loads active non-archived rooms where the user is an active member, newest first
    @Query("""
        SELECT r FROM Room r
        JOIN RoomMember rm ON rm.roomId = r.id
        WHERE rm.userId = :userId
          AND r.archivedAt IS NULL
        ORDER BY r.createdAt DESC
    """)
    List<Room> findActiveRoomsByMemberUserId(@Param("userId") UUID userId);

    // Finds rooms owned by the given user
    List<Room> findByOwnerId(UUID ownerId);

    long countByOwnerId(UUID ownerId);

    long countByDeletedAtIsNull();

    long countByOwnerIdAndCreatedAtGreaterThanEqual(UUID ownerId, java.time.Instant since);

    List<Room> findByDeletedAtBefore(java.time.Instant before);

    @Query("""
        SELECT COUNT(r) FROM Room r
        JOIN RoomMember rm ON rm.roomId = r.id
        WHERE rm.userId = :userId
          AND r.submittedAt IS NOT NULL
    """)
    long countSubmittedRoomsByUserId(@Param("userId") UUID userId);
}
