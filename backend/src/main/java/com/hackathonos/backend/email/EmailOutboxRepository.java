package com.hackathonos.backend.email;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, UUID> {

    Optional<EmailOutbox> findByDedupeKey(String dedupeKey);

    boolean existsByDedupeKey(String dedupeKey);

    List<EmailOutbox> findByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            EmailOutbox.Status status,
            Instant now,
            Pageable pageable
    );

    List<EmailOutbox> findByStatusAndNextAttemptAtLessThanEqualOrderByPriorityDescNextAttemptAtAsc(
            EmailOutbox.Status status,
            Instant now,
            Pageable pageable
    );

    long countByStatusAndSentAtGreaterThanEqual(EmailOutbox.Status status, Instant since);

    long countByToEmailIgnoreCaseAndStatusAndSentAtGreaterThanEqual(
            String toEmail,
            EmailOutbox.Status status,
            Instant since
    );

    @Query("SELECT COUNT(e) FROM EmailOutbox e WHERE e.dedupeKey LIKE CONCAT(:prefix, '%') AND e.createdAt >= :since")
    long countByDedupeKeyPrefixSince(@Param("prefix") String prefix, @Param("since") Instant since);

    @Query("SELECT e FROM EmailOutbox e WHERE e.toEmail = :toEmail AND e.template = :template AND e.status = :status AND e.dedupeKey LIKE CONCAT('coalesce:', :toEmail, ':', :roomId, '%') ORDER BY e.createdAt DESC")
    List<EmailOutbox> findPendingCoalesced(@Param("toEmail") String toEmail,
                                           @Param("roomId") UUID roomId,
                                           @Param("template") String template,
                                           @Param("status") EmailOutbox.Status status);

    long countByToEmailIgnoreCase(String toEmail);

    List<EmailOutbox> findByToEmailIgnoreCaseOrderByCreatedAtDesc(String toEmail);

    void deleteByToEmailIgnoreCase(String toEmail);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM EmailOutbox e WHERE e.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
