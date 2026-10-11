package com.hackathonos.backend.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "playbooks")
public class Playbook {

    @Id
    @Column(name = "slug", length = 80)
    private String slug;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "summary", nullable = false, length = 300)
    private String summary;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "read_minutes", nullable = false)
    private int readMinutes;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Playbook() {}

    public Playbook(String slug, String title, String summary, String content, String category, int readMinutes, int sortOrder) {
        this.slug = slug;
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.category = category;
        this.readMinutes = readMinutes;
        this.sortOrder = sortOrder;
    }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getReadMinutes() { return readMinutes; }
    public void setReadMinutes(int readMinutes) { this.readMinutes = readMinutes; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
