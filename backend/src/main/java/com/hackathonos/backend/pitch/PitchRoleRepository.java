package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PitchRoleRepository extends JpaRepository<PitchRole, UUID> {
    Optional<PitchRole> findByRoomId(UUID roomId);
}
