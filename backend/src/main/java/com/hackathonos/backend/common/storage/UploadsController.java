package com.hackathonos.backend.common.storage;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Optional;

@RestController
public class UploadsController {

    private final FileStorage fileStorage;

    public UploadsController(FileStorage fileStorage) {
        this.fileStorage = fileStorage;
    }

    @GetMapping("/uploads/**")
    public ResponseEntity<Resource> serveUpload(HttpServletRequest request) {
        String uri = request.getRequestURI();
        int prefixIdx = uri.indexOf("/uploads/");
        if (prefixIdx < 0) {
            return ResponseEntity.notFound().build();
        }

        String key = uri.substring(prefixIdx + "/uploads/".length());
        if (key.isBlank() || key.contains("..")) {
            return ResponseEntity.badRequest().build();
        }

        Optional<StoredFile> storedOpt = fileStorage.get(key);
        if (storedOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StoredFile stored = storedOpt.get();
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(stored.contentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .contentType(mediaType);

        if (stored.contentLength() > 0) {
            builder.contentLength(stored.contentLength());
        }

        return builder.body(new InputStreamResource(stored.inputStream()));
    }
}

