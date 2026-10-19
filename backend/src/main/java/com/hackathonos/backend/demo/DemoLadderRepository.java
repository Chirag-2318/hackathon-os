package com.hackathonos.backend.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemoLadderRepository extends JpaRepository<DemoLadder, DemoLadderId> {
    List<DemoLadder> findByRoomIdOrderByRungAsc(UUID roomId);
    Optional<DemoLadder> findByRoomIdAndRung(UUID roomId, String rung);
    void deleteByRoomId(UUID roomId);
}
