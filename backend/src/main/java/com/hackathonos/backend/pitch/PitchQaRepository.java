package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PitchQaRepository extends JpaRepository<PitchQa, UUID> {
    List<PitchQa> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
    void deleteByRoomIdAndSourceAndPracticedFalse(UUID roomId, String source);
}
