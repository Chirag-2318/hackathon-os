package com.hackathonos.backend.common.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

public interface OAuthLinkStateRepository extends JpaRepository<OAuthLinkState, String> {
    Optional<OAuthLinkState> findByStateAndProvider(String state, String provider);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM OAuthLinkState s WHERE s.expiresAt < :cutoff OR (s.usedAt IS NOT NULL AND s.usedAt < :usedCutoff)")
    int purgeExpiredStates(@Param("cutoff") Instant cutoff, @Param("usedCutoff") Instant usedCutoff);
}
