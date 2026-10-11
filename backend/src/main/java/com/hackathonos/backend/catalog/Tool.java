package com.hackathonos.backend.catalog;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tools")
public class Tool {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "cost", nullable = false, length = 30)
    private String cost; // 'FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE'

    @Column(name = "license", columnDefinition = "TEXT")
    private String license;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_checked", nullable = false)
    private LocalDate lastChecked;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Tool() {}

    public Tool(String name, String category, String cost, String license, String url, String description, String notes, LocalDate lastChecked, int sortOrder) {
        this.name = name;
        this.category = category;
        this.cost = cost;
        this.license = license;
        this.url = url;
        this.description = description;
        this.notes = notes;
        this.lastChecked = lastChecked != null ? lastChecked : LocalDate.now();
        this.sortOrder = sortOrder;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCost() { return cost; }
    public void setCost(String cost) { this.cost = cost; }

    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getLastChecked() { return lastChecked; }
    public void setLastChecked(LocalDate lastChecked) { this.lastChecked = lastChecked; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
