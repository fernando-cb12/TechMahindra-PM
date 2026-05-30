package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record ColumnDefinitionDto(
        String id,
        String label,
        String type,
        Integer width,
        boolean isVisible,
        int order,
        List<SelectOptionDto> options,
        boolean isSystemColumn) {
}

