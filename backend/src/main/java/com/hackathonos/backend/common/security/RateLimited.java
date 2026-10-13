package com.hackathonos.backend.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce token bucket in-memory rate limiting on controller methods.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {
    /**
     * Rate limit category or prefix key.
     */
    String key() default "default";

    /**
     * Capacity / tokens allowed in the time window.
     */
    int limit() default 10;

    /**
     * Window duration in seconds (default 60s / 1 minute).
     */
    int periodSeconds() default 60;
}
