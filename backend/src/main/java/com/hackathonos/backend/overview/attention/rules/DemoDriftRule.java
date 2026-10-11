package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.github.GithubFrozenDemo;
import com.hackathonos.backend.github.GithubFrozenDemoRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class DemoDriftRule implements AttentionRule {

    private final GithubFrozenDemoRepository frozenRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public DemoDriftRule(GithubFrozenDemoRepository frozenRepository,
                         GithubAttentionDismissalRepository dismissalRepository,
                         CurrentUser currentUser) {
        this.frozenRepository = frozenRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "demo_drift", current.getId()))) {
            return Collections.emptyList();
        }

        Optional<GithubFrozenDemo> frozenOpt = frozenRepository.findById(room.getId());
        if (frozenOpt.isPresent() && frozenOpt.get().getCommitsSince() > 0) {
            GithubFrozenDemo f = frozenOpt.get();
            return List.of(new AttentionItem(
                    "demo_drift",
                    "demo_drift",
                    "amber",
                    "Frozen demo has drifted by " + f.getCommitsSince() + " commits",
                    "New commits arrived on branch '" + f.getBranchName() + "' after demo freeze.",
                    "Review drift",
                    "/app/room/" + room.getId() + "/github",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
