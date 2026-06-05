package com.mahindra.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AiImportProcessRequest(
        @NotBlank String key,
        String fileName,
        @NotNull AiWorkspaceMode mode) {
}
