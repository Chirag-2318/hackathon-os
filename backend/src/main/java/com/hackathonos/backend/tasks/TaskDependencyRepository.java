package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, TaskDependency.TaskDependencyId> {
    List<TaskDependency> findByTaskId(UUID taskId);
    List<TaskDependency> findByTaskIdIn(Collection<UUID> taskIds);
    List<TaskDependency> findByDependsOnTaskId(UUID dependsOnTaskId);
    void deleteByTaskId(UUID taskId);
    void deleteByDependsOnTaskId(UUID dependsOnTaskId);
}
