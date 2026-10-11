package com.hackathonos.backend.ideas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface IdeaLinkRepository extends JpaRepository<IdeaLink, UUID> {
    List<IdeaLink> findByIdeaId(UUID ideaId);
    List<IdeaLink> findByIdeaIdIn(Collection<UUID> ideaIds);
    void deleteByIdeaId(UUID ideaId);
}
