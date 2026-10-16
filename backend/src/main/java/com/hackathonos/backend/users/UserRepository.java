package com.hackathonos.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByProviderAndProviderUserId(String provider, String providerUserId);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByUsername(String username);
    Optional<User> findByLogin(String login);
    boolean existsByUsernameIgnoreCase(String username);
}
