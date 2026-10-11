package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.github.GithubHealthItem;
import com.hackathonos.backend.github.GithubHealthItemRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class RepoHealthRule implements AttentionRule {

    private final GithubHealthItemRepository healthRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public RepoHealthRule(GithubHealthItemRepository healthRepository,
                          GithubAttentionDismissalRepository dismissalRepository,
                          CurrentUser currentUser) {
        this.healthRepository = healthRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "repo_health", current.getId()))) {
            return Collections.emptyList();
        }

        List<GithubHealthItem> items = healthRepository.findByRoomIdOrderByItemKeyAsc(room.getId());
        List<String> failedRequired = new ArrayList<>();
        for (GithubHealthItem item : items) {
            if (item.isRequired() && "fail".equalsIgnoreCase(item.getStatus())) {
                failedRequired.add(item.getLabel());
            }
        }

        if (!failedRequired.isEmpty()) {
            return List.of(new AttentionItem(
                    "repo_health",
                    "repo_health",
                    "amber",
                    "Missing required repo checks: " + String.join(", ", failedRequired),
                    "Brief rubrics require these items to be present in the repository.",
                    "Fix health",
                    "/app/room/" + room.getId() + "/github",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
