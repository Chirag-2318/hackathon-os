package com.hackathonos.backend.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanInterestRepository extends JpaRepository<PlanInterest, UUID> {
    Optional<PlanInterest> findByUserIdAndPlan(UUID userId, String plan);
    List<PlanInterest> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
