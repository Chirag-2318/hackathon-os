package com.hackathonos.backend.apihub;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiEndpointRepository extends JpaRepository<ApiEndpoint, UUID> {
    List<ApiEndpoint> findByRoomIdOrderByPositionAsc(UUID roomId);
    List<ApiEndpoint> findByRoomIdAndMockEnabledTrue(UUID roomId);
    Optional<ApiEndpoint> findByRoomIdAndMethodAndPath(UUID roomId, String method, String path);
}
