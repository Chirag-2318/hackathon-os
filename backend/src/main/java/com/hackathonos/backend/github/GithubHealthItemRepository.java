package com.hackathonos.backend.github;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GithubHealthItemRepository extends JpaRepository<GithubHealthItem, UUID> {
    List<GithubHealthItem> findByRoomIdOrderByItemKeyAsc(UUID roomId);
    Optional<GithubHealthItem> findByRoomIdAndItemKey(UUID roomId, String itemKey);
    void deleteByRoomId(UUID roomId);
}
