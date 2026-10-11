package com.hackathonos.backend.readiness;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure calculator evaluating 7 readiness dimensions, calculating weak spots, and scoring.
 */
public class ReadinessCalculator {

    public record ReadinessItem(
            String label,
            boolean ok,
            String route
    ) {}

    public record ReadinessCategory(
            String key,
            String label,
            int passed,
            int total,
            int percent,
            List<ReadinessItem> items
    ) {}

    public record WeakSpotItem(
            String id,
            String code,
            String title,
            String severity, // "high", "medium", "low"
            int percent,
            String owner,
            String updatedAt,
            String route
    ) {}

    public record ReadinessRing(
            String id,
            String label,
            double progress, // 0 to 1
            String valueText,
            String destination
    ) {}

    public record CalculationResult(
            int score,
            String label,
            List<ReadinessCategory> categories,
            List<WeakSpotItem> weakSpots,
            List<ReadinessRing> rings
    ) {}

    public static CalculationResult calculate(
            List<ReadinessItem> rubricItems,
            List<ReadinessItem> mvpItems,
            List<ReadinessItem> demoItems,
            List<ReadinessItem> submissionItems,
            List<ReadinessItem> teamItems,
            List<ReadinessItem> repoItems,
            List<ReadinessItem> deliveryItems
    ) {
        List<ReadinessCategory> categories = new ArrayList<>();
        categories.add(buildCategory("rubric", "Rubric Coverage", rubricItems));
        categories.add(buildCategory("mvp", "MVP Health", mvpItems));
        categories.add(buildCategory("demo", "Demo Readiness", demoItems));
        categories.add(buildCategory("submission", "Submission Center", submissionItems));
        categories.add(buildCategory("team", "Team & Roles", teamItems));
        categories.add(buildCategory("repo", "Repository & Code", repoItems));
        categories.add(buildCategory("delivery", "Sprint Delivery", deliveryItems));

        int sumPercents = 0;
        for (ReadinessCategory cat : categories) {
            sumPercents += cat.percent();
        }
        int overallScore = Math.round((float) sumPercents / categories.size());

        // Weak spots: failed items from lowest percent categories
        List<WeakSpotItem> weakSpots = new ArrayList<>();
        List<ReadinessCategory> sortedCategories = new ArrayList<>(categories);
        sortedCategories.sort((a, b) -> Integer.compare(a.percent(), b.percent()));

        for (ReadinessCategory cat : sortedCategories) {
            for (ReadinessItem item : cat.items()) {
                if (!item.ok() && weakSpots.size() < 3) {
                    String code = cat.key().length() >= 2 ? cat.key().substring(0, 2).toUpperCase() : "WS";
                    String severity = cat.percent() < 40 ? "high" : (cat.percent() < 75 ? "medium" : "low");
                    weakSpots.add(new WeakSpotItem(
                            cat.key() + "-" + weakSpots.size(),
                            code,
                            item.label(),
                            severity,
                            cat.percent(),
                            "Team",
                            "just now",
                            item.route()
                    ));
                }
            }
        }

        // Six rings (or 7) for frontend rings view
        List<ReadinessRing> rings = new ArrayList<>();
        for (ReadinessCategory cat : categories) {
            double prog = cat.total() > 0 ? (double) cat.passed() / cat.total() : 0.0;
            rings.add(new ReadinessRing(
                    cat.key(),
                    cat.label(),
                    prog,
                    cat.passed() + "/" + cat.total(),
                    cat.items().isEmpty() ? "/app" : cat.items().get(0).route()
            ));
        }

        return new CalculationResult(
                overallScore,
                "Estimate, not a prediction",
                categories,
                weakSpots,
                rings
        );
    }

    private static ReadinessCategory buildCategory(String key, String label, List<ReadinessItem> items) {
        if (items == null || items.isEmpty()) {
            return new ReadinessCategory(key, label, 0, 1, 0, List.of(new ReadinessItem("Not initialized", false, "/app")));
        }
        int passed = 0;
        for (ReadinessItem i : items) {
            if (i.ok()) passed++;
        }
        int total = items.size();
        int pct = Math.round(((float) passed / total) * 100);
        return new ReadinessCategory(key, label, passed, total, pct, items);
    }
}
