package com.hackathonos.backend.mcp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface McpTokenRepository extends JpaRepository<McpToken, UUID> {
    Optional<McpToken> findByTokenHash(String tokenHash);
    List<McpToken> findByUserId(UUID userId);
    List<McpToken> findByFamilyId(UUID familyId);
    List<McpToken> findByAuthCodeHash(String authCodeHash);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE McpToken t SET t.revokedAt = :now WHERE t.familyId = :familyId AND t.revokedAt IS NULL")
    int revokeFamily(@org.springframework.data.repository.query.Param("familyId") UUID familyId,
                     @org.springframework.data.repository.query.Param("now") java.time.Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE McpToken t SET t.revokedAt = :now WHERE t.authCodeHash = :authCodeHash AND t.revokedAt IS NULL")
    int revokeByAuthCodeHash(@org.springframework.data.repository.query.Param("authCodeHash") String authCodeHash,
                             @org.springframework.data.repository.query.Param("now") java.time.Instant now);
}
