package com.hackathonos.backend.ai;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ai_usage_daily")
@IdClass(AiUsageDaily.AiUsageDailyId.class)
public class AiUsageDaily {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "day", nullable = false)
    private LocalDate day;

    @Column(name = "calls", nullable = false)
    private int calls = 0;

    @Column(name = "failures", nullable = false)
    private int failures = 0;

    public AiUsageDaily() {}

    public AiUsageDaily(UUID userId, LocalDate day, int calls, int failures) {
        this.userId = userId;
        this.day = day;
        this.calls = calls;
        this.failures = failures;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public LocalDate getDay() {
        return day;
    }

    public void setDay(LocalDate day) {
        this.day = day;
    }

    public int getCalls() {
        return calls;
    }

    public void setCalls(int calls) {
        this.calls = calls;
    }

    public int getFailures() {
        return failures;
    }

    public void setFailures(int failures) {
        this.failures = failures;
    }

    public static class AiUsageDailyId implements Serializable {
        private UUID userId;
        private LocalDate day;

        public AiUsageDailyId() {}

        public AiUsageDailyId(UUID userId, LocalDate day) {
            this.userId = userId;
            this.day = day;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public LocalDate getDay() {
            return day;
        }

        public void setDay(LocalDate day) {
            this.day = day;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof AiUsageDailyId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(day, that.day);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, day);
        }
    }
}
