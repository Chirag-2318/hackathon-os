package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "pitch_slide_coverage")
@IdClass(PitchSlideCoverage.PitchSlideCoverageId.class)
public class PitchSlideCoverage {

    @Id
    @Column(name = "slide_id", nullable = false)
    private UUID slideId;

    @Id
    @Column(name = "criterion", nullable = false, length = 100)
    private String criterion;

    public PitchSlideCoverage() {}

    public PitchSlideCoverage(UUID slideId, String criterion) {
        this.slideId = slideId;
        this.criterion = criterion;
    }

    public UUID getSlideId() { return slideId; }
    public void setSlideId(UUID slideId) { this.slideId = slideId; }

    public String getCriterion() { return criterion; }
    public void setCriterion(String criterion) { this.criterion = criterion; }

    public static class PitchSlideCoverageId implements Serializable {
        private UUID slideId;
        private String criterion;

        public PitchSlideCoverageId() {}
        public PitchSlideCoverageId(UUID slideId, String criterion) {
            this.slideId = slideId;
            this.criterion = criterion;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            PitchSlideCoverageId that = (PitchSlideCoverageId) o;
            return Objects.equals(slideId, that.slideId) && Objects.equals(criterion, that.criterion);
        }

        @Override
        public int hashCode() {
            return Objects.hash(slideId, criterion);
        }
    }
}
