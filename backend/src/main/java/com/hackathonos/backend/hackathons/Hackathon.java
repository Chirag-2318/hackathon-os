package com.hackathonos.backend.hackathons;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hackathons", indexes = {
        @Index(name = "idx_hackathons_active_dates", columnList = "active, starts_at, ends_at")
})
public class Hackathon {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 120)
    private String organizer;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String url;

    @Column(length = 40)
    private String source;

    @Column(nullable = false, length = 20)
    private String mode; // ONLINE, OFFLINE, HYBRID

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "registration_deadline")
    private Instant registrationDeadline;

    @Column(name = "prize_text", length = 120)
    private String prizeText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String themes = "[]";

    @Column(length = 200)
    private String location;

    @Column(name = "team_min")
    private Short teamMin;

    @Column(name = "team_max")
    private Short teamMax;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(nullable = false)
    private boolean active = true;

    public Hackathon() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOrganizer() { return organizer; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }

    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }

    public Instant getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(Instant registrationDeadline) { this.registrationDeadline = registrationDeadline; }

    public String getPrizeText() { return prizeText; }
    public void setPrizeText(String prizeText) { this.prizeText = prizeText; }

    public String getThemes() { return themes; }
    public void setThemes(String themes) { this.themes = themes != null ? themes : "[]"; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Short getTeamMin() { return teamMin; }
    public void setTeamMin(Short teamMin) { this.teamMin = teamMin; }

    public Short getTeamMax() { return teamMax; }
    public void setTeamMax(Short teamMax) { this.teamMax = teamMax; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
