package com.hackathonos.backend.retro;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RetroAwardRepository extends JpaRepository<RetroAward, UUID> {
    List<RetroAward> findByRoomIdOrderByNameAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
