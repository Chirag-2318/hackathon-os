package com.hackathonos.backend.plan;

import java.util.*;

/**
 * Splits markdown documents into structured sections by heading (# and ##).
 */
public class MarkdownSections {

    private final Map<String, String> sections = new LinkedHashMap<>();
    private final List<String> headingOrder = new ArrayList<>();

    public static MarkdownSections parse(String markdown) {
        MarkdownSections result = new MarkdownSections();
        if (markdown == null || markdown.isBlank()) {
            return result;
        }

        String[] lines = markdown.split("\\r?\\n");
        String currentHeading = null;
        StringBuilder currentBody = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("^#{1,6}\\s+.*")) {
                if (currentHeading != null) {
                    result.sections.put(currentHeading, currentBody.toString().trim());
                }
                currentHeading = trimmed;
                result.headingOrder.add(currentHeading);
                currentBody = new StringBuilder();
            } else {
                if (currentHeading != null) {
                    currentBody.append(line).append("\n");
                }
            }
        }

        if (currentHeading != null) {
            result.sections.put(currentHeading, currentBody.toString().trim());
        }

        return result;
    }

    public boolean hasHeading(String heading) {
        if (sections.containsKey(heading)) return true;
        String normalized = normalizeHeading(heading);
        return sections.keySet().stream().anyMatch(k -> normalizeHeading(k).equalsIgnoreCase(normalized));
    }

    public String getSection(String heading) {
        if (sections.containsKey(heading)) return sections.get(heading);
        String normalized = normalizeHeading(heading);
        return sections.entrySet().stream()
                .filter(e -> normalizeHeading(e.getKey()).equalsIgnoreCase(normalized))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse("");
    }

    private static String normalizeHeading(String h) {
        if (h == null) return "";
        return h.replaceAll("^#+\\s*", "").replaceAll("[*#:_`]", "").trim();
    }

    public Map<String, String> getSections() {
        return Collections.unmodifiableMap(sections);
    }

    public List<String> getHeadingOrder() {
        return Collections.unmodifiableList(headingOrder);
    }

    public List<String> getNumberedItems(String heading) {
        String body = getSection(heading);
        if (body.isEmpty()) return Collections.emptyList();
        List<String> items = new ArrayList<>();
        for (String line : body.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.matches("^\\d+\\.\\s+.*")) {
                items.add(trimmed.replaceFirst("^\\d+\\.\\s+", "").trim());
            }
        }
        return items;
    }

    public List<String> getBulletItems(String heading) {
        String body = getSection(heading);
        if (body.isEmpty()) return Collections.emptyList();
        List<String> items = new ArrayList<>();
        for (String line : body.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                items.add(trimmed.substring(2).trim());
            }
        }
        return items;
    }

    public boolean hasTable(String heading) {
        String body = getSection(heading);
        return body.contains("|") && body.contains("---");
    }
}
