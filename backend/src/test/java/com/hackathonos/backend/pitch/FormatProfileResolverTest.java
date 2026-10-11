package com.hackathonos.backend.pitch;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FormatProfileResolverTest {

    @Test
    void testResolveLivePitch() {
        FormatProfileResolver.FormatProfile profile =
                FormatProfileResolver.resolve("Booth live judging with mentors", "Live prototype demo");

        assertEquals("live_3min", profile.kind());
        assertEquals(180, profile.targetSeconds());
        assertEquals(8, profile.maxSlides());
        assertTrue(profile.auto());
    }

    @Test
    void testResolvePptFirst() {
        FormatProfileResolver.FormatProfile profile =
                FormatProfileResolver.resolve("Screening round with PPT slide evaluation", "Deck export");

        assertEquals("ppt_first", profile.kind());
        assertEquals(300, profile.targetSeconds());
        assertEquals(10, profile.maxSlides());
        assertTrue(profile.auto());
    }

    @Test
    void testResolveAsyncVideoWithDuration() {
        FormatProfileResolver.FormatProfile profile1 =
                FormatProfileResolver.resolve("Async submission", "3 minute video link");

        assertEquals("async_video", profile1.kind());
        assertEquals(180, profile1.targetSeconds());
        assertEquals(6, profile1.maxSlides());

        FormatProfileResolver.FormatProfile profile2 =
                FormatProfileResolver.resolve("Virtual showcase", "60 second video recording");

        assertEquals("async_video", profile2.kind());
        assertEquals(60, profile2.targetSeconds());
    }

    @Test
    void testResolveDefaultFallback() {
        FormatProfileResolver.FormatProfile profile =
                FormatProfileResolver.resolve("Unspecified", "GitHub repo link");

        assertEquals("demo_90s", profile.kind());
        assertEquals(90, profile.targetSeconds());
        assertEquals(5, profile.maxSlides());
    }

    @Test
    void testGetProfileForKind() {
        FormatProfileResolver.FormatProfile p1 = FormatProfileResolver.getProfileForKind("live_3min");
        assertEquals("live_3min", p1.kind());
        assertEquals(180, p1.targetSeconds());
        assertFalse(p1.auto());

        FormatProfileResolver.FormatProfile p2 = FormatProfileResolver.getProfileForKind("ppt_first");
        assertEquals("ppt_first", p2.kind());
        assertEquals(300, p2.targetSeconds());
        assertFalse(p2.auto());

        FormatProfileResolver.FormatProfile p3 = FormatProfileResolver.getProfileForKind("async_video");
        assertEquals("async_video", p3.kind());
        assertEquals(120, p3.targetSeconds());
        assertFalse(p3.auto());

        FormatProfileResolver.FormatProfile p4 = FormatProfileResolver.getProfileForKind("unknown");
        assertEquals("demo_90s", p4.kind());
        assertEquals(90, p4.targetSeconds());
        assertFalse(p4.auto());
    }
}
