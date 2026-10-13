package com.hackathonos.backend.hackathons;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HackathonRepository extends JpaRepository<Hackathon, UUID> {

    Optional<Hackathon> findByUrl(String url);

    @Query("SELECT h FROM Hackathon h WHERE h.active = true " +
           "AND h.startsAt <= :now AND h.endsAt > :now " +
           "AND (h.registrationDeadline IS NULL OR h.registrationDeadline > :now) " +
           "AND (h.verifiedAt IS NULL OR h.verifiedAt >= :verifiedAfter) " +
           "ORDER BY h.endsAt ASC")
    List<Hackathon> findLiveHackathons(
            @Param("now") Instant now,
            @Param("verifiedAfter") Instant verifiedAfter,
            Pageable pageable
    );
}
