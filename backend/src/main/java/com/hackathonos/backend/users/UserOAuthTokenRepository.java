package com.hackathonos.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOAuthTokenRepository extends JpaRepository<UserOAuthToken, UserOAuthToken.UserOAuthTokenId> {
    Optional<UserOAuthToken> findByUserIdAndProvider(UUID userId, String provider);
}
