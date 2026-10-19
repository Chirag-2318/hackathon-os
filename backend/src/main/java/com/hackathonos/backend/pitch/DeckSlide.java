package com.hackathonos.backend.pitch;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "deck_slides")
@IdClass(DeckSlide.DeckSlideId.class)
public class DeckSlide {

    @Id
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Id
    @Column(name = "page_no", nullable = false)
    private int pageNo;

    @Column(name = "title", nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "chars", nullable = false)
    private int chars = 0;

    public DeckSlide() {}

    public DeckSlide(UUID roomId, int pageNo, String title, String text, int chars) {
        this.roomId = roomId;
        this.pageNo = pageNo;
        this.title = title;
        this.text = text;
        this.chars = chars;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public int getPageNo() {
        return pageNo;
    }

    public void setPageNo(int pageNo) {
        this.pageNo = pageNo;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getChars() {
        return chars;
    }

    public void setChars(int chars) {
        this.chars = chars;
    }

    public static class DeckSlideId implements Serializable {
        private UUID roomId;
        private int pageNo;

        public DeckSlideId() {}

        public DeckSlideId(UUID roomId, int pageNo) {
            this.roomId = roomId;
            this.pageNo = pageNo;
        }

        public UUID getRoomId() {
            return roomId;
        }

        public void setRoomId(UUID roomId) {
            this.roomId = roomId;
        }

        public int getPageNo() {
            return pageNo;
        }

        public void setPageNo(int pageNo) {
            this.pageNo = pageNo;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DeckSlideId that)) return false;
            return pageNo == that.pageNo && Objects.equals(roomId, that.roomId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roomId, pageNo);
        }
    }
}
