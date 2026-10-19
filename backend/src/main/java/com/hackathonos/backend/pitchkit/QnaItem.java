package com.hackathonos.backend.pitchkit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "qna_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_qna_items_room_hash", columnNames = {"room_id", "hash"})
})
public class QnaItem {

    @Id
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @Column(name = "kind", nullable = false, length = 32)
    private String kind = "QUESTION";

    @Column(name = "category", columnDefinition = "TEXT")
    private String category;

    @Column(name = "criterion", columnDefinition = "TEXT")
    private String criterion;

    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "followup", columnDefinition = "TEXT")
    private String followup;

    @Column(name = "counter", columnDefinition = "TEXT")
    private String counter;

    @Column(name = "proof", columnDefinition = "TEXT")
    private String proof;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "owner_handle", columnDefinition = "TEXT")
    private String ownerHandle;

    @Column(name = "source", nullable = false, length = 32)
    private String source = "DOC";

    @Column(name = "doc_version")
    private Integer docVersion;

    @Column(name = "position", nullable = false)
    private int position = 0;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public QnaItem() {}

    public QnaItem(UUID id, UUID roomId, String hash, String kind, String category, String criterion,
                   String question, String answer, String followup, String counter, String proof,
                   UUID ownerUserId, String ownerHandle, String source, Integer docVersion, int position,
                   UUID createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.roomId = roomId;
        this.hash = hash;
        this.kind = kind != null ? kind : "QUESTION";
        this.category = category;
        this.criterion = criterion;
        this.question = question;
        this.answer = answer;
        this.followup = followup;
        this.counter = counter;
        this.proof = proof;
        this.ownerUserId = ownerUserId;
        this.ownerHandle = ownerHandle;
        this.source = source != null ? source : "DOC";
        this.docVersion = docVersion;
        this.position = position;
        this.createdBy = createdBy;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCriterion() { return criterion; }
    public void setCriterion(String criterion) { this.criterion = criterion; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getFollowup() { return followup; }
    public void setFollowup(String followup) { this.followup = followup; }

    public String getCounter() { return counter; }
    public void setCounter(String counter) { this.counter = counter; }

    public String getProof() { return proof; }
    public void setProof(String proof) { this.proof = proof; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getOwnerHandle() { return ownerHandle; }
    public void setOwnerHandle(String ownerHandle) { this.ownerHandle = ownerHandle; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Integer getDocVersion() { return docVersion; }
    public void setDocVersion(Integer docVersion) { this.docVersion = docVersion; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
