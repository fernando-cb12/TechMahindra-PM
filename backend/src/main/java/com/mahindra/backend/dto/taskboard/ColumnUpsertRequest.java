package com.mahindra.backend.dto.taskboard;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record ColumnUpsertRequest(
        @NotBlank String label,
        @NotBlank String type,
        Integer width,
        Boolean visible,
        Integer order,
        List<SelectOptionDto> options) {
}

