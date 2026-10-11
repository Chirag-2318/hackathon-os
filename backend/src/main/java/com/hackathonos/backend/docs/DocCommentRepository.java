package com.hackathonos.backend.docs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocCommentRepository extends JpaRepository<DocComment, UUID> {
    List<DocComment> findByDocIdOrderByCreatedAtAsc(UUID docId);
    void deleteByDocId(UUID docId);
}
