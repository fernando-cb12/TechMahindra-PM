package com.mahindra.backend.dto.metrics;

import java.util.List;
import java.util.Map;

public record MetricQueryRequest(
        String metric,
        String dimension,
        List<String> workspaceIds,
        List<String> boardIds,
        String dateFrom,
        String dateTo,
        Map<String, Object> filters,
        String customFieldKey,
        String aggregation,
        Boolean includeComparison,
        String comparisonMode,
        String segmentLabel) {
}
