package com.hackathonos.backend.brief;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BriefRubricItemRepository extends JpaRepository<BriefRubricItem, UUID> {
    List<BriefRubricItem> findByBriefIdOrderByPositionAsc(UUID briefId);
    void deleteByBriefId(UUID briefId);
}
