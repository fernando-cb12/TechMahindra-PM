package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record TaskGroupDto(
        String id,
        String workspaceId,
        String name,
        String color,
        int order,
        List<String> taskIds) {
}

