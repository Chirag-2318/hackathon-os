package com.hackathonos.backend.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GithubCommitRepository extends JpaRepository<GithubCommit, UUID> {
    List<GithubCommit> findByRoomIdOrderByCommittedAtDesc(UUID roomId);
    Optional<GithubCommit> findByRoomIdAndSha(UUID roomId, String sha);
    long countByRoomId(UUID roomId);
    long countByRoomIdAndCommittedAtBefore(UUID roomId, Instant kickoff);
    void deleteByRoomId(UUID roomId);
}
