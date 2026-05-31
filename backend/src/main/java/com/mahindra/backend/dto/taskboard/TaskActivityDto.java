package com.mahindra.backend.dto.taskboard;

import java.util.Map;

public record TaskActivityDto(
        String id,
        String taskId,
        String actorId,
        String actorName,
        String actorInitials,
        String eventType,
        String fieldKey,
        Object oldValue,
        Object newValue,
        String createdAt,
        Map<String, Object> metadata) {
}
