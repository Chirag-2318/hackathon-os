package com.hackathonos.backend.tasks;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "task_labels")
@IdClass(TaskLabel.TaskLabelId.class)
public class TaskLabel {

    @Id
    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Id
    @Column(nullable = false, length = 50)
    private String label;

    public TaskLabel() {}

    public TaskLabel(UUID taskId, String label) {
        this.taskId = taskId;
        this.label = label;
    }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public static class TaskLabelId implements Serializable {
        private UUID taskId;
        private String label;

        public TaskLabelId() {}
        public TaskLabelId(UUID taskId, String label) {
            this.taskId = taskId;
            this.label = label;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            TaskLabelId that = (TaskLabelId) o;
            return Objects.equals(taskId, that.taskId) && Objects.equals(label, that.label);
        }

        @Override
        public int hashCode() {
            return Objects.hash(taskId, label);
        }
    }
}
