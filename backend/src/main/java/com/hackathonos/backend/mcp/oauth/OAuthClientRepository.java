package com.hackathonos.backend.mcp.oauth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface OAuthClientRepository extends JpaRepository<OAuthClient, String> {

    @Modifying
    @Query("DELETE FROM OAuthClient c WHERE c.lastUsedAt IS NULL AND c.createdAt < :cutoff")
    int deleteUnusedClientsOlderThan(@Param("cutoff") Instant cutoff);
}
