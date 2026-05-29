package com.mahindra.backend.dto.taskboard;

import java.util.Map;

public record BoardViewDto(
        String id,
        String name,
        String type,
        int order,
        boolean isDefault,
        Map<String, Object> config) {
}

