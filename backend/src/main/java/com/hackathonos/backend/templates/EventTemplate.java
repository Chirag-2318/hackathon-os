package com.hackathonos.backend.templates;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "event_templates")
public class EventTemplate {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_hours", nullable = false)
    private int durationHours;

    @Column(name = "team_min", nullable = false)
    private int teamMin;

    @Column(name = "team_max", nullable = false)
    private int teamMax;

    @Column(nullable = false, length = 50)
    private String icon;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String phases;

    protected EventTemplate() {}

    public EventTemplate(String id, String name, String description, int durationHours, int teamMin, int teamMax, String icon, int sortOrder, String phases) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.durationHours = durationHours;
        this.teamMin = teamMin;
        this.teamMax = teamMax;
        this.icon = icon;
        this.sortOrder = sortOrder;
        this.phases = phases;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDurationHours() { return durationHours; }
    public void setDurationHours(int durationHours) { this.durationHours = durationHours; }

    public int getTeamMin() { return teamMin; }
    public void setTeamMin(int teamMin) { this.teamMin = teamMin; }

    public int getTeamMax() { return teamMax; }
    public void setTeamMax(int teamMax) { this.teamMax = teamMax; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public String getPhases() { return phases; }
    public void setPhases(String phases) { this.phases = phases; }
}
