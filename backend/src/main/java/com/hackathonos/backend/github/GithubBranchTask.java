package com.hackathonos.backend.github;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "github_branch_tasks")
@IdClass(GithubBranchTask.GithubBranchTaskId.class)
public class GithubBranchTask {

    @Id
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Id
    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    public GithubBranchTask() {}

    public GithubBranchTask(UUID branchId, UUID taskId) {
        this.branchId = branchId;
        this.taskId = taskId;
    }

    public UUID getBranchId() { return branchId; }
    public void setBranchId(UUID branchId) { this.branchId = branchId; }

    public UUID getTaskId() { return taskId; }
    public void setTaskId(UUID taskId) { this.taskId = taskId; }

    public static class GithubBranchTaskId implements Serializable {
        private UUID branchId;
        private UUID taskId;

        public GithubBranchTaskId() {}

        public GithubBranchTaskId(UUID branchId, UUID taskId) {
            this.branchId = branchId;
            this.taskId = taskId;
        }

        public UUID getBranchId() { return branchId; }
        public void setBranchId(UUID branchId) { this.branchId = branchId; }

        public UUID getTaskId() { return taskId; }
        public void setTaskId(UUID taskId) { this.taskId = taskId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof GithubBranchTaskId that)) return false;
            return Objects.equals(branchId, that.branchId) && Objects.equals(taskId, that.taskId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(branchId, taskId);
        }
    }
}
