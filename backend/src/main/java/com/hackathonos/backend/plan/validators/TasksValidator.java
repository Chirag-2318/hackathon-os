package com.hackathonos.backend.plan.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.plan.ValidationResult;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Validates task breakdown, cycle-free dependency DAG, role mapping, and sprint feasibility.
 */
@Component
public class TasksValidator {

    private final ObjectMapper objectMapper;

    public TasksValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public static class NormalizedTask {
        public String id;
        public String title;
        public String phaseId;
        public String role;
        public int estimateMin = 60;
        public List<String> dependsOn = new ArrayList<>();
        public String acceptance = "";
    }

    public ValidationResult validate(String answer, Set<String> knownPhaseIds, Set<String> knownRoles, int memberCount, long eventHours) {
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
            errors.add("Tasks payload must be a JSON array");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        if (root.isEmpty()) {
            errors.add("Tasks array is empty");
            return new ValidationResult(false, errors, warnings, "Validation failed", null);
        }

        List<NormalizedTask> taskList = new ArrayList<>();
        Set<String> allTaskIds = new HashSet<>();

        for (int i = 0; i < root.size(); i++) {
            JsonNode item = root.get(i);
            if (!item.has("id") || item.get("id").asText().isBlank()) {
                errors.add("Task item at index " + i + " is missing 'id'");
            }
            if (!item.has("title") || item.get("title").asText().isBlank()) {
                errors.add("Task item at index " + i + " is missing 'title'");
            }

            if (item.has("id")) {
                allTaskIds.add(item.get("id").asText());
            }
        }

        if (!errors.isEmpty()) {
            return new ValidationResult(false, errors, warnings, "Validation failed with " + errors.size() + " errors", null);
        }

        String fallbackPhase = (knownPhaseIds != null && !knownPhaseIds.isEmpty()) ? knownPhaseIds.iterator().next() : "p1";
        int totalEstimateMin = 0;

        for (int i = 0; i < root.size(); i++) {
            JsonNode item = root.get(i);
            NormalizedTask task = new NormalizedTask();
            task.id = item.get("id").asText();
            task.title = item.get("title").asText();

            String phaseId = item.has("phaseId") ? item.get("phaseId").asText() : fallbackPhase;
            if (knownPhaseIds != null && !knownPhaseIds.isEmpty() && !knownPhaseIds.contains(phaseId)) {
                warnings.add("Unknown phaseId '" + phaseId + "' in task '" + task.id + "', assigned to '" + fallbackPhase + "'");
                phaseId = fallbackPhase;
            }
            task.phaseId = phaseId;

            task.role = item.has("role") ? item.get("role").asText() : "Builder";
            if (knownRoles != null && !knownRoles.isEmpty() && !knownRoles.contains(task.role.toLowerCase())) {
                warnings.add("Role '" + task.role + "' in task '" + task.id + "' is not among known team roles");
            }

            if (item.has("estimateMin") && item.get("estimateMin").isInt()) {
                task.estimateMin = Math.max(15, item.get("estimateMin").asInt());
            } else {
                task.estimateMin = 60;
                warnings.add("Task '" + task.id + "' missing estimateMin, defaulted to 60");
            }
            totalEstimateMin += task.estimateMin;

            if (item.has("dependsOn") && item.get("dependsOn").isArray()) {
                for (JsonNode d : item.get("dependsOn")) {
                    String dep = d.asText();
                    if (!allTaskIds.contains(dep)) {
                        warnings.add("Task '" + task.id + "' depends on unknown task '" + dep + "', dependency dropped");
                    } else if (dep.equals(task.id)) {
                        warnings.add("Task '" + task.id + "' self-dependency dropped");
                    } else {
                        task.dependsOn.add(dep);
                    }
                }
            }

            task.acceptance = item.has("acceptance") ? item.get("acceptance").asText() : "";
            taskList.add(task);
        }

        // Cycle detection: remove back-edges that create cycles
        removeCycles(taskList, warnings);

        // Feasibility comparison:
        int effectiveMembers = Math.max(1, memberCount);
        long effectiveHours = Math.max(12, eventHours);
        double teamCapacityMin = effectiveMembers * effectiveHours * 60 * 0.6;
        double totalHours = totalEstimateMin / 60.0;
        String feasibility;
        if (totalEstimateMin <= teamCapacityMin) {
            feasibility = String.format(Locale.US, "%d tasks, about %.1fh of work for %d people over %dh: realistic",
                    taskList.size(), totalHours, effectiveMembers, effectiveHours);
        } else {
            feasibility = String.format(Locale.US, "%d tasks, about %.1fh of work for %d people over %dh: may be too much",
                    taskList.size(), totalHours, effectiveMembers, effectiveHours);
            warnings.add(feasibility);
        }

        String summary = String.format(Locale.US, "%d tasks validated (%.1fh total work). Feasibility: %s",
                taskList.size(), totalHours, feasibility);
        return new ValidationResult(true, errors, warnings, summary, taskList);
    }

    private void removeCycles(List<NormalizedTask> tasks, List<String> warnings) {
        Map<String, NormalizedTask> taskMap = new HashMap<>();
        for (NormalizedTask t : tasks) taskMap.put(t.id, t);

        for (NormalizedTask t : tasks) {
            Iterator<String> it = t.dependsOn.iterator();
            while (it.hasNext()) {
                String dep = it.next();
                if (hasPath(dep, t.id, taskMap, new HashSet<>())) {
                    warnings.add("Dependency cycle detected between '" + t.id + "' and '" + dep + "', dependency dropped");
                    it.remove();
                }
            }
        }
    }

    private boolean hasPath(String current, String target, Map<String, NormalizedTask> map, Set<String> visited) {
        if (current.equals(target)) return true;
        if (!visited.add(current)) return false;

        NormalizedTask task = map.get(current);
        if (task == null) return false;

        for (String next : task.dependsOn) {
            if (hasPath(next, target, map, visited)) return true;
        }
        return false;
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
