package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, UUID> {
    List<Subtask> findByTaskIdOrderByPositionAsc(UUID taskId);
    List<Subtask> findByTaskIdInOrderByPositionAsc(Collection<UUID> taskIds);
    void deleteByTaskId(UUID taskId);
}
