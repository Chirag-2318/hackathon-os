package com.hackathonos.backend.brief;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "brief_rubric_items")
public class BriefRubricItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "brief_id", nullable = false)
    private UUID briefId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String criterion;

    @Column(nullable = false)
    private int weight;

    @Column(nullable = false)
    private int position;

    protected BriefRubricItem() {}

    public BriefRubricItem(UUID briefId, String criterion, int weight, int position) {
        this.briefId = briefId;
        this.criterion = criterion;
        this.weight = weight;
        this.position = position;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getBriefId() { return briefId; }
    public void setBriefId(UUID briefId) { this.briefId = briefId; }

    public String getCriterion() { return criterion; }
    public void setCriterion(String criterion) { this.criterion = criterion; }

    public int getWeight() { return weight; }
    public void setWeight(int weight) { this.weight = weight; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
