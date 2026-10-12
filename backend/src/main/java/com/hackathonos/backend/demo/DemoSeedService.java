package com.hackathonos.backend.demo;

import com.hackathonos.backend.plan.PlanStep;
import com.hackathonos.backend.plan.PlanStepRepository;
import com.hackathonos.backend.rooms.Room;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Seeds demo script sections, shot list, and insurance items from the validated plan demo answer.
 */
@Service
public class DemoSeedService {

    private final DemoSectionRepository sectionRepository;
    private final DemoShotRepository shotRepository;
    private final DemoInsuranceItemRepository insuranceRepository;
    private final PlanStepRepository planStepRepository;

    public DemoSeedService(
            DemoSectionRepository sectionRepository,
            DemoShotRepository shotRepository,
            DemoInsuranceItemRepository insuranceRepository,
            PlanStepRepository planStepRepository
    ) {
        this.sectionRepository = sectionRepository;
        this.shotRepository = shotRepository;
        this.insuranceRepository = insuranceRepository;
        this.planStepRepository = planStepRepository;
    }

    @Transactional
    public void cleanForRoom(UUID roomId) {
        sectionRepository.deleteByRoomId(roomId);
        shotRepository.deleteByRoomId(roomId);
    }

    /**
     * Seeds demo sections, shots, and insurance items from the plan's demo answer.
     */
    @Transactional
    public void seedFromPlan(Room room) {
        UUID roomId = room.getId();

        // Default insurance items
        if (insuranceRepository.findByRoomIdOrderByLabelAsc(roomId).isEmpty()) {
            List<DemoInsuranceItem> insuranceItems = List.of(
                    new DemoInsuranceItem(roomId, "works_offline", "The demo works without internet", false),
                    new DemoInsuranceItem(roomId, "cached_api", "API responses are cached", false),
                    new DemoInsuranceItem(roomId, "screenshots_ready", "Screenshots are ready", false),
                    new DemoInsuranceItem(roomId, "backup_recording", "A backup recording exists", false),
                    new DemoInsuranceItem(roomId, "spare_gear", "Spare laptop, hotspot and charger", false)
            );
            insuranceRepository.saveAll(insuranceItems);
        }

        Optional<PlanStep> demoStep = planStepRepository.findByRoomIdAndStepKey(roomId, "demo");
        if (demoStep.isEmpty() || !demoStep.get().isValidated() || demoStep.get().getAnswer() == null) {
            return;
        }

        String answer = demoStep.get().getAnswer();

        // 1. Parse Demo Script
        if (sectionRepository.findByRoomIdOrderByPositionAsc(roomId).isEmpty()) {
            List<DemoSection> sections = parseSections(roomId, answer);
            if (!sections.isEmpty()) {
                sectionRepository.saveAll(sections);
            }
        }

        // 2. Parse Shot list
        if (shotRepository.findByRoomIdOrderByPositionAsc(roomId).isEmpty()) {
            List<DemoShot> shots = parseShots(roomId, answer);
            if (!shots.isEmpty()) {
                shotRepository.saveAll(shots);
            }
        }
    }

    private List<DemoSection> parseSections(UUID roomId, String text) {
        List<DemoSection> list = new ArrayList<>();
        int scriptIdx = text.indexOf("Demo script");
        if (scriptIdx < 0) return list;

        String scriptPart = text.substring(scriptIdx);
        int nextSectionIdx = scriptPart.indexOf("\n#", 1);
        if (nextSectionIdx > 0) {
            scriptPart = scriptPart.substring(0, nextSectionIdx);
        }

        String[] lines = scriptPart.split("\\r?\\n");
        int pos = 0;
        Pattern pattern = Pattern.compile("^(?:[-*]\\s*)?(?:\\*\\*)?([A-Za-z0-9\\s/]+?)\\s*\\(([0-9]+)s?\\)[\\s*:]+(.*)$");

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher m = pattern.matcher(trimmed);
            if (m.find()) {
                String title = m.group(1).replaceAll("[*]+", "").trim();
                int seconds = Integer.parseInt(m.group(2));
                String content = m.group(3).replaceAll("[*]+", "").trim();
                list.add(new DemoSection(roomId, pos++, title, seconds, content));
            }
        }

        return list;
    }

    private List<DemoShot> parseShots(UUID roomId, String text) {
        List<DemoShot> list = new ArrayList<>();
        int shotIdx = text.indexOf("Shot list");
        if (shotIdx < 0) return list;

        String shotPart = text.substring(shotIdx);
        int nextSectionIdx = shotPart.indexOf("\n#", 1);
        if (nextSectionIdx > 0) {
            shotPart = shotPart.substring(0, nextSectionIdx);
        }

        String[] lines = shotPart.split("\\r?\\n");
        int pos = 0;
        Pattern pattern = Pattern.compile("^(?:[-*0-9.]+\\s*)?(?:\\*\\*)?(Shot\\s*\\d+|[A-Za-z0-9\\s]+?):?\\s*\\(([0-9]+)s?\\)[\\s*:]+(.*)$", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            String trimmed = line.trim();
            Matcher m = pattern.matcher(trimmed);
            if (m.find()) {
                String title = m.group(1).replaceAll("[*]+", "").trim();
                int seconds = Integer.parseInt(m.group(2));
                String notes = m.group(3).replaceAll("[*]+", "").trim();
                list.add(new DemoShot(roomId, pos++, title, seconds, notes, false));
            }
        }

        return list;
    }
}
