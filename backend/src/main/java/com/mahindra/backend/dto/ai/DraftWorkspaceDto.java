package com.mahindra.backend.dto.ai;

public record DraftWorkspaceDto(
        String title,
        String description,
        String dueDate,
        String budgetLabel) {
}
