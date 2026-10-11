package com.hackathonos.backend.github.calc;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RuleCheckCalculatorTest {

    @Test
    void testZeroPreKickoffCommitsPasses() {
        RuleCheckCalculator.RuleCheckResult result = RuleCheckCalculator.calculate(0);

        assertEquals("pass", result.status());
        assertEquals(0, result.preKickoffCount());
        assertEquals("none", result.severity());
        assertEquals("All commits timestamped after kickoff", result.message());
    }

    @Test
    void testPreKickoffCommitsFails() {
        RuleCheckCalculator.RuleCheckResult result = RuleCheckCalculator.calculate(4);

        assertEquals("fail", result.status());
        assertEquals(4, result.preKickoffCount());
        assertEquals("red", result.severity());
        assertEquals("4 commits made before event kickoff", result.message());
    }
}
