package com.hackathonos.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserApiKeyRepository extends JpaRepository<UserApiKey, UUID> {
    List<UserApiKey> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<UserApiKey> findByIdAndUserId(UUID id, UUID userId);
    void deleteByUserId(UUID userId);
}
