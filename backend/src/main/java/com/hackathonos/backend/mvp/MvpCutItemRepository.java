package com.hackathonos.backend.mvp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MvpCutItemRepository extends JpaRepository<MvpCutItem, UUID> {
    List<MvpCutItem> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
