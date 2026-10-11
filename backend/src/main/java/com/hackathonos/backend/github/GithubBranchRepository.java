package com.hackathonos.backend.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GithubBranchRepository extends JpaRepository<GithubBranch, UUID> {
    List<GithubBranch> findByRoomIdOrderByUpdatedAtDesc(UUID roomId);
    List<GithubBranch> findByRoomId(UUID roomId);
    Optional<GithubBranch> findByRoomIdAndName(UUID roomId, String name);
    List<GithubBranch> findByRoomIdAndRole(UUID roomId, String role);
    void deleteByRoomId(UUID roomId);
}
