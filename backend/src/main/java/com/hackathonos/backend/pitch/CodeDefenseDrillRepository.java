package com.hackathonos.backend.pitch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CodeDefenseDrillRepository extends JpaRepository<CodeDefenseDrill, UUID> {
    List<CodeDefenseDrill> findByRoomIdOrderByModuleAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
