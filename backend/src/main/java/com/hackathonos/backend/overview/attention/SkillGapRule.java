package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SkillGapRule implements AttentionRule {

    private static final List<String> CRITICAL_SKILLS = List.of("Frontend", "Backend", "Design", "Presenter");

    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;

    public SkillGapRule(RoomMemberRepository memberRepository, RoomMemberSkillRepository skillRepository) {
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        List<RoomMember> members = memberRepository.findByRoomId(room.getId());
        List<UUID> memberIds = new ArrayList<>();
        for (RoomMember m : members) memberIds.add(m.getId());

        Set<String> covered = new HashSet<>();
        if (!memberIds.isEmpty()) {
            for (RoomMemberSkill s : skillRepository.findByMemberIdIn(memberIds)) {
                covered.add(s.getSkill());
            }
        }

        List<String> missing = new ArrayList<>();
        for (String skill : CRITICAL_SKILLS) {
            if (!covered.contains(skill)) {
                missing.add(skill);
            }
        }

        if (missing.isEmpty()) return Collections.emptyList();

        String missingStr = String.join(", ", missing);
        String helper = "No one on the team currently covers " + missingStr;
        String title = missing.size() == 1 ? "Skill gap: " + missing.get(0) : missing.size() + " skill gaps detected";

        return List.of(new AttentionItem(
                "skill-gap-" + room.getId(),
                "SKILL_GAP",
                "purple",
                title,
                helper,
                "Roster & skills",
                "/app/room/" + room.getId() + "/team",
                Collections.emptyList()
        ));
    }
}
