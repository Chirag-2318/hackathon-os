package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "task_dependencies")
@IdClass(TaskDependency.TaskDependencyId.class)
public class TaskDependency {

    @Id
    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Id
    @Column(name = "depends_on_task_id", nullable = false)
    private UUID dependsOnTaskId;

    public TaskDependency() {}

    public TaskDependency(UUID taskId, UUID dependsOnTaskId) {
        this.taskId = taskId;
        this.dependsOnTaskId = dependsOnTaskId;
    }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public UUID getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(UUID dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }

    public static class TaskDependencyId implements Serializable {
        private UUID taskId;
        private UUID dependsOnTaskId;

        public TaskDependencyId() {}
        public TaskDependencyId(UUID taskId, UUID dependsOnTaskId) {
            this.taskId = taskId;
            this.dependsOnTaskId = dependsOnTaskId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TaskDependencyId that = (TaskDependencyId) o;
            return Objects.equals(taskId, that.taskId) && Objects.equals(dependsOnTaskId, that.dependsOnTaskId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(taskId, dependsOnTaskId);
        }
    }
}
