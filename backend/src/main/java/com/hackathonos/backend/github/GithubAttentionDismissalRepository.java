package com.hackathonos.backend.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GithubAttentionDismissalRepository extends JpaRepository<GithubAttentionDismissal, GithubAttentionDismissal.GithubAttentionDismissalId> {
    List<GithubAttentionDismissal> findByRoomIdAndUserId(UUID roomId, UUID userId);
    void deleteByRoomIdAndItemKey(UUID roomId, String itemKey);
    void deleteByRoomId(UUID roomId);
}
