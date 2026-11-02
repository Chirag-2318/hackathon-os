package com.hackathonos.backend.common.storage;

import com.hackathonos.backend.common.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class FileStorageConfig {

    private static final Logger log = LoggerFactory.getLogger(FileStorageConfig.class);

    @Bean
    @Primary
    public FileStorage fileStorage(AppProperties appProperties) {
        String provider = appProperties.getStorage() != null ? appProperties.getStorage().getProvider() : "local";
        if ("s3".equalsIgnoreCase(provider)) {
            log.info("Configuring S3CompatibleFileStorage with bucket={}", appProperties.getStorage().getS3().getBucket());
            return new S3CompatibleFileStorage(appProperties.getStorage().getS3());
        }
        log.info("Configuring LocalDiskFileStorage at root={}", appProperties.getUploadDir());
        return new LocalDiskFileStorage(appProperties);
    }
}

