package com.mahindra.backend.dto.mytasks;

import java.util.List;

import com.mahindra.backend.dto.taskboard.FileAttachmentDto;
import com.mahindra.backend.dto.taskboard.TaskActivityDto;
import com.mahindra.backend.dto.taskboard.TaskUpdateDto;
import com.mahindra.backend.dto.taskboard.UserSummaryDto;

public record MyTaskItemDto(
        String id,
        String workspaceId,
        String workspaceName,
        String boardId,
        String boardName,
        String groupId,
        String groupName,
        String groupColor,
        String name,
        String status,
        String statusLabel,
        String statusColor,
        String workflow,
        String priority,
        String priorityLabel,
        String priorityColor,
        String dueDate,
        Integer progress,
        List<UserSummaryDto> assignees,
        List<TaskUpdateDto> updates,
        List<FileAttachmentDto> files,
        List<TaskActivityDto> activities,
        String createdAt,
        String updatedAt) {
}
