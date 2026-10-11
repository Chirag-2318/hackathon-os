package com.hackathonos.backend.members;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class RoomMemberSkillId implements Serializable {
    private UUID memberId;
    private String skill;

    public RoomMemberSkillId() {}

    public RoomMemberSkillId(UUID memberId, String skill) {
        this.memberId = memberId;
        this.skill = skill;
    }

    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RoomMemberSkillId that = (RoomMemberSkillId) o;
        return Objects.equals(memberId, that.memberId) && Objects.equals(skill, that.skill);
    }

    @Override
    public int hashCode() {
        return Objects.hash(memberId, skill);
    }
}
