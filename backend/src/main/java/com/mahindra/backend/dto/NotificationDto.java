package com.mahindra.backend.dto;

import java.time.Instant;
import java.util.Map;

public record NotificationDto(
        String id,
        String eventType,
        String title,
        String body,
        String linkPath,
        Map<String, Object> metadata,
        boolean read,
        Instant readAt,
        String emailStatus,
        Instant createdAt,
        ActorDto actor) {

    public record ActorDto(String id, String name, String email) {
    }
}
