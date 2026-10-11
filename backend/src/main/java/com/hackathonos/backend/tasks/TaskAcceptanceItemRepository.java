package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskAcceptanceItemRepository extends JpaRepository<TaskAcceptanceItem, UUID> {
    List<TaskAcceptanceItem> findByTaskIdOrderByPositionAsc(UUID taskId);
    List<TaskAcceptanceItem> findByTaskIdInOrderByPositionAsc(Collection<UUID> taskIds);
    void deleteByTaskId(UUID taskId);
}
