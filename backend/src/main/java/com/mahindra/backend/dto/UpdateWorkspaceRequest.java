package com.mahindra.backend.dto;

public record UpdateWorkspaceRequest(
        String title,
        String description,
        String dueDate,
        String budgetLabel,
        String imageUrl,
        String status) {
}
