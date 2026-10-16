package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import com.hackathonos.backend.users.User;
import com.hackathonos.backend.users.UserRepository;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class BlockedTasksRule implements AttentionRule {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public BlockedTasksRule(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        List<Task> blocked = taskRepository.findByRoomIdAndFlaggedTrueAndStatusNot(room.getId(), "DONE").stream()
                .filter(t -> !t.isDropped())
                .toList();
        if (blocked.isEmpty()) return Collections.emptyList();

        Set<UUID> userIds = new HashSet<>();
        for (Task t : blocked) if (t.getAssigneeId() != null) userIds.add(t.getAssigneeId());
        Map<UUID, User> userMap = new HashMap<>();
        for (User u : userRepository.findAllById(userIds)) userMap.put(u.getId(), u);

        List<String> details = new ArrayList<>();
        List<AttentionItem.AttentionOwnerDto> owners = new ArrayList<>();
        Set<UUID> addedOwners = new HashSet<>();

        for (Task t : blocked) {
            User u = userMap.get(t.getAssigneeId());
            String ownerName = u != null ? u.getName() : "Unassigned";
            details.add(t.getTaskKey() + " (" + ownerName + ")");
            if (u != null && addedOwners.add(u.getId())) {
                owners.add(new AttentionItem.AttentionOwnerDto(u.getId(), u.getName(), u.getAvatarUrl()));
            }
        }

        int count = blocked.size();
        String title = count + " task" + (count > 1 ? "s" : "") + " blocked";
        String helper = String.join(", ", details);
        String route = "/app/room/" + room.getId() + "/board?filter=blocked";

        return List.of(new AttentionItem(
                "blocked-tasks-" + room.getId(),
                "BLOCKED_TASKS",
                "red",
                title,
                helper,
                "View blocked tasks",
                route,
                owners
        ));
    }
}
