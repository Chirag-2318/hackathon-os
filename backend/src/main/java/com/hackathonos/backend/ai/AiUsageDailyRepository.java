package com.hackathonos.backend.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AiUsageDailyRepository extends JpaRepository<AiUsageDaily, AiUsageDaily.AiUsageDailyId> {

    List<AiUsageDaily> findByUserIdAndDayGreaterThanEqualOrderByDayAsc(UUID userId, LocalDate fromDay);

    @Modifying
    @Query(value = """
        INSERT INTO ai_usage_daily (user_id, day, calls, failures)
        VALUES (:userId, :day, 1, :failureIncrement)
        ON CONFLICT (user_id, day)
        DO UPDATE SET
            calls = ai_usage_daily.calls + 1,
            failures = ai_usage_daily.failures + :failureIncrement
        """, nativeQuery = true)
    void incrementUsage(@Param("userId") UUID userId,
                        @Param("day") LocalDate day,
                        @Param("failureIncrement") int failureIncrement);

    void deleteByUserId(UUID userId);
}
