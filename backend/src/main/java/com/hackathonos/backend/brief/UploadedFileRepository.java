package com.hackathonos.backend.brief;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, UUID> {
    List<UploadedFile> findByRoomIdOrderByCreatedAtDesc(UUID roomId);
    List<UploadedFile> findByUploadedBy(UUID uploadedBy);
    void deleteByUploadedBy(UUID uploadedBy);
    void deleteByRoomId(UUID roomId);
}
