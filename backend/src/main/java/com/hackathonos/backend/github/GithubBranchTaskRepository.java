package com.hackathonos.backend.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GithubBranchTaskRepository extends JpaRepository<GithubBranchTask, GithubBranchTask.GithubBranchTaskId> {
    List<GithubBranchTask> findByBranchId(UUID branchId);
    List<GithubBranchTask> findByTaskId(UUID taskId);
    List<GithubBranchTask> findByTaskIdIn(java.util.Collection<UUID> taskIds);
    void deleteByBranchId(UUID branchId);
}
