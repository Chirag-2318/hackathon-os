package com.hackathonos.backend.tasks;

import com.hackathonos.backend.plan.PlanPhase;
import com.hackathonos.backend.tasks.dto.*;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TaskDtoMapper {

    public TaskUserDto toUserDto(User user) {
        if (user == null) return null;
        String name = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : (user.getUsername() != null ? user.getUsername() : (user.getEmail() != null ? user.getEmail() : "Member"));
        String initials = computeInitials(name);
        String username = user.getUsername();
        com.hackathonos.backend.users.dto.UserSummaryDto userSummary = com.hackathonos.backend.users.dto.UserSummaryDto.from(user, name);
        return new TaskUserDto(user.getId(), name, initials, user.getAvatarUrl(), username, userSummary);
    }

    public String computeInitials(String name) {
        if (name == null || name.isBlank()) return "MB";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    public String normalizeStatus(String status) {
        if (status == null) return "todo";
        String s = status.trim().toLowerCase();
        if (s.equals("in_progress") || s.equals("inprogress")) return "inprogress";
        if (s.equals("done")) return "done";
        return "todo";
    }

    public String normalizePriority(String priority) {
        if (priority == null) return "medium";
        return priority.trim().toLowerCase();
    }

    public TaskDto toDto(
            Task task,
            PlanPhase phase,
            User assignee,
            User reporter,
            List<String> labels,
            List<Subtask> subtasks,
            List<TaskAcceptanceItem> acceptance,
            List<TaskDependencyItemDto> dependsOn,
            List<TaskDependencyItemDto> blocks,
            int commentCount
    ) {
        return toDto(task, phase, assignee, reporter, labels, subtasks, acceptance, dependsOn, blocks, commentCount, false);
    }

    public TaskDto toDto(
            Task task,
            PlanPhase phase,
            User assignee,
            User reporter,
            List<String> labels,
            List<Subtask> subtasks,
            List<TaskAcceptanceItem> acceptance,
            List<TaskDependencyItemDto> dependsOn,
            List<TaskDependencyItemDto> blocks,
            int commentCount,
            boolean hasBranch
    ) {
        TaskPhaseSummaryDto phaseDto = phase != null
                ? new TaskPhaseSummaryDto(phase.getId(), phase.getName())
                : null;

        List<TaskSubtaskDto> subtaskDtos = new ArrayList<>();
        int subtasksDone = 0;
        if (subtasks != null) {
            for (Subtask st : subtasks) {
                if (st.isDone()) subtasksDone++;
                subtaskDtos.add(new TaskSubtaskDto(st.getId(), st.getText(), st.isDone()));
            }
        }

        List<TaskAcceptanceDto> acceptanceDtos = new ArrayList<>();
        if (acceptance != null) {
            for (TaskAcceptanceItem ai : acceptance) {
                acceptanceDtos.add(new TaskAcceptanceDto(ai.getId(), ai.getText(), ai.isDone()));
            }
        }

        return new TaskDto(
                task.getId(),
                task.getTaskKey(),
                task.getSummary(),
                task.getDescription(),
                normalizeStatus(task.getStatus()),
                task.isFlagged(),
                task.getBlockedReason(),
                normalizePriority(task.getPriority()),
                phaseDto,
                task.getPhaseId(),
                task.getRoleLabel() != null ? task.getRoleLabel() : "Frontend",
                labels != null ? labels : Collections.emptyList(),
                task.getEstimateMin(),
                task.getDueAt(),
                toUserDto(assignee),
                task.getAssigneeId(),
                toUserDto(reporter),
                task.getReporterId(),
                subtaskDtos,
                subtasksDone,
                subtaskDtos.size(),
                acceptanceDtos,
                dependsOn != null ? dependsOn : Collections.emptyList(),
                blocks != null ? blocks : Collections.emptyList(),
                commentCount,
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getCompletedAt(),
                task.getVersion(),
                hasBranch
        );
    }

    public TaskDto toSimpleDto(Task task) {
        if (task == null) return null;
        return toDto(task, null, null, null, Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), 0);
    }

    public TaskDetailDto toDetailDto(
            Task task,
            PlanPhase phase,
            User assignee,
            User reporter,
            List<String> labels,
            List<Subtask> subtasks,
            List<TaskAcceptanceItem> acceptance,
            List<TaskDependencyItemDto> dependsOn,
            List<TaskDependencyItemDto> blocks,
            List<TaskCommentDto> comments,
            List<TaskHistoryDto> history,
            List<TaskDevelopmentDto> development,
            boolean hasBranch
    ) {
        TaskDto basic = toDto(task, phase, assignee, reporter, labels, subtasks, acceptance, dependsOn, blocks, comments != null ? comments.size() : 0, hasBranch);
        return new TaskDetailDto(
                basic.id(),
                basic.key(),
                basic.summary(),
                basic.description(),
                basic.status(),
                basic.flagged(),
                basic.blockedReason(),
                basic.priority(),
                basic.phase(),
                basic.phaseId(),
                basic.role(),
                basic.labels(),
                basic.estimateMin(),
                basic.dueAt(),
                basic.assignee(),
                basic.assigneeId(),
                basic.reporter(),
                basic.reporterId(),
                basic.subtasks(),
                basic.subtasksDone(),
                basic.subtaskCount(),
                basic.acceptance(),
                basic.dependsOn(),
                basic.blocks(),
                basic.commentCount(),
                comments != null ? comments : Collections.emptyList(),
                history != null ? history : Collections.emptyList(),
                basic.createdAt(),
                basic.updatedAt(),
                basic.completedAt(),
                basic.version(),
                development != null ? development : Collections.emptyList(),
                hasBranch
        );
    }
}
