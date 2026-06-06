package com.mahindra.backend.dto.metrics;

import java.util.List;
import java.util.Map;

public record MetricQueryResponse(
        String metric,
        String dimension,
        Map<String, Object> data,
        List<String> warnings) {
}
