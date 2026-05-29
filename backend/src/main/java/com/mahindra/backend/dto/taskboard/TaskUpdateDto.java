package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record TaskUpdateDto(
        String id,
        String taskId,
        String authorId,
        String content,
        String createdAt,
        String updatedAt,
        List<FileAttachmentDto> attachments,
        List<String> mentions) {
}

