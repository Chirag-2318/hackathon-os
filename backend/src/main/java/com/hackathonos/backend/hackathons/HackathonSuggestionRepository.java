package com.hackathonos.backend.hackathons;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface HackathonSuggestionRepository extends JpaRepository<HackathonSuggestion, UUID> {
    Optional<HackathonSuggestion> findByUrl(String url);
    long countByUserIdAndCreatedAtAfter(UUID userId, Instant after);
}
