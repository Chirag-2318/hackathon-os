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

import java.util.Collections;
import java.util.List;

@Component
public class StaleBranchRule implements AttentionRule {

    private final GithubBranchRepository branchRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public StaleBranchRule(GithubBranchRepository branchRepository,
                           GithubAttentionDismissalRepository dismissalRepository,
                           CurrentUser currentUser) {
        this.branchRepository = branchRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "stale_branch", current.getId()))) {
            return Collections.emptyList();
        }

        List<GithubBranch> stale = branchRepository.findByRoomIdAndRole(room.getId(), "stale");
        if (!stale.isEmpty()) {
            return List.of(new AttentionItem(
                    "stale_branch",
                    "stale_branch",
                    "gray",
                    stale.size() + " stale branches detected",
                    "Merged or inactive branches clutter the repo map.",
                    "Review branches",
                    "/app/room/" + room.getId() + "/github",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
