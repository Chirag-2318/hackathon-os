package com.hackathonos.backend.apihub;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiExternalRepository extends JpaRepository<ApiExternal, UUID> {
    List<ApiExternal> findByRoomIdOrderByLastCheckedAtDesc(UUID roomId);
    List<ApiExternal> findByRoomId(UUID roomId);
}
