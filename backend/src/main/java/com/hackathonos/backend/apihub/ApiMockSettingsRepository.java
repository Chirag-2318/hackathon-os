package com.hackathonos.backend.apihub;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiMockSettingsRepository extends JpaRepository<ApiMockSettings, UUID> {
    Optional<ApiMockSettings> findByToken(String token);
}
