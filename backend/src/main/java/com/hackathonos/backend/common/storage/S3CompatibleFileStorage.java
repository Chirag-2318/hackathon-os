package com.hackathonos.backend.common.storage;

import com.hackathonos.backend.common.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;
import java.net.URI;
import java.util.Optional;

public class S3CompatibleFileStorage implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(S3CompatibleFileStorage.class);

    private final S3Client s3Client;
    private final String bucket;

    public S3CompatibleFileStorage(AppProperties.StorageProperties.S3Properties props) {
        this.bucket = props.getBucket();

        S3ClientBuilder builder = S3Client.builder();

        if (props.getEndpoint() != null && !props.getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(props.getEndpoint()));
        }

        String regionStr = (props.getRegion() != null && !props.getRegion().isBlank()) ? props.getRegion() : "us-east-1";
        builder.region(Region.of("auto".equalsIgnoreCase(regionStr) ? "us-east-1" : regionStr));

        if (props.getAccessKey() != null && !props.getAccessKey().isBlank()
                && props.getSecretKey() != null && !props.getSecretKey().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey())
            ));
        }

        if (props.isPathStyle()) {
            builder.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }

        this.s3Client = builder.build();
    }

    public S3CompatibleFileStorage(S3Client s3Client, String bucket) {
        this.s3Client = s3Client;
        this.bucket = bucket;
    }

    @Override
    public void put(String key, InputStream content, String contentType, long contentLength) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(cleanKey)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        s3Client.putObject(req, RequestBody.fromInputStream(content, contentLength));
    }

    @Override
    public Optional<StoredFile> get(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        try {
            GetObjectRequest req = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(cleanKey)
                    .build();

            ResponseInputStream<GetObjectResponse> responseStream = s3Client.getObject(req);
            GetObjectResponse resp = responseStream.response();
            String contentType = resp.contentType() != null ? resp.contentType() : "application/octet-stream";
            long length = resp.contentLength() != null ? resp.contentLength() : -1;
            return Optional.of(new StoredFile(responseStream, length, contentType));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.warn("S3 getObject failed for key={}: {}", cleanKey, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public boolean delete(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        try {
            DeleteObjectRequest req = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(cleanKey)
                    .build();
            s3Client.deleteObject(req);
            return true;
        } catch (Exception e) {
            log.warn("S3 deleteObject failed for key={}: {}", cleanKey, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean exists(String key) {
        String cleanKey = key.startsWith("/") ? key.substring(1) : key;
        try {
            HeadObjectRequest req = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(cleanKey)
                    .build();
            s3Client.headObject(req);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String publicUrlOrNull(String key) {
        return null;
    }
}

