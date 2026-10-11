package com.hackathonos.backend.mvp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MvpFlowStepRepository extends JpaRepository<MvpFlowStep, UUID> {
    List<MvpFlowStep> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
