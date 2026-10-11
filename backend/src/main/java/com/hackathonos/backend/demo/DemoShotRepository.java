package com.hackathonos.backend.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemoShotRepository extends JpaRepository<DemoShot, UUID> {
    List<DemoShot> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
