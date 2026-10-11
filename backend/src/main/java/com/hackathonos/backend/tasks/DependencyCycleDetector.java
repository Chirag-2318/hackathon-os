package com.hackathonos.backend.tasks;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DependencyCycleDetector {

    public record CycleCheckResult(boolean hasCycle, List<UUID> cyclePath) {}

    /**
     * Checks whether adding the proposed dependencies for targetTaskId creates a cycle.
     */
    public CycleCheckResult detectCycle(
            UUID targetTaskId,
            List<UUID> proposedDependsOn,
            List<TaskDependency> existingDependencies
    ) {
        Map<UUID, List<UUID>> adjacency = new HashMap<>();
        for (TaskDependency dep : existingDependencies) {
            if (!dep.getTaskId().equals(targetTaskId)) {
                adjacency.computeIfAbsent(dep.getTaskId(), k -> new ArrayList<>()).add(dep.getDependsOnTaskId());
            }
        }
        adjacency.put(targetTaskId, new ArrayList<>(proposedDependsOn));

        Set<UUID> visited = new HashSet<>();
        Set<UUID> recursionStack = new HashSet<>();
        List<UUID> path = new ArrayList<>();

        for (UUID startNode : adjacency.keySet()) {
            if (!visited.contains(startNode)) {
                if (dfs(startNode, adjacency, visited, recursionStack, path)) {
                    return new CycleCheckResult(true, path);
                }
            }
        }
        return new CycleCheckResult(false, Collections.emptyList());
    }

    private boolean dfs(
            UUID current,
            Map<UUID, List<UUID>> adj,
            Set<UUID> visited,
            Set<UUID> inStack,
            List<UUID> path
    ) {
        visited.add(current);
        inStack.add(current);
        path.add(current);

        List<UUID> neighbors = adj.getOrDefault(current, Collections.emptyList());
        for (UUID neighbor : neighbors) {
            if (inStack.contains(neighbor)) {
                path.add(neighbor);
                return true;
            }
            if (!visited.contains(neighbor)) {
                if (dfs(neighbor, adj, visited, inStack, path)) {
                    return true;
                }
            }
        }

        inStack.remove(current);
        path.remove(path.size() - 1);
        return false;
    }
}
