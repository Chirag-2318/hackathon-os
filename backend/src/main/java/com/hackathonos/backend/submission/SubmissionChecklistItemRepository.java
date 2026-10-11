package com.hackathonos.backend.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionChecklistItemRepository extends JpaRepository<SubmissionChecklistItem, UUID> {
    List<SubmissionChecklistItem> findByRoomIdOrderByLabelAsc(UUID roomId);
    Optional<SubmissionChecklistItem> findByRoomIdAndItemKey(UUID roomId, String itemKey);
    void deleteByRoomId(UUID roomId);
}
