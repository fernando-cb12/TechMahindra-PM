package com.mahindra.backend.dto.taskboard;

public record FileAttachmentInputDto(
        String name,
        String url,
        String type,
        Long size) {
}

