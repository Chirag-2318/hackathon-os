package com.hackathonos.backend.ideas;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "idea_links")
public class IdeaLink {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "idea_id", nullable = false)
    private UUID ideaId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(columnDefinition = "TEXT")
    private String title;

    protected IdeaLink() {}

    public IdeaLink(UUID ideaId, String url, String title) {
        this.ideaId = ideaId;
        this.url = url;
        this.title = title;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getIdeaId() { return ideaId; }
    public void setIdeaId(UUID ideaId) { this.ideaId = ideaId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
