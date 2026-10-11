package com.hackathonos.backend.members;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "room_member_skills")
@IdClass(RoomMemberSkillId.class)
public class RoomMemberSkill {

    @Id
    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Id
    @Column(nullable = false, length = 50)
    private String skill;

    protected RoomMemberSkill() {}

    public RoomMemberSkill(UUID memberId, String skill) {
        this.memberId = memberId;
        this.skill = skill;
    }

    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }
}
