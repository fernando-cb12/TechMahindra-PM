package com.mahindra.backend.dto.metrics;

public record MetricSemanticFieldDto(
        String semanticKey,
        String label,
        String boardId,
        String boardName,
        String workspaceId,
        String workspaceName,
        boolean missing,
        String sourceType,
        String sourceKey,
        String sourceLabel) {
}
