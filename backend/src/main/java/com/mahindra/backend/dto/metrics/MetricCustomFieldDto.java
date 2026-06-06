package com.mahindra.backend.dto.metrics;

public record MetricCustomFieldDto(
        String workspaceId,
        String workspaceName,
        String boardId,
        String boardName,
        String key,
        String label,
        String type,
        boolean canMeasure,
        boolean canDimension,
        boolean canFilter) {
}
