package com.hackathonos.backend.hackathons;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathonos.backend.hackathons.dto.HackathonDtos.HackathonSourceItemDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Collections;
import java.util.List;

@Component
public class FileHackathonSource implements HackathonSource {

    private static final Logger log = LoggerFactory.getLogger(FileHackathonSource.class);

    private final String filePath;
    private final ObjectMapper objectMapper;

    public FileHackathonSource(
            @Value("${app.hackathons.file:./config/hackathons.json}") String filePath,
            ObjectMapper objectMapper
    ) {
        this.filePath = filePath;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<HackathonSourceItemDto> fetch() {
        File file = new File(filePath);
        if (!file.exists()) {
            File fallback = new File("config/hackathons.json");
            if (fallback.exists()) {
                file = fallback;
            } else {
                try {
                    if (file.getParentFile() != null) {
                        file.getParentFile().mkdirs();
                    }
                    Files.writeString(file.toPath(), "[]");
                    log.info("Created missing hackathons source file at {}", file.getAbsolutePath());
                } catch (IOException e) {
                    log.error("Failed to create hackathons source file at {}: {}", file.getAbsolutePath(), e.getMessage());
                    return Collections.emptyList();
                }
            }
        }

        try {
            return objectMapper.readValue(file, new TypeReference<List<HackathonSourceItemDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse hackathons JSON from {}: {}", file.getAbsolutePath(), e.getMessage());
            return Collections.emptyList();
        }
    }
}
