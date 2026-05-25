package com.mahindra.backend.dto;

public record PresignedUploadResponse(
        String uploadUrl,
        String publicUrl,
        String key) {
}
