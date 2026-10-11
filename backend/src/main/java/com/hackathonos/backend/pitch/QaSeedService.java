package com.hackathonos.backend.pitch;

import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.members.RoomMemberRepository;
import com.hackathonos.backend.members.RoomMemberSkill;
import com.hackathonos.backend.members.RoomMemberSkillRepository;
import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Seeds Q&A questions and code-defense drills from the validated demo plan step and tech stack.
 */
@Service
public class QaSeedService {

    private static final List<String> REQUIRED_QUESTIONS = List.of(
            "What did you build this weekend?",
            "Who exactly is this for?",
            "What breaks first?"
    );

    private final PitchQaRepository qaRepository;
    private final CodeDefenseDrillRepository drillRepository;
    private final PlanStepRepository planStepRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomMemberSkillRepository skillRepository;

    public QaSeedService(
            PitchQaRepository qaRepository,
            CodeDefenseDrillRepository drillRepository,
            PlanStepRepository planStepRepository,
            RoomMemberRepository memberRepository,
            RoomMemberSkillRepository skillRepository
    ) {
        this.qaRepository = qaRepository;
        this.drillRepository = drillRepository;
        this.planStepRepository = planStepRepository;
        this.memberRepository = memberRepository;
        this.skillRepository = skillRepository;
    }

    /**
     * Parses demo plan step and tech stack to seed Q&A and code defense drills.
     */
    @Transactional
    public void seedFromPlan(Room room) {
        UUID roomId = room.getId();

        // 1. Seed Q&A items from demo step
        Optional<PlanStep> demoStep = planStepRepository.findByRoomIdAndStepKey(roomId, "demo");
        String demoAnswer = demoStep.filter(PlanStep::isValidated).map(PlanStep::getAnswer).orElse("");

        List<PitchQa> seededQas = parseQaPairs(demoAnswer, roomId);
        Map<String, PitchQa> existingByQ = new HashMap<>();
        for (PitchQa q : qaRepository.findByRoomIdOrderByPositionAsc(roomId)) {
            existingByQ.put(q.getQuestion().trim().toLowerCase(Locale.ROOT), q);
        }

        int position = existingByQ.size();
        for (PitchQa q : seededQas) {
            String norm = q.getQuestion().trim().toLowerCase(Locale.ROOT);
            if (!existingByQ.containsKey(norm)) {
                q.setPosition(position++);
                qaRepository.save(q);
                existingByQ.put(norm, q);
            }
        }

        // Ensure required questions are present
        for (String reqQ : REQUIRED_QUESTIONS) {
            String norm = reqQ.trim().toLowerCase(Locale.ROOT);
            if (!existingByQ.containsKey(norm)) {
                PitchQa q = new PitchQa(
                        roomId,
                        position++,
                        reqQ,
                        "",
                        guessCategory(reqQ),
                        "GENERATED",
                        false,
                        null
                );
                qaRepository.save(q);
                existingByQ.put(norm, q);
            }
        }

        // 2. Seed Code Defense drills from tech step table rows
        Optional<PlanStep> techStep = planStepRepository.findByRoomIdAndStepKey(roomId, "tech");
        String techAnswer = techStep.filter(PlanStep::isValidated).map(PlanStep::getAnswer).orElse("");
        seedCodeDefenseFromTech(roomId, techAnswer);
    }

    private List<PitchQa> parseQaPairs(String text, UUID roomId) {
        List<PitchQa> list = new ArrayList<>();
        if (text == null || text.isBlank()) return list;

        int qaSectionIdx = text.indexOf("Likely judge Q&A");
        if (qaSectionIdx < 0) qaSectionIdx = text.indexOf("Q&A");
        String targetText = qaSectionIdx >= 0 ? text.substring(qaSectionIdx) : text;

        String[] lines = targetText.split("\\r?\\n");
        String currentQ = null;
        StringBuilder currentA = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("#") && !trimmed.contains("Q&A")) {
                if (currentQ != null) {
                    list.add(new PitchQa(roomId, 0, currentQ, currentA.toString().trim(), guessCategory(currentQ), "GENERATED", false, null));
                    currentQ = null;
                    currentA.setLength(0);
                }
                break;
            }

