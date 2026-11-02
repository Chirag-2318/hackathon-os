package com.hackathonos.backend.common.storage;

import java.io.InputStream;
import java.util.Optional;

public interface FileStorage {
    void put(String key, InputStream content, String contentType, long contentLength);
    Optional<StoredFile> get(String key);
    boolean delete(String key);
    boolean exists(String key);
    String publicUrlOrNull(String key);
}

