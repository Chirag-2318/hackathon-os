package com.hackathonos.backend.common.storage;

import com.hackathonos.backend.common.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

public class LocalDiskFileStorage implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(LocalDiskFileStorage.class);
    private final Path rootDir;

    public LocalDiskFileStorage(AppProperties appProperties) {
        this.rootDir = Path.of(appProperties.getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            log.error("Failed to create upload root directory at {}", this.rootDir, e);
        }
    }

    public LocalDiskFileStorage(Path rootDir) {
        this.rootDir = rootDir.toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            log.error("Failed to create upload root directory at {}", this.rootDir, e);
        }
    }

    @Override
    public void put(String key, InputStream content, String contentType, long contentLength) {
        Path target = resolvePath(key);
        try {
            if (target.getParent() != null) {
                Files.createDirectories(target.getParent());
            }
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write file to local disk: " + key, e);
        }
    }

    @Override
    public Optional<StoredFile> get(String key) {
        Path target = resolvePath(key);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            return Optional.empty();
        }
        try {
            long size = Files.size(target);
            String contentType = Files.probeContentType(target);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            InputStream in = Files.newInputStream(target);
            return Optional.of(new StoredFile(in, size, contentType));
        } catch (IOException e) {
            log.warn("Error reading local file: {}", key, e);
            return Optional.empty();
        }
    }

    @Override
    public boolean delete(String key) {
        Path target = resolvePath(key);
        try {
            return Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", key, e);
            return false;
        }
    }

    @Override
    public boolean exists(String key) {
        Path target = resolvePath(key);
        return Files.exists(target) && Files.isRegularFile(target);
    }

    @Override
    public String publicUrlOrNull(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        return "/uploads/" + cleanKey;
    }

    private Path resolvePath(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        Path resolved = rootDir.resolve(cleanKey).normalize();
        if (!resolved.startsWith(rootDir)) {
            throw new IllegalArgumentException("Path traversal attempt: " + key);
        }
        return resolved;
    }
}

