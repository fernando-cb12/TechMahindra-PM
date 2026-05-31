package com.mahindra.backend.dto.ai;

public record DraftTaskDto(
        String name,
        String description,
        String priority,
        String status,
        String dueDate) {
}
