package com.mahindra.backend.dto.taskboard;

import jakarta.validation.constraints.NotBlank;

public record CreateTaskRequest(
        @NotBlank String name,
        String priority,
        String dueDate) {
}

