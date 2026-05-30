package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record BoardSummaryDto(
        String id,
        String name,
        List<TaskGroupDto> groups) {
}

