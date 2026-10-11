package com.hackathonos.backend.prep;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrepItemRepository extends JpaRepository<PrepItem, UUID> {
    List<PrepItem> findByRoomIdOrderByPositionAsc(UUID roomId);
    void deleteByRoomId(UUID roomId);
}
