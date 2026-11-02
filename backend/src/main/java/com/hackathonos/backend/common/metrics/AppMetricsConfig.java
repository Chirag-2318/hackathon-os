package com.hackathonos.backend.common.metrics;

import com.hackathonos.backend.ai.AiCircuitBreaker;
import com.hackathonos.backend.email.EmailOutbox;
import com.hackathonos.backend.email.EmailOutboxRepository;
import com.hackathonos.backend.events.RoomEventHub;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppMetricsConfig {

    @Bean
    public MeterBinder customAppGauges(
            RoomEventHub roomEventHub,
            AiCircuitBreaker aiCircuitBreaker,
            EmailOutboxRepository emailOutboxRepository
    ) {
        return (MeterRegistry registry) -> {
            // 1. SSE Connection Metrics
            Gauge.builder("sse.connections.rooms", roomEventHub, RoomEventHub::getActiveRoomEmittersCount)
                    .description("Number of active room SSE emitters")
                    .register(registry);

            Gauge.builder("sse.connections.notifications", roomEventHub, RoomEventHub::getActiveNotificationEmittersCount)
                    .description("Number of active user notification SSE emitters")
                    .register(registry);

            Gauge.builder("sse.connections.total", roomEventHub, RoomEventHub::getActiveConnectionCount)
                    .description("Total number of active SSE connections")
                    .register(registry);

            // 2. AI Circuit Breaker Status (0 = closed/healthy, 1 = open/failing-fast)
            Gauge.builder("ai.circuit_breaker.open", aiCircuitBreaker, cb -> cb.allowRequest() ? 0.0 : 1.0)
                    .description("AI Gateway circuit breaker state: 0 for healthy, 1 for open")
                    .register(registry);

            // 3. Email Outbox Pending Queue Depth
            Gauge.builder("email.outbox.pending", emailOutboxRepository, repo -> (double) repo.countByStatus(EmailOutbox.Status.PENDING))
                    .description("Number of pending emails queued in the outbox")
                    .register(registry);
        };
    }
}

