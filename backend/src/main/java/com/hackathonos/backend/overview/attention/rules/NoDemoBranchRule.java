package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.github.GithubBranch;
import com.hackathonos.backend.github.GithubBranchRepository;
import com.hackathonos.backend.github.GithubRepoRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class NoDemoBranchRule implements AttentionRule {

    private final GithubRepoRepository repoRepository;
    private final GithubBranchRepository branchRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public NoDemoBranchRule(GithubRepoRepository repoRepository,
                            GithubBranchRepository branchRepository,
                            GithubAttentionDismissalRepository dismissalRepository,
                            CurrentUser currentUser) {
        this.repoRepository = repoRepository;
        this.branchRepository = branchRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        if (!repoRepository.existsById(room.getId())) return Collections.emptyList();

        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "no_demo_branch", current.getId()))) {
            return Collections.emptyList();
        }

        List<GithubBranch> demoBranches = branchRepository.findByRoomIdAndRole(room.getId(), "demo-safe");
        if (demoBranches.isEmpty()) {
            return List.of(new AttentionItem(
                    "no_demo_branch",
                    "no_demo_branch",
                    "amber",
                    "No demo-safe branch designated",
                    "Designate a stable branch to protect your presentation build from last-minute breaks.",
                    "Set demo branch",
                    "/app/room/" + room.getId() + "/github",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
