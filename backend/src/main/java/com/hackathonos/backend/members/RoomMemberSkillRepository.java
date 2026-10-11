package com.hackathonos.backend.members;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoomMemberSkillRepository extends JpaRepository<RoomMemberSkill, RoomMemberSkillId> {
    List<RoomMemberSkill> findByMemberId(UUID memberId);
    List<RoomMemberSkill> findByMemberIdIn(List<UUID> memberIds);
    void deleteByMemberId(UUID memberId);
}
