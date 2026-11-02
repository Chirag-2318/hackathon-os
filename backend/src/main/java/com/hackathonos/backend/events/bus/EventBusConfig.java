package com.hackathonos.backend.events.bus;

import com.hackathonos.backend.events.RoomEventHub;
import com.hackathonos.backend.events.RoomEventRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.simple.JdbcClient;

@Configuration
public class EventBusConfig {

    @Bean
    @ConditionalOnProperty(name = "app.events.bus", havingValue = "postgres")
    public EventBus postgresNotifyEventBus(@Lazy RoomEventHub eventHub,
                                           JdbcClient jdbcClient,
                                           Environment environment,
                                           RoomEventRepository eventRepository) {
        return new PostgresNotifyEventBus(eventHub, jdbcClient, environment, eventRepository);
    }

    @Bean
    @ConditionalOnProperty(name = "app.events.bus", havingValue = "local", matchIfMissing = true)
    public EventBus localEventBus(@Lazy RoomEventHub eventHub) {
        return new LocalEventBus(eventHub);
    }
}
