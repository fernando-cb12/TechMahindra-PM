package com.mahindra.backend.dto.taskboard;

public record FileAttachmentDto(
        String id,
        String name,
        String url,
        String uploadedAt,
        String type,
        long size,
        UserSummaryDto uploadedBy) {
}