            Matcher qMatcher = Pattern.compile("^(?:[-*]\\s*)?(?:\\*\\*)?[Qq](?:uestion)?[\\s*:]+(.*)$").matcher(trimmed);
            if (qMatcher.find()) {
                if (currentQ != null) {
                    list.add(new PitchQa(roomId, 0, currentQ, currentA.toString().trim(), guessCategory(currentQ), "GENERATED", false, null));
                    currentA.setLength(0);
                }
                currentQ = qMatcher.group(1).replaceAll("[*]+", "").trim();
            } else {
                Matcher aMatcher = Pattern.compile("^(?:[-*]\\s*)?(?:\\*\\*)?[Aa](?:nswer)?[\\s*:]+(.*)$").matcher(trimmed);
                if (aMatcher.find()) {
                    currentA.append(aMatcher.group(1).replaceAll("[*]+", "").trim());
                } else if (currentQ != null && !trimmed.isBlank()) {
                    if (currentA.length() > 0) currentA.append(" ");
                    currentA.append(trimmed);
                }
            }
        }

        if (currentQ != null) {
            list.add(new PitchQa(roomId, 0, currentQ, currentA.toString().trim(), guessCategory(currentQ), "GENERATED", false, null));
        }

        return list;
    }

    private String guessCategory(String question) {
        String lower = question.toLowerCase(Locale.ROOT);
        if (lower.contains("api") || lower.contains("tech") || lower.contains("database") ||
            lower.contains("latency") || lower.contains("scale") || lower.contains("model") || lower.contains("code")) {
            return "TECH";
        }
        if (lower.contains("user") || lower.contains("customer") || lower.contains("money") ||
            lower.contains("impact") || lower.contains("number") || lower.contains("metric") || lower.contains("%")) {
            return "IMPACT";
        }
        if (lower.contains("team") || lower.contains("who built") || lower.contains("roles") || lower.contains("skill")) {
            return "TEAM";
        }
        if (lower.contains("how did you build") || lower.contains("process") || lower.contains("weekend") || lower.contains("sprint")) {
            return "PROCESS";
        }
        return "PRODUCT";
    }

    private void seedCodeDefenseFromTech(UUID roomId, String techAnswer) {
        if (techAnswer == null || techAnswer.isBlank()) return;

        List<RoomMember> members = memberRepository.findByRoomId(roomId);
        Map<String, UUID> skillToUser = new HashMap<>();
        for (RoomMember m : members) {
            for (RoomMemberSkill s : skillRepository.findByMemberId(m.getId())) {
                skillToUser.putIfAbsent(s.getSkill().toLowerCase(Locale.ROOT), m.getUserId());
            }
        }

        String[] lines = techAnswer.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("|") && !trimmed.contains("---") && !trimmed.toLowerCase(Locale.ROOT).contains("layer")) {
                String[] parts = trimmed.split("\\|");
                if (parts.length >= 3) {
                    String layer = parts[1].trim();
                    String choice = parts[2].trim();
                    if (!layer.isBlank() && !choice.isBlank() && !layer.equalsIgnoreCase("Layer")) {
                        String moduleName = choice;
                        String question = "Explain how " + choice + " is used for " + layer + ".";

                        UUID ownerId = null;
                        String layerLower = layer.toLowerCase(Locale.ROOT);
                        if (layerLower.contains("front") || layerLower.contains("ui")) ownerId = skillToUser.get("frontend");
                        else if (layerLower.contains("back") || layerLower.contains("server") || layerLower.contains("api")) ownerId = skillToUser.get("backend");
                        else if (layerLower.contains("data") || layerLower.contains("ml") || layerLower.contains("ai")) ownerId = skillToUser.get("ml/ai");

                        if (ownerId == null && !members.isEmpty()) {
                            ownerId = members.get(0).getUserId();
                        }

                        drillRepository.save(new CodeDefenseDrill(roomId, moduleName, question, ownerId, null));
                    }
                }
            }
        }
    }
}
