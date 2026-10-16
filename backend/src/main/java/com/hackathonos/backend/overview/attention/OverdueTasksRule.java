package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Component
public class OverdueTasksRule implements AttentionRule {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public OverdueTasksRule(TaskRepository taskRepository, UserRepository userRepository, Clock clock) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        Instant now = clock.instant();
        List<Task> tasks = taskRepository.findByRoomId(room.getId());
        List<Task> overdue = new ArrayList<>();

        for (Task t : tasks) {
            if (t.isDropped()) continue;
            boolean isDone = t.isConfirmedDone();
            if (!isDone && t.getDueAt() != null && t.getDueAt().isBefore(now)) {
                overdue.add(t);
            }
        }

        if (overdue.isEmpty()) return Collections.emptyList();

        Set<UUID> userIds = new HashSet<>();
        for (Task t : overdue) if (t.getAssigneeId() != null) userIds.add(t.getAssigneeId());
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);

        List<String> keys = new ArrayList<>();
        List<AttentionItem.AttentionOwnerDto> owners = new ArrayList<>();
        Set<UUID> added = new HashSet<>();

        for (Task t : overdue) {
            keys.add(t.getTaskKey());
            User u = userMap.get(t.getAssigneeId());
            if (u != null && added.add(u.getId())) {
                owners.add(new AttentionItem.AttentionOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()));
            }
        }

        int count = overdue.size();
        String title = count + " task" + (count > 1 ? "s" : "") + " overdue";
        String helper = String.join(", ", keys) + " missed planned due time";
        String route = "/app/room/" + room.getId() + "/board";

        return List.of(new AttentionItem(
                "overdue-tasks-" + room.getId(),
                "OVERDUE_TASKS",
                "red",
                title,
                helper,
                "View board",
                route,
                owners
        ));
    }
}
