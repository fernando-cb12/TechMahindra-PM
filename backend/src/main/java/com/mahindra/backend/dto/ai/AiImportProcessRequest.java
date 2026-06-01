package com.mahindra.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;

public record AiImportProcessRequest(
        @NotBlank String key,
        String fileName) {
}
