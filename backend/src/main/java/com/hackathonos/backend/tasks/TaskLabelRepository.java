package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, TaskLabel.TaskLabelId> {
    List<TaskLabel> findByTaskId(UUID taskId);
    List<TaskLabel> findByTaskIdIn(Collection<UUID> taskIds);
    void deleteByTaskId(UUID taskId);
}
