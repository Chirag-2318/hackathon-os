package com.hackathonos.backend.brief;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BriefRubricItemRepository extends JpaRepository<BriefRubricItem, UUID> {
    List<BriefRubricItem> findByBriefIdOrderByPositionAsc(UUID briefId);
    void deleteByBriefId(UUID briefId);

    @Query("SELECT r FROM BriefRubricItem r JOIN Brief b ON r.briefId = b.id WHERE b.roomId = :roomId ORDER BY r.position ASC")
    List<BriefRubricItem> findByRoomIdOrderByOrderIndexAsc(@Param("roomId") UUID roomId);
}
