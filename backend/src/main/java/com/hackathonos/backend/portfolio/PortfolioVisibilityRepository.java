package com.hackathonos.backend.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioVisibilityRepository extends JpaRepository<PortfolioVisibility, PortfolioVisibility.PortfolioVisibilityId> {
    Optional<PortfolioVisibility> findByUserIdAndRoomId(UUID userId, UUID roomId);
    List<PortfolioVisibility> findByUserId(UUID userId);
}
