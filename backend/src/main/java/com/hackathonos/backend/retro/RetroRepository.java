package com.hackathonos.backend.retro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetroRepository extends JpaRepository<Retro, UUID> {
    Optional<Retro> findByRoomId(UUID roomId);
}
