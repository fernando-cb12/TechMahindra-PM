package com.mahindra.backend.dto.metrics;

import java.util.Map;

public record MetricDashboardRequest(
        String name,
        String scopeType,
        String scopeId,
        Boolean isDefault,
        String visibility,
        Map<String, Object> config) {
}
