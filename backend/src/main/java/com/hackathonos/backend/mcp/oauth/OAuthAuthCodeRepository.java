package com.hackathonos.backend.mcp.oauth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OAuthAuthCodeRepository extends JpaRepository<OAuthAuthCode, String> {

    Optional<OAuthAuthCode> findByCodeHash(String codeHash);

    List<OAuthAuthCode> findByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM OAuthAuthCode c WHERE c.expiresAt < :cutoff")
    int deleteExpiredCodesOlderThan(@Param("cutoff") Instant cutoff);
}
