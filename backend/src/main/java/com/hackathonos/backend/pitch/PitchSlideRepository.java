package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PitchSlideRepository extends JpaRepository<PitchSlide, UUID> {
    List<PitchSlide> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
