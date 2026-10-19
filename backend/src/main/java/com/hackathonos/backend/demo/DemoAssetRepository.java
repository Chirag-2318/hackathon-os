package com.hackathonos.backend.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemoAssetRepository extends JpaRepository<DemoAsset, UUID> {
    List<DemoAsset> findByRoomIdOrderByPositionAscCreatedAtAsc(UUID roomId);
    List<DemoAsset> findByRoomIdAndKindOrderByPositionAscCreatedAtAsc(UUID roomId, String kind);
    Optional<DemoAsset> findFirstByRoomIdAndKind(UUID roomId, String kind);
    long countByRoomIdAndKind(UUID roomId, String kind);
    void deleteByRoomId(UUID roomId);
}
