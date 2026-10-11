package com.hackathonos.backend.templates;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventTemplateRepository extends JpaRepository<EventTemplate, String> {
    List<EventTemplate> findAllByOrderBySortOrderAsc();
}
