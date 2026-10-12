package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PitchDeckSourceRepository extends JpaRepository<PitchDeckSource, UUID> {
}
