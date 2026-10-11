package com.hackathonos.backend.tasks;

import com.hackathonos.backend.rooms.Room;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TaskKeyService {

    public record TaskKeyResult(String key, int number) {}

    private final JdbcClient jdbcClient;

    public TaskKeyService(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /**
     * Atomically increments the room's task counter and returns the next formatted task key (e.g. CBS-12).
     */
    @Transactional
    public String nextKey(Room room) {
        return nextKeyResult(room).key();
    }

    /**
     * Atomically increments the room's task counter and returns the key and number.
     */
    @Transactional
    public TaskKeyResult nextKeyResult(Room room) {
        return nextKeyResult(room.getId(), room.getKeyPrefix());
    }

    @Transactional
    public TaskKeyResult nextKeyResult(UUID roomId, String defaultPrefix) {
        return jdbcClient.sql("""
                UPDATE rooms
                SET task_counter = task_counter + 1, updated_at = now()
                WHERE id = :roomId
                RETURNING task_counter, key_prefix
                """)
                .param("roomId", roomId)
                .query((rs, rowNum) -> {
                    int counter = rs.getInt("task_counter");
                    String prefix = rs.getString("key_prefix");
                    if (prefix == null || prefix.isBlank()) {
                        prefix = (defaultPrefix != null && !defaultPrefix.isBlank()) ? defaultPrefix : "TASK";
                    }
                    String key = prefix.trim().toUpperCase() + "-" + counter;
                    return new TaskKeyResult(key, counter);
                })
                .single();
    }
}
