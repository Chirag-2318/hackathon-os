package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.*;
import com.hackathonos.backend.github.calc.RuleCheckCalculator;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
public class RepoRulesRule implements AttentionRule {

    private final GithubRepoRepository repoRepository;
    private final GithubCommitRepository commitRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public RepoRulesRule(GithubRepoRepository repoRepository,
                         GithubCommitRepository commitRepository,
                         GithubAttentionDismissalRepository dismissalRepository,
                         CurrentUser currentUser) {
        this.repoRepository = repoRepository;
        this.commitRepository = commitRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        if (!repoRepository.existsById(room.getId())) return Collections.emptyList();

        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "repo_rules", current.getId()))) {
            return Collections.emptyList();
        }

        Instant kickoff = room.getEventStart() != null ? room.getEventStart() : Instant.now();
        long preKickoffCount = commitRepository.countByRoomIdAndCommittedAtBefore(room.getId(), kickoff);

        if (preKickoffCount > 0) {
            return List.of(new AttentionItem(
                    "repo_rules",
                    "repo_rules",
                    "red",
                    "Pre-kickoff commits detected (" + preKickoffCount + ")",
                    "Commits timestamped before official kickoff may violate hackathon rules.",
                    "Review repo",
                    "/app/room/" + room.getId() + "/github",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
