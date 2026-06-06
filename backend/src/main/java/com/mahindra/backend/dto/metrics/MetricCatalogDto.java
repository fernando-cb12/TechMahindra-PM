package com.mahindra.backend.dto.metrics;

import java.util.List;

public record MetricCatalogDto(
        List<MetricDefinitionDto> metrics,
        List<MetricDimensionDto> dimensions,
        List<MetricCustomFieldDto> customFields,
        List<MetricUserDto> assignees,
        List<String> warnings,
        List<MetricSemanticFieldDto> semanticFields) {
}
