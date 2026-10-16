package com.hackathonos.backend.billing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_plan")
public class UserPlan {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String plan = "FREE";

    @Column(nullable = false)
    private Instant since = Instant.now();

    @Column(nullable = false, length = 20)
    private String source = "DEV";

    protected UserPlan() {}

    public UserPlan(UUID userId, String plan, Instant since, String source) {
        this.userId = userId;
        this.plan = plan != null ? plan : "FREE";
        this.since = since != null ? since : Instant.now();
        this.source = source != null ? source : "DEV";
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public Instant getSince() {
        return since;
    }

    public void setSince(Instant since) {
        this.since = since;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
