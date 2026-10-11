package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PitchRehearsalRepository extends JpaRepository<PitchRehearsal, UUID> {
    List<PitchRehearsal> findByRoomIdOrderByRunAtAsc(UUID roomId);
    List<PitchRehearsal> findByRoomIdOrderByRunAtDesc(UUID roomId);
    long countByRoomId(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
