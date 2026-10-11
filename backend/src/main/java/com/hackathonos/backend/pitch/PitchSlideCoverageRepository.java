package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PitchSlideCoverageRepository extends JpaRepository<PitchSlideCoverage, PitchSlideCoverage.PitchSlideCoverageId> {
    List<PitchSlideCoverage> findBySlideId(UUID slideId);
    List<PitchSlideCoverage> findBySlideIdIn(List<UUID> slideIds);
    void deleteBySlideId(UUID slideId);
}
