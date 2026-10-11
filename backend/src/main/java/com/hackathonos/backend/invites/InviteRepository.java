package com.hackathonos.backend.invites;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InviteRepository extends JpaRepository<Invite, UUID> {

    Optional<Invite> findByToken(String token);

    List<Invite> findByRoomIdAndRevokedAtIsNullAndExpiresAtAfter(UUID roomId, Instant now);

    Optional<Invite> findFirstByRoomIdAndRoleAndCreatedByAndRevokedAtIsNullAndExpiresAtAfter(
            UUID roomId, String role, UUID createdBy, Instant now);

    Optional<Invite> findByIdAndRoomId(UUID id, UUID roomId);

    void deleteByRoomId(UUID roomId);
}
