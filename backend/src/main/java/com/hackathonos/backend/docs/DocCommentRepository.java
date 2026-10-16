package com.hackathonos.backend.docs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocCommentRepository extends JpaRepository<DocComment, UUID> {
    List<DocComment> findByDocIdOrderByCreatedAtAsc(UUID docId);
    long countByAuthorId(UUID authorId);
    List<DocComment> findByAuthorId(UUID authorId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE DocComment dc SET dc.authorId = null WHERE dc.authorId = :authorId")
    void anonymizeByAuthorId(@org.springframework.data.repository.query.Param("authorId") UUID authorId);

    void deleteByDocId(UUID docId);
}
