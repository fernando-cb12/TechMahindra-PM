package com.mahindra.backend.dto.metrics;

import java.util.Map;

public record MetricPresetOverrideDto(
        String presetId,
        Map<String, Object> config,
        String createdAt,
        String updatedAt) {
}
