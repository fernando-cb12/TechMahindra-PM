package com.mahindra.backend.dto.metrics;

import java.util.Map;

public record MetricDashboardDto(
        String id,
        String name,
        String scopeType,
        String scopeId,
        boolean isDefault,
        String visibility,
        Map<String, Object> config,
        String createdAt,
        String updatedAt) {
}
