package com.hackathonos.backend.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserEmailPreferenceRepository extends JpaRepository<UserEmailPreference, UserEmailPreference.UserEmailPreferenceId> {
    List<UserEmailPreference> findByUserId(UUID userId);
    Optional<UserEmailPreference> findByUserIdAndCategory(UUID userId, String category);
    void deleteByUserId(UUID userId);
}
