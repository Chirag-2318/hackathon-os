package com.hackathonos.backend.ideas;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface IdeaNoteRepository extends JpaRepository<IdeaNote, UUID> {
    List<IdeaNote> findByIdeaId(UUID ideaId);
    List<IdeaNote> findByIdeaIdIn(Collection<UUID> ideaIds);
    void deleteByIdeaId(UUID ideaId);
}
