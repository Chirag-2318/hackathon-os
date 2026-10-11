package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {
    List<TaskHistory> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
    List<TaskHistory> findByTaskIdOrderByCreatedAtDesc(UUID taskId);
    List<TaskHistory> findByTaskIdInOrderByCreatedAtAsc(Collection<UUID> taskIds);
    void deleteByTaskId(UUID taskId);
}
