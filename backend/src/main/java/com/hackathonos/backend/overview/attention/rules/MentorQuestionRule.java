package com.hackathonos.backend.overview.attention.rules;

import com.hackathonos.backend.common.security.CurrentUser;
import com.hackathonos.backend.github.GithubAttentionDismissal;
import com.hackathonos.backend.github.GithubAttentionDismissalRepository;
import com.hackathonos.backend.mentor.MentorQuestionRepository;
import com.hackathonos.backend.overview.attention.AttentionItem;
import com.hackathonos.backend.overview.attention.AttentionRule;
import com.hackathonos.backend.rooms.Room;
import com.hackathonos.backend.users.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class MentorQuestionRule implements AttentionRule {

    private final MentorQuestionRepository mentorQuestionRepository;
    private final GithubAttentionDismissalRepository dismissalRepository;
    private final CurrentUser currentUser;

    public MentorQuestionRule(MentorQuestionRepository mentorQuestionRepository,
                              GithubAttentionDismissalRepository dismissalRepository,
                              CurrentUser currentUser) {
        this.mentorQuestionRepository = mentorQuestionRepository;
        this.dismissalRepository = dismissalRepository;
        this.currentUser = currentUser;
    }

    @Override
    public List<AttentionItem> check(Room room) {
        User current = currentUser.get();
        if (current != null && dismissalRepository.existsById(new GithubAttentionDismissal.GithubAttentionDismissalId(room.getId(), "mentor_question", current.getId()))) {
            return Collections.emptyList();
        }

        long openQuestions = mentorQuestionRepository.countByRoomIdAndStatus(room.getId(), "OPEN");
        if (openQuestions > 0) {
            return List.of(new AttentionItem(
                    "mentor_question",
                    "mentor_question",
                    "gray",
                    openQuestions + " unanswered mentor question" + (openQuestions > 1 ? "s" : ""),
                    "Mentors gave feedback or asked clarifying questions.",
                    "Review questions",
                    "/app/room/" + room.getId() + "/team",
                    List.of()
            ));
        }
        return Collections.emptyList();
    }
}
