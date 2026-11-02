package com.hackathonos.backend.common.storage;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryFileStorage implements FileStorage {

    private record Entry(byte[] data, String contentType) {}

    private final Map<String, Entry> storage = new ConcurrentHashMap<>();

    @Override
    public void put(String key, InputStream content, String contentType, long contentLength) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            content.transferTo(baos);
            byte[] bytes = baos.toByteArray();
            storage.put(cleanKey, new Entry(bytes, contentType));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read stream in InMemoryFileStorage", e);
        }
    }

    @Override
    public Optional<StoredFile> get(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        Entry entry = storage.get(cleanKey);
        if (entry == null) {
            return Optional.empty();
        }
        return Optional.of(new StoredFile(new ByteArrayInputStream(entry.data), entry.data.length, entry.contentType));
    }

    @Override
    public boolean delete(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        return storage.remove(cleanKey) != null;
    }

    @Override
    public boolean exists(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        return storage.containsKey(cleanKey);
    }

    @Override
    public String publicUrlOrNull(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        return "/uploads/" + cleanKey;
    }

    public void clear() {
        storage.clear();
    }
}

