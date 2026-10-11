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
public class DemoBehindRule implements AttentionRule {

    private final GithubBranchRepository branchRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public DemoBehindRule(GithubBranchRepository branchRepository,
                          GithubAttentionDismissalRepository dismissalRepository,
                          CurrentUser currentUser) {
        this.branchRepository = branchRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "demo_behind", current.getId()))) {
            return Collections.emptyList();
        }

        List<GithubBranch> demoBranches = branchRepository.findByRoomIdAndRole(room.getId(), "demo-safe");
        List<AttentionItem> items = new ArrayList<>();

        for (GithubBranch b : demoBranches) {
            if (b.getBehind() > 0) {
                items.add(new AttentionItem(
                        "demo_behind",
                        "demo_behind",
                        "amber",
                        "Demo-safe branch '" + b.getName() + "' is " + b.getBehind() + " commits behind main",
                        "Merge or rebase main into demo-safe to prevent surprises during demo.",
                        "Inspect branch",
                        "/app/room/" + room.getId() + "/github",
                        List.of()
                ));
                break;
            }
        }
        return items;
    }
}
