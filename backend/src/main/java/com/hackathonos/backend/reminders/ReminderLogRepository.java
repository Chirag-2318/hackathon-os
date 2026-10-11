package com.hackathonos.backend.reminders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, UUID> {
    Optional<ReminderLog> findByKindAndRefIdAndUserId(String kind, UUID refId, UUID userId);
    boolean existsByKindAndRefIdAndUserId(String kind, UUID refId, UUID userId);
}
