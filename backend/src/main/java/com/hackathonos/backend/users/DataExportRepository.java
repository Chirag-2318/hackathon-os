package com.hackathonos.backend.users;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DataExportRepository extends JpaRepository<DataExport, UUID> {
    Optional<DataExport> findByIdAndUserId(UUID id, UUID userId);
    void deleteByUserId(UUID userId);
}
