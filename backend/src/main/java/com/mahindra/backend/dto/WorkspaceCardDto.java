package com.mahindra.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record WorkspaceCardDto(
        String id,
        String title,
        String description,
        String imageUrl,
        List<String> members,
        int currentProgress,
        int estimatedProgress,
        String dueDate,
        String budgetLabel,
        String status) {
}
