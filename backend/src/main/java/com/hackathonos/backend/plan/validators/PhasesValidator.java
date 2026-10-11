package com.hackathonos.backend.plan.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.plan.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Validates sprint phases, checking JSON schema, 0-100% contiguity, freeze and rehearsal milestones.
 */
@Component
public class PhasesValidator {

    private final ObjectMapper objectMapper;

    public PhasesValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static class NormalizedPhase {
        public String id;
        public String name;
        public double startPct;
        public double endPct;
        public String exitCheckpoint;
        public List<String> goals = new ArrayList<>();
    }

    public ValidationResult validate(String answer) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (answer == null || answer.isBlank()) {
            errors.add("Answer is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        String jsonText = extractJsonArray(answer);
        JsonNode root;
        try {
            root = objectMapper.readTree(jsonText);
        } catch (Exception e) {
            errors.add("Invalid JSON: " + e.getMessage());
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        if (!root.isArray()) {
            errors.add("Phases payload must be a JSON array");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        if (root.isEmpty()) {
            errors.add("Phases array is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        List<NormalizedPhase> phaseList = new ArrayList<>();
        boolean hasFreeze = false;
        boolean hasRehearsal = false;

        for (int i = 0; i < root.size(); i++) {
            JsonNode item = root.get(i);
            if (!item.has("id") || item.get("id").asText().isBlank()) {
                errors.add("Phase item at index " + i + " is missing 'id'");
            }
            if (!item.has("name") || item.get("name").asText().isBlank()) {
                errors.add("Phase item at index " + i + " is missing 'name'");
            }
            if (!item.has("startPct")) {
                errors.add("Phase item at index " + i + " is missing 'startPct'");
            }
            if (!item.has("endPct")) {
                errors.add("Phase item at index " + i + " is missing 'endPct'");
            }

            if (item.has("startPct") && item.has("endPct")) {
                double start = item.get("startPct").asDouble();
                double end = item.get("endPct").asDouble();
                if (end <= start) {
                    errors.add("Phase at index " + i + " has endPct (" + end + ") <= startPct (" + start + ")");
                }

                NormalizedPhase p = new NormalizedPhase();
                p.id = item.has("id") ? item.get("id").asText() : "p" + (i + 1);
                p.name = item.has("name") ? item.get("name").asText() : "Phase " + (i + 1);
                p.startPct = start;
                p.endPct = end;
                p.exitCheckpoint = item.has("exitCheckpoint") ? item.get("exitCheckpoint").asText() : "";
                if (item.has("goals") && item.get("goals").isArray()) {
                    for (JsonNode g : item.get("goals")) {
                        p.goals.add(g.asText());
                    }
                }
                phaseList.add(p);

                String lowerName = p.name.toLowerCase();
                if (lowerName.contains("freeze")) hasFreeze = true;
                if (lowerName.contains("rehearsal")) hasRehearsal = true;
            }
        }

        if (!errors.isEmpty()) {
            return new ValidationResult(false, errors, warnings, "Validation failed with " + errors.size() + " errors", null);
        }

        if (phaseList.size() < 5) {
            warnings.add("Recommended at least 5 phases (found " + phaseList.size() + ")");
        }
        if (!hasFreeze) {
            warnings.add("No phase name containing 'freeze' found");
        }
        if (!hasRehearsal) {
            warnings.add("No phase name containing 'rehearsal' found");
        }

        // Normalize contiguous 0 to 100%
        phaseList.sort(Comparator.comparingDouble(a -> a.startPct));
        boolean normalizedGaps = false;
        double currentStart = 0.0;
        for (int i = 0; i < phaseList.size(); i++) {
            NormalizedPhase p = phaseList.get(i);
            if (Math.abs(p.startPct - currentStart) > 0.01) {
                normalizedGaps = true;
                p.startPct = currentStart;
            }
            if (i == phaseList.size() - 1) {
                if (Math.abs(p.endPct - 100.0) > 0.01) {
                    normalizedGaps = true;
                    p.endPct = 100.0;
                }
            } else {
                currentStart = p.endPct;
            }
        }

        if (normalizedGaps) {
            warnings.add("Gaps or overlaps detected: phases normalized to contiguous 0-100%");
        }

        String summary = phaseList.size() + " phases validated covering 0% to 100%";
        return new ValidationResult(true, errors, warnings, summary, phaseList);
    }

    private String extractJsonArray(String raw) {
        String text = raw.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);

        int firstBracket = text.indexOf('[');
        int lastBracket = text.lastIndexOf(']');
        if (firstBracket >= 0 && lastBracket > firstBracket) {
            return text.substring(firstBracket, lastBracket + 1).trim();
        }
        return text.trim();
    }
}
