package com.mahindra.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CreateWorkspaceProjectRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotEmpty List<@NotNull Long> memberUserIds,
        String dueDate,
        String budgetLabel,
        String imageUrl,
        String status) {
}
