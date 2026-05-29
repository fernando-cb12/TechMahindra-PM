package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record BoardConfigDto(
        String workspaceId,
        String boardName,
        List<ColumnDefinitionDto> columns,
        List<SelectOptionDto> statusOptions,
        List<SelectOptionDto> priorityOptions) {
}

