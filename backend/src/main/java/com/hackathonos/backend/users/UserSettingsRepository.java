package com.hackathonos.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {
}
