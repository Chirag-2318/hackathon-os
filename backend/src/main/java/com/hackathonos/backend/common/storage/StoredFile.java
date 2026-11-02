package com.hackathonos.backend.common.storage;

import java.io.InputStream;

public record StoredFile(
        InputStream inputStream,
        long contentLength,
        String contentType
) {}

