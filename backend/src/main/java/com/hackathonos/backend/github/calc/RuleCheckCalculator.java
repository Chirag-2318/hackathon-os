package com.hackathonos.backend.github.calc;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

public class RuleCheckCalculator {

    public record RuleCheckResult(String status, int preKickoffCount, String message, String severity) {}

    /**
     * Checks whether default branch contains commits before official event kickoff.
     */
    public static RuleCheckResult calculate(int preKickoffCount) {
        if (preKickoffCount > 0) {
            return new RuleCheckResult(
                    "fail",
                    preKickoffCount,
                    preKickoffCount + " commits made before event kickoff",
                    "red"
            );
        }
        return new RuleCheckResult("pass", 0, "All commits timestamped after kickoff", "none");
    }
}
