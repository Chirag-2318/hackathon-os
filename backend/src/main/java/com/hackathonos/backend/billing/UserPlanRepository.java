package com.hackathonos.backend.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserPlanRepository extends JpaRepository<UserPlan, UUID> {
    void deleteByUserId(UUID userId);
}
