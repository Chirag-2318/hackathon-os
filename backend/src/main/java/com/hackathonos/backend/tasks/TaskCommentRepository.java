package com.hackathonos.backend.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
    List<TaskComment> findByTaskIdInOrderByCreatedAtAsc(Collection<UUID> taskIds);
    long countByTaskId(UUID taskId);
    long countByAuthorId(UUID authorId);
    List<TaskComment> findByAuthorId(UUID authorId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE TaskComment tc SET tc.authorId = null WHERE tc.authorId = :authorId")
    void anonymizeByAuthorId(@org.springframework.data.repository.query.Param("authorId") UUID authorId);

    void deleteByTaskId(UUID taskId);
}
