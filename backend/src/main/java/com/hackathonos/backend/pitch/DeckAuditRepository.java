package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeckAuditRepository extends JpaRepository<DeckAudit, UUID> {
    Optional<DeckAudit> findFirstByRoomIdAndScopeAndPageNoAndDeckHashOrderByCreatedAtDesc(
            UUID roomId, String scope, Integer pageNo, String deckHash);

    Optional<DeckAudit> findFirstByRoomIdAndScopeAndDeckHashOrderByCreatedAtDesc(
            UUID roomId, String scope, String deckHash);

    List<DeckAudit> findByRoomIdAndDeckHash(UUID roomId, String deckHash);

    void deleteByRoomId(UUID roomId);
}
