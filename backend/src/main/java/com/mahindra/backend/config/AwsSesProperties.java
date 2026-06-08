package com.mahindra.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aws.ses")
public record AwsSesProperties(
        boolean enabled,
        String region,
        String fromEmail,
        String accessKey,
        String secretKey) {
}
