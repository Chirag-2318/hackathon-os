package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByRoomIdOrderByPositionAsc(UUID roomId);
    List<Task> findByRoomIdAndStatusOrderByPositionAsc(UUID roomId, String status);
    List<Task> findByRoomIdAndSource(UUID roomId, String source);
    Optional<Task> findByRoomIdAndTaskKey(UUID roomId, String taskKey);
    Optional<Task> findByIdAndRoomId(UUID id, UUID roomId);
    List<Task> findByRoomId(UUID roomId);
    List<Task> findByRoomIdIn(java.util.Collection<UUID> roomIds);
    List<Task> findByRoomIdAndAssigneeId(UUID roomId, UUID assigneeId);
    List<Task> findByAssigneeId(UUID assigneeId);
    List<Task> findByRoomIdAndFlaggedTrueAndStatusNot(UUID roomId, String status);
    List<Task> findByRoomIdAndStatusNot(UUID roomId, String status);
    List<Task> findByRoomIdAndPhaseId(UUID roomId, UUID phaseId);
    List<Task> findByRoomIdAndPhaseKey(UUID roomId, String phaseKey);

    List<Task> findByStatusNotAndDueAtBetween(String status, Instant start, Instant end);

    long countByRoomId(UUID roomId);
    long countByRoomIdAndStatus(UUID roomId, String status);
    long countByRoomIdAndStatusNot(UUID roomId, String status);
    long countByRoomIdAndAssigneeIdAndStatusNot(UUID roomId, UUID assigneeId, String status);
    long countByRoomIdAndFlaggedTrueAndStatusNot(UUID roomId, String status);
    long countByRoomIdAndAssigneeIdIsNullAndStatusNot(UUID roomId, String status);
    long countByAssigneeIdAndConfirmedAtIsNotNull(UUID assigneeId);

    @Modifying
    @Query("DELETE FROM Task t WHERE t.roomId = :roomId AND t.source = 'PLAN'")
    void deletePlanTasksForRoom(@Param("roomId") UUID roomId);

    long countByReporterIdOrAssigneeId(UUID reporterId, UUID assigneeId);
    List<Task> findByReporterIdOrAssigneeId(UUID reporterId, UUID assigneeId);

    @Modifying
    @Query("UPDATE Task t SET t.assigneeId = null WHERE t.assigneeId = :userId")
    void unassignUser(@Param("userId") UUID userId);

    void deleteByRoomId(UUID roomId);
}
