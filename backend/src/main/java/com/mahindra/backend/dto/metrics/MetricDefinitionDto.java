package com.mahindra.backend.dto.metrics;

import java.util.List;

public record MetricDefinitionDto(
        String id,
        String label,
        String description,
        List<String> compatibleDimensions,
        List<String> compatibleVisualizations) {
}
