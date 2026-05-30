package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record ColumnUpdateRequest(
        String id,
        String label,
        String type,
        Integer width,
        Boolean visible,
        Integer order,
        List<SelectOptionDto> options) {
}
