package com.hackathonos.backend.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAiKeyRepository extends JpaRepository<UserAiKey, UUID> {
    Optional<UserAiKey> findByUserId(UUID userId);
}
