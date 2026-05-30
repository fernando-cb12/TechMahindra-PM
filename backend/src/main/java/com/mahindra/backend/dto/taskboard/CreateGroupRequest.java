package com.mahindra.backend.dto.taskboard;

import jakarta.validation.constraints.NotBlank;

public record CreateGroupRequest(
        @NotBlank String name,
        String color) {
}

