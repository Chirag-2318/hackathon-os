package com.hackathonos.backend.errors;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClientErrorRepository extends JpaRepository<ClientError, UUID> {

    @Query("SELECT e FROM ClientError e WHERE e.message = :message AND (:route IS NULL OR e.route = :route) AND e.lastSeenAt >= :since ORDER BY e.lastSeenAt DESC")
    List<ClientError> findRecentMatching(
            @Param("message") String message,
            @Param("route") String route,
            @Param("since") Instant since,
            Pageable pageable
    );
}
