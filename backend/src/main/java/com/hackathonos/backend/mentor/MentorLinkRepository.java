package com.hackathonos.backend.mentor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorLinkRepository extends JpaRepository<MentorLink, UUID> {
    Optional<MentorLink> findByToken(String token);
    List<MentorLink> findByRoomIdAndRevokedAtIsNullAndExpiresAtAfter(UUID roomId, Instant now);
    List<MentorLink> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
