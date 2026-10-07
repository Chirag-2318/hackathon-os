package com.hackathonos.backend.room;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "leader_id", nullable = false)
    private Long leaderId;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Room() {}

    public Room(String name, Long leaderId) {
        this.name = name;
        this.leaderId = leaderId;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getLeaderId() { return leaderId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    public void setLeaderId(Long leaderId) { this.leaderId = leaderId; }
}
