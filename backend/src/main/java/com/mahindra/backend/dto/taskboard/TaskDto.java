package com.mahindra.backend.dto.taskboard;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record TaskDto(
        String id,
        String name,
        String groupId,
        String workspaceId,
        String assigneeId,
        List<String> assigneeIds,
        String status,
        String priority,
        String dueDate,
        int progress,
        BigDecimal budget,
        List<FileAttachmentDto> files,
        List<TaskUpdateDto> updates,
        List<TaskActivityDto> activities,
        String createdAt,
        String updatedAt,
        Map<String, Object> values) {
}

