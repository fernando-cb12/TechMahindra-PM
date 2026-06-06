package com.mahindra.backend.dto.metrics;

import java.util.Map;

public record MetricPresetOverrideRequest(
        Map<String, Object> config) {
}
