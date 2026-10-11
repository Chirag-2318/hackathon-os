package com.hackathonos.backend.notifications;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    long countByUserIdAndReadAtIsNull(UUID userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Notification> findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Notification> findByUserIdAndCreatedAtLessThanOrderByCreatedAtDesc(UUID userId, Instant createdAt, Pageable pageable);

    List<Notification> findByUserIdAndReadAtIsNullAndCreatedAtLessThanOrderByCreatedAtDesc(UUID userId, Instant createdAt, Pageable pageable);

    List<Notification> findByUserIdAndRoomIdOrderByCreatedAtDesc(UUID userId, UUID roomId);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllReadForUser(@Param("userId") UUID userId, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.roomId = :roomId AND n.readAt IS NULL")
    int markAllReadForUserAndRoom(@Param("userId") UUID userId, @Param("roomId") UUID roomId, @Param("now") Instant now);

    void deleteByUserId(UUID userId);
}
