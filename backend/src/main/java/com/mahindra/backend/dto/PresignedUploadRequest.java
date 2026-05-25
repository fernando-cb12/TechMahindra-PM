package com.mahindra.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record PresignedUploadRequest(
        @NotBlank String fileName,
        @NotBlank String contentType) {
}
