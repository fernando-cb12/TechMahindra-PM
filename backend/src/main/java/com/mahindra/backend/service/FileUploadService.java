package com.mahindra.backend.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import com.mahindra.backend.dto.PresignedUploadResponse;

@Service
public class FileUploadService {

    private final String bucketName;
    private final String region;
    private final String accessKey;
    private final String secretKey;
    private final String publicBaseUrl;
    private final long presignedUrlExpirationSeconds;

    public FileUploadService(
            @Value("${aws.s3.bucket-name:}") String bucketName,
            @Value("${aws.s3.region:us-east-1}") String region,
            @Value("${aws.s3.access-key:}") String accessKey,
            @Value("${aws.s3.secret-key:}") String secretKey,
            @Value("${aws.s3.public-base-url:}") String publicBaseUrl,
            @Value("${aws.s3.presigned-url-expiration-seconds:300}") long presignedUrlExpirationSeconds) {
        this.bucketName = bucketName;
        this.region = region;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.publicBaseUrl = trimToNull(publicBaseUrl);
        this.presignedUrlExpirationSeconds = presignedUrlExpirationSeconds;
    }

    public PresignedUploadResponse createWorkspaceBannerUpload(String fileName, String contentType) {
        validateConfiguration();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Banner file must be an image");
        }

        String key = "workspace-banners/%s-%s".formatted(
                Instant.now().toEpochMilli(),
                sanitizeFileName(fileName));
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(presignedUrlExpirationSeconds))
                .putObjectRequest(objectRequest)
                .build();

        try (S3Presigner presigner = buildPresigner()) {
            String uploadUrl = presigner.presignPutObject(presignRequest).url().toString();
            return new PresignedUploadResponse(uploadUrl, publicUrlFor(key), key);
        }
    }

    private S3Presigner buildPresigner() {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    private void validateConfiguration() {
        if (bucketName == null || bucketName.isBlank()) {
            throw new IllegalStateException("AWS_S3_BUCKET_NAME is not configured");
        }
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("AWS_ACCESS_KEY_ID is not configured");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("AWS_SECRET_ACCESS_KEY is not configured");
        }
    }

    private String publicUrlFor(String key) {
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8).replace("+", "%20").replace("%2F", "/");
        if (publicBaseUrl != null) {
            return publicBaseUrl.replaceAll("/+$", "") + "/" + encodedKey;
        }
        return "https://%s.s3.%s.amazonaws.com/%s".formatted(bucketName, region, encodedKey);
    }

    private static String sanitizeFileName(String original) {
        String fallback = UUID.randomUUID() + ".bin";
        if (original == null || original.isBlank()) {
            return fallback;
        }
        String sanitized = original.strip().replaceAll("[^A-Za-z0-9._-]", "-");
        return sanitized.isBlank() ? fallback : sanitized;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
