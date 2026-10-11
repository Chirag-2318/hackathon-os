package com.hackathonos.backend.overview.attention;

import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.tasks.Task;
import com.hackathonos.backend.tasks.TaskRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class UnassignedTasksRule implements AttentionRule {

    private final TaskRepository taskRepository;

    public UnassignedTasksRule(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        List<Task> tasks = taskRepository.findByRoomId(room.getId());
        List<String> unassignedKeys = new ArrayList<>();

        for (Task t : tasks) {
            boolean isDone = "DONE".equalsIgnoreCase(t.getStatus());
            if (!isDone && t.getAssigneeId() == null) {
                unassignedKeys.add(t.getTaskKey());
            }
        }

        if (unassignedKeys.isEmpty()) return Collections.emptyList();

        int count = unassignedKeys.size();
        String title = count + " unassigned task" + (count > 1 ? "s" : "");
        String sample = String.join(", ", unassignedKeys.subList(0, Math.min(3, count)));
        String helper = count > 3 ? sample + " and " + (count - 3) + " more have no owner" : sample + " have no owner";

        return List.of(new AttentionItem(
                "unassigned-tasks-" + room.getId(),
                "UNASSIGNED_TASKS",
                "amber",
                title,
                helper,
                "Assign on board",
                "/app/room/" + room.getId() + "/board",
                Collections.emptyList()
        ));
    }
}
