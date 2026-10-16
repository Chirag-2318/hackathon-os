package com.hackathonos.backend.docs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocVersionRepository extends JpaRepository<DocVersion, UUID> {
    List<DocVersion> findByDocIdOrderByVersionDesc(UUID docId);
    List<DocVersion> findByDocIdInOrderByVersionDesc(Collection<UUID> docIds);
    Optional<DocVersion> findByDocIdAndVersion(UUID docId, int version);
    long countByCreatedBy(UUID createdBy);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE DocVersion dv SET dv.createdBy = null WHERE dv.createdBy = :createdBy")
    void anonymizeByCreatedBy(@org.springframework.data.repository.query.Param("createdBy") UUID createdBy);

    void deleteByDocId(UUID docId);
}
