package com.hackathonos.backend.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioSettingsRepository extends JpaRepository<PortfolioSettings, UUID> {
    Optional<PortfolioSettings> findByUserId(UUID userId);
    Optional<PortfolioSettings> findBySlug(String slug);
}
