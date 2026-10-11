package com.hackathonos.backend.brief;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BriefRepository extends JpaRepository<Brief, UUID> {
    Optional<Brief> findByRoomId(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
