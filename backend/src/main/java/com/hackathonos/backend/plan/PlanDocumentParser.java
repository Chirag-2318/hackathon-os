package com.hackathonos.backend.plan;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.brief.Brief;
import com.hackathonos.backend.brief.BriefRubricItem;
import com.hackathonos.backend.ideas.Idea;
import com.hackathonos.backend.members.RoomMember;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PlanDocumentParser {

    public record HeadingConfig(
            String h1Prefix,
            List<String> h2Headings,
            boolean requiresRealityCheck
    ) {}

    public record ParseResult(
            boolean valid,
            Map<String, String> files,
            List<String> errors,
            List<String> warnings,
            String cleanedContent
    ) {}

    private final ObjectMapper objectMapper;
    private final Map<String, HeadingConfig> headingConfigs = new HashMap<>();

    public PlanDocumentParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource res = resolver.getResource("classpath:plan-prompts/plan-headings.json");
            try (InputStream is = res.getInputStream()) {
                String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, HeadingConfig> map = objectMapper.readValue(json, new TypeReference<>() {});
                headingConfigs.putAll(map);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load plan-headings.json", e);
        }
    }

    public static final Map<String, List<String>> STEP_EXPECTED_FILES = Map.of(
            "prd", List.of("PRD.md", "MVP.md"),
            "tech", List.of("TECH_STACK.md", "ARCHITECTURE.md"),
            "phases", List.of("PHASES.md", "DESIGN.md"),
            "tasks", List.of("TASKS.md"),
            "demo", List.of("DEMO_SCRIPT.md", "QNA.md")
    );

    public ParseResult parseAndValidate(
            String stepKey,
            String answer,
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            List<Idea> approvedIdeas,
            long durationHours
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (answer == null || answer.isBlank()) {
            errors.add("Answer is empty");
            return new ParseResult(false, Collections.emptyMap(), errors, warnings, "");
        }

        // 1. Extract file blocks by delimiters
        Pattern fileBlockPattern = Pattern.compile("=====FILE:\\s*([A-Za-z0-9_.-]+)=====(.*?)(?:=====END FILE=====|$)", Pattern.DOTALL);
        Matcher matcher = fileBlockPattern.matcher(answer);

        Map<String, String> parsedFiles = new LinkedHashMap<>();
        int lastEnd = 0;
        boolean hasOutsideText = false;

        while (matcher.find()) {
            String preamble = answer.substring(lastEnd, matcher.start()).trim();
            if (!preamble.isEmpty()) {
                hasOutsideText = true;
            }
            String fileName = matcher.group(1).trim();
            String fileContent = matcher.group(2).trim();
            parsedFiles.put(fileName, fileContent);
            lastEnd = matcher.end();
        }

        String postamble = answer.substring(lastEnd).trim();
        if (!postamble.isEmpty()) {
            hasOutsideText = true;
        }

        if (hasOutsideText) {
            warnings.add("Extra text outside file blocks was stripped.");
        }

        List<String> expectedFiles = STEP_EXPECTED_FILES.getOrDefault(stepKey.toLowerCase(), Collections.emptyList());

        // Check required files
        for (String exp : expectedFiles) {
            if (!parsedFiles.containsKey(exp)) {
                // Check case-insensitive
                String foundKey = null;
                for (String k : parsedFiles.keySet()) {
                    if (k.equalsIgnoreCase(exp)) {
                        foundKey = k;
                        break;
                    }
                }
                if (foundKey != null) {
                    parsedFiles.put(exp, parsedFiles.remove(foundKey));
                } else {
                    errors.add("Missing required file: " + exp);
                }
            }
        }

        // Check unexpected files
        for (String actual : parsedFiles.keySet()) {
            if (!expectedFiles.contains(actual)) {
                errors.add("Unexpected file in step " + stepKey + ": " + actual);
            }
        }

        if (!errors.isEmpty()) {
            return new ParseResult(false, parsedFiles, errors, warnings, reconstructClean(parsedFiles));
        }

        // Validate each file
        for (String fileName : expectedFiles) {
            String content = parsedFiles.get(fileName);
            if (content == null || content.length() < 50) {
                errors.add(fileName + " is too short or empty (minimum 50 characters).");
                continue;
            }
            if (content.length() > 200000) {
                errors.add(fileName + " exceeds maximum allowed length of 200,000 characters.");
                continue;
            }

            HeadingConfig cfg = headingConfigs.get(fileName);
            if (cfg != null) {
                validateFileStructure(fileName, content, cfg, errors);
            }

            // Check unclosed Mermaid fences
            int mermaidOpen = countOccurrences(content, "```mermaid");
            int fenceCount = countOccurrences(content, "```");
            if (mermaidOpen > 0 && fenceCount % 2 != 0) {
                errors.add(fileName + ": Unclosed code fence (Mermaid or Markdown block).");
            }

            // Check placeholder text
            if (content.contains("<project name>") || content.contains("<project_name>") || content.contains("<n>") || content.contains("<your project>")) {
                errors.add(fileName + ": Contains unresolved placeholder text (e.g. <project name>).");
            }
        }

        // Step-specific validations
        runStepSpecificValidations(stepKey, parsedFiles, room, brief, rubric, members, memberUsers, approvedIdeas, durationHours, errors, warnings);

        boolean valid = errors.isEmpty();
        return new ParseResult(valid, parsedFiles, errors, warnings, reconstructClean(parsedFiles));
    }

    private void validateFileStructure(String fileName, String content, HeadingConfig cfg, List<String> errors) {
        String[] lines = content.split("\n");
        String firstH1 = null;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("# ")) {
                firstH1 = trimmed;
                break;
            }
        }

        if (firstH1 == null) {
            errors.add(fileName + ": Missing H1 title starting with '# " + cfg.h1Prefix() + "'");
        } else if (!firstH1.toLowerCase().startsWith(("# " + cfg.h1Prefix()).toLowerCase())) {
            errors.add(fileName + ": H1 must start with '# " + cfg.h1Prefix() + "', but found '" + firstH1 + "'");
        }

        // Extract H2 headings
        List<String> actualH2 = new ArrayList<>();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("## ")) {
                actualH2.add(trimmed.substring(3).trim());
            }
        }

        List<String> expectedH2 = cfg.h2Headings();
        for (String exp : expectedH2) {
            boolean found = false;
            for (String act : actualH2) {
                if (act.equalsIgnoreCase(exp) || act.toLowerCase().startsWith(exp.toLowerCase())) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                errors.add(fileName + ": Missing required H2 heading: '## " + exp + "'");
            }
        }

        // Check Reality check heading requirement
        boolean hasRealityCheck = actualH2.stream().anyMatch(h -> h.equalsIgnoreCase("Reality check"));
        if (cfg.requiresRealityCheck() && !hasRealityCheck) {
            errors.add(fileName + ": Missing required '## Reality check' heading.");
        } else if (!cfg.requiresRealityCheck() && hasRealityCheck) {
            errors.add(fileName + ": Must NOT contain a '## Reality check' heading.");
        }
    }

    private void runStepSpecificValidations(
            String stepKey,
            Map<String, String> files,
            Room room,
            Brief brief,
            List<BriefRubricItem> rubric,
            List<RoomMember> members,
            Map<UUID, User> memberUsers,
            List<Idea> approvedIdeas,
            long durationHours,
            List<String> errors,
            List<String> warnings
    ) {
        switch (stepKey.toLowerCase()) {
            case "prd" -> {
                String prd = files.get("PRD.md");
                String mvp = files.get("MVP.md");

                if (prd != null) {
                    Pattern frPattern = Pattern.compile("FR-\\d{3}\\s+\\[(MUST|SHOULD|COULD)\\]");
                    Matcher frMatcher = frPattern.matcher(prd);
                    int frCount = 0;
                    while (frMatcher.find()) {
                        frCount++;
                    }
                    if (frCount < 6) {
                        errors.add("PRD.md: Functional requirements must match 'FR-001 [MUST|SHOULD|COULD]' format (found " + frCount + ", expected at least 6).");
                    }

                    // Coverage warning: every rubric criterion in PRD
                    if (rubric != null) {
                        for (BriefRubricItem r : rubric) {
                            if (r.getCriterion() != null && !prd.toLowerCase().contains(r.getCriterion().toLowerCase().trim())) {
                                warnings.add("Coverage warning: Rubric criterion '" + r.getCriterion() + "' not explicitly mentioned in PRD.md.");
                            }
                        }
                    }

                    // Coverage warning: approved idea title in PRD
                    if (approvedIdeas != null) {
                        for (Idea ai : approvedIdeas) {
                            String firstWords = ai.getText().split("[.\\n]")[0].trim();
                            if (firstWords.length() > 25) firstWords = firstWords.substring(0, 25);
                            if (!prd.toLowerCase().contains(firstWords.toLowerCase())) {
                                warnings.add("Coverage warning: Approved idea '" + firstWords + "...' not found in PRD.md.");
                            }
                        }
                    }
                }

                if (mvp != null) {
                    // Core flow 3 to 5 steps
                    int flowSteps = 0;
                    for (String line : mvp.split("\n")) {
                        if (line.trim().matches("^\\d+\\.\\s+.*")) flowSteps++;
                    }
                    if (flowSteps < 3 || flowSteps > 8) {
                        warnings.add("MVP.md: Core flow should have 3 to 5 numbered steps (found " + flowSteps + ").");
                    }

                    // Reality ledger statuses
                    String lowerMvp = mvp.toLowerCase();
                    boolean hasAllowedStatus = lowerMvp.contains("built this weekend") || lowerMvp.contains("existing library or api")
                            || lowerMvp.contains("mocked") || lowerMvp.contains("planned");
                    if (!hasAllowedStatus) {
                        errors.add("MVP.md: Reality ledger must use allowed status values: 'Built this weekend', 'Existing library or API', 'Mocked', or 'Planned'.");
                    }
                }
            }
            case "tech" -> {
                String stack = files.get("TECH_STACK.md");
                String arch = files.get("ARCHITECTURE.md");

                if (stack != null && brief != null && brief.getTechRules() != null) {
                    String forbidden = brief.getTechRules().toLowerCase();
                    // Check if forbidden tech terms mentioned outside rejected options
                    if (forbidden.contains("forbidden") || forbidden.contains("no ")) {
                        warnings.add("Verify tech choices comply with brief rules and AI-use policy.");
                    }
                }
            }
            case "phases" -> {
                String phases = files.get("PHASES.md");
                if (phases != null) {
                    // Check duration matches
                    if (!phases.contains(String.valueOf(durationHours)) && !phases.contains(durationHours + "h") && !phases.contains(durationHours + " hours")) {
                        warnings.add("Coverage warning: Total duration in PHASES.md does not match room event duration (" + durationHours + " hours).");
                    }
                }
            }
            case "tasks" -> {
                String tasks = files.get("TASKS.md");
                if (tasks != null) {
                    Pattern tKeyPattern = Pattern.compile("###\\s+(T-\\d{3})\\s+-\\s+(.+)");
                    Matcher m = tKeyPattern.matcher(tasks);
                    int count = 0;
                    List<String> foundKeys = new ArrayList<>();
                    while (m.find()) {
                        count++;
                        foundKeys.add(m.group(1));
                    }
                    if (count < 3) {
                        errors.add("TASKS.md: Expected sequential tasks starting from T-001 (found " + count + ").");
                    }

                    // Coverage warning: check all member handles in TASKS
                    if (members != null) {
                        for (RoomMember rm : members) {
                            User u = memberUsers.get(rm.getUserId());
                            if (u != null && u.getUsername() != null) {
                                String handle = "@" + u.getUsername();
                                if (!tasks.contains(handle)) {
                                    warnings.add("Coverage warning: Member " + handle + " is missing from TASKS.md workload summary.");
                                }
                            }
                        }
                    }
                }
            }
            case "demo" -> {
                String qna = files.get("QNA.md");
                if (qna != null) {
                    Pattern qPattern = Pattern.compile("####\\s+Q:\\s+(.+)");
                    Matcher qm = qPattern.matcher(qna);
                    int qCount = 0;
                    while (qm.find()) qCount++;
                    if (qCount < 18) {
                        warnings.add("QNA.md should contain at least 18 questions (found " + qCount + ").");
                    }
                }
            }
        }
    }

    private String reconstructClean(Map<String, String> files) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : files.entrySet()) {
            sb.append("=====FILE: ").append(entry.getKey()).append("=====\n");
            sb.append(entry.getValue()).append("\n");
            sb.append("=====END FILE=====\n\n");
        }
        return sb.toString().trim();
    }

    private int countOccurrences(String str, String target) {
        if (str == null || target == null || target.isEmpty()) return 0;
        int count = 0;
        int idx = 0;
        while ((idx = str.indexOf(target, idx)) != -1) {
            count++;
            idx += target.length();
        }
        return count;
    }
}
