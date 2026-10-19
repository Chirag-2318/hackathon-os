package com.hackathonos.backend.pitchkit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class QnaDocumentParser {

    private QnaDocumentParser() {}

    public static String hashQuestion(String q) {
        if (q == null) return "";
        String norm = q.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(norm.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(norm.hashCode());
        }
    }

    public record ParsedItem(
            String hash,
            String kind,
            String category,
            String criterion,
            String question,
            String answer,
            String followup,
            String counter,
            String proof,
            String ownerHandle,
            int position
    ) {}

    public static List<ParsedItem> parseQnaDocument(String content, Set<String> knownCriteria) {
        List<ParsedItem> result = new ArrayList<>();
        if (content == null || content.isBlank()) return result;

        int pos = 0;

        // 1. "Questions" section
        String qSection = extractSection(content, "Questions");
        if (!qSection.isBlank()) {
            Pattern catPattern = Pattern.compile("(?im)^###\\s*(.*)$");
            Matcher catMatcher = catPattern.matcher(qSection);

            List<int[]> catSpans = new ArrayList<>();
            List<String> catNames = new ArrayList<>();
            while (catMatcher.find()) {
                catNames.add(catMatcher.group(1).trim());
                catSpans.add(new int[]{catMatcher.end(), 0});
            }
            for (int i = 0; i < catSpans.size(); i++) {
                int end = (i + 1 < catSpans.size()) ? catSpans.get(i + 1)[0] : qSection.length();
                catSpans.get(i)[1] = end;
            }

            Pattern qPattern = Pattern.compile("(?im)^####\\s*(?:Q:?\\s*)?(.*)$");

            for (int i = 0; i < catNames.size(); i++) {
                String rawCatName = catNames.get(i);
                String catBlock = qSection.substring(catSpans.get(i)[0], catSpans.get(i)[1]);

                // Determine criterion if category matches "Rubric: <criterion>" or matches known criteria
                String criterion = null;
                String displayCategory = rawCatName;
                if (rawCatName.toLowerCase(Locale.ROOT).startsWith("rubric:")) {
                    criterion = rawCatName.substring(7).trim();
                    displayCategory = criterion;
                } else if (knownCriteria != null) {
                    for (String kc : knownCriteria) {
                        if (rawCatName.equalsIgnoreCase(kc)) {
                            criterion = kc;
                            break;
                        }
                    }
                }

                Matcher qm = qPattern.matcher(catBlock);
                while (qm.find()) {
                    String qText = qm.group(1).replaceAll("[*_]", "").trim();
                    int qStart = qm.end();
                    int qEnd = catBlock.length();
                    Matcher nextQm = qPattern.matcher(catBlock);
                    if (nextQm.find(qStart)) {
                        qEnd = nextQm.start();
                    }
                    String qBlock = catBlock.substring(qStart, qEnd);

                    String answer = extractBulletValue(qBlock, "Answer");
                    String followup = extractBulletValue(qBlock, "Follow-up");
                    String counter = extractBulletValue(qBlock, "Counter");
                    String proof = extractBulletValue(qBlock, "Proof");
                    String ownerHandle = extractOwnerHandle(extractBulletValue(qBlock, "Owner"));

                    String hash = hashQuestion(qText);
                    result.add(new ParsedItem(
                            hash, "QUESTION", displayCategory, criterion,
                            qText, answer, followup, counter, proof, ownerHandle, pos++
                    ));
                }
            }
        }

        // 2. "Code defense drills" -> kind = CODE
        pos = parseListSection(content, "Code defense drills", "CODE", "Code defense", pos, result);

        // 3. "Hard truths" -> kind = TRUTH
        pos = parseListSection(content, "Hard truths", "TRUTH", "Hard truths", pos, result);

        // 4. "Questions to ask the judges" -> kind = ASK
        parseListSection(content, "Questions to ask the judges", "ASK", "Questions to ask the judges", pos, result);

        return result;
    }

    private static int parseListSection(String content, String sectionTitle, String kind, String category, int pos, List<ParsedItem> out) {
        String sec = extractSection(content, sectionTitle);
        if (sec.isBlank()) return pos;

        // Lines starting with - or * or numbers
        Pattern itemPattern = Pattern.compile("(?m)^[-*]\\s+(.*)$");
        Matcher m = itemPattern.matcher(sec);
        while (m.find()) {
            String line = m.group(1).trim();
            if (line.isBlank()) continue;

            String qText = line;
            String answer = "";
            String proof = "";
            if (line.contains(" - ")) {
                String[] parts = line.split(" - ", 2);
                qText = parts[0].replaceAll("[*_]", "").trim();
                answer = parts[1].trim();
            } else if (line.contains(": ")) {
                String[] parts = line.split(": ", 2);
                qText = parts[0].replaceAll("[*_]", "").trim();
                answer = parts[1].trim();
            }

            String hash = hashQuestion(qText);
            out.add(new ParsedItem(
                    hash, kind, category, null,
                    qText, answer, "", "", proof, null, pos++
            ));
        }
        return pos;
    }

    private static String extractSection(String content, String title) {
        Pattern p = Pattern.compile("(?im)^##\\s*(?:\\d+\\.\\s*)?" + Pattern.quote(title) + ".*$");
        Matcher m = p.matcher(content);
        if (!m.find()) return "";

        int start = m.end();
        Matcher nextH2 = Pattern.compile("(?im)^##\\s+").matcher(content);
        int end = content.length();
        if (nextH2.find(start)) {
            end = nextH2.start();
        }
        return content.substring(start, end);
    }

    private static String extractBulletValue(String block, String bullet) {
        Pattern p = Pattern.compile("(?im)^[-*]\\s*(?:\\*\\*)?" + bullet + "\\s*:?(?:\\*\\*)?\\s*(.*)$");
        Matcher m = p.matcher(block);
        if (m.find()) {
            return m.group(1).trim();
        }
        return "";
    }

    private static String extractOwnerHandle(String ownerStr) {
        if (ownerStr == null || ownerStr.isBlank()) return null;
        Matcher m = Pattern.compile("@([a-zA-Z0-9_.-]+)").matcher(ownerStr);
        if (m.find()) {
            return m.group(1);
        }
        return ownerStr.trim().replaceAll("^@", "");
    }
}
