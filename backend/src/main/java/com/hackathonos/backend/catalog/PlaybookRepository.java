package com.hackathonos.backend.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybookRepository extends JpaRepository<Playbook, String> {
    List<Playbook> findAllByOrderBySortOrderAsc();
    List<Playbook> findByCategoryAndSlugNotOrderBySortOrderAsc(String category, String slug);
}
