package com.hackathonos.backend.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemoMediaRepository extends JpaRepository<DemoMedia, UUID> {
    Optional<DemoMedia> findByRoomId(UUID roomId);
}
