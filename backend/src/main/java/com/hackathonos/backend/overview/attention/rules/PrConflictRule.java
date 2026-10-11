package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.github.GithubBranch;
import com.hackathonos.backend.github.GithubBranchRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class PrConflictRule implements AttentionRule {

    private final GithubBranchRepository branchRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public PrConflictRule(GithubBranchRepository branchRepository,
                          GithubAttentionDismissalRepository dismissalRepository,
                          CurrentUser currentUser) {
        this.branchRepository = branchRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "pr_conflict", current.getId()))) {
            return Collections.emptyList();
        }

        List<GithubBranch> branches = branchRepository.findByRoomId(room.getId());
        List<AttentionItem> items = new ArrayList<>();

        for (GithubBranch b : branches) {
            if (b.isPrConflicts()) {
                String prLabel = b.getPrNumber() != null ? "PR #" + b.getPrNumber() : "branch '" + b.getName() + "'";
                items.add(new AttentionItem(
                        "pr_conflict",
                        "pr_conflict",
                        "red",
                        "Merge conflict on " + prLabel,
                        "Resolve conflicts with base branch before code freeze.",
                        "View branch",
                        "/app/room/" + room.getId() + "/github",
                        List.of()
                ));
                break;
            }
        }
        return items;
    }
}
