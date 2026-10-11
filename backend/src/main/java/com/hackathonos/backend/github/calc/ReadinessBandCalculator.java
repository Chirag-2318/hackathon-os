package com.hackathonos.backend.github.calc;

import com.hackathonos.backend.github.GithubHealthItem;

import java.util.ArrayList;
import java.util.List;

public class ReadinessBandCalculator {

    public record ReadinessBandResult(
            int passed,
            int total,
            String headline, // "judge-ready" | "almost" | "needs-work"
            String subline,
            List<String> missingLabels
    ) {}

    /**
     * Pure calculation of repository judge readiness based on health items.
     */
    public static ReadinessBandResult calculate(List<GithubHealthItem> healthItems) {
        if (healthItems == null || healthItems.isEmpty()) {
            return new ReadinessBandResult(0, 0, "needs-work", "No repository health checks evaluated yet.", List.of());
        }

        int total = healthItems.size();
        int passed = 0;
        List<String> missing = new ArrayList<>();

        for (GithubHealthItem item : healthItems) {
            if ("pass".equalsIgnoreCase(item.getStatus())) {
                passed++;
            } else {
                missing.add(item.getLabel());
            }
        }

        double ratio = (double) passed / (double) total;
        String headline;
        String subline;

        if (ratio >= 0.85) {
            headline = "judge-ready";
            subline = "Repository meets judging requirements (" + passed + "/" + total + " checks passed).";
        } else if (ratio >= 0.60) {
            headline = "almost";
            subline = passed + "/" + total + " checks passed. Resolve remaining items before demo freeze.";
        } else {
            headline = "needs-work";
            subline = passed + "/" + total + " checks passed. Critical deliverables or instructions missing.";
        }

        return new ReadinessBandResult(passed, total, headline, subline, missing);
    }
}
