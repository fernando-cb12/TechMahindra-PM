package com.mahindra.backend.dto.taskboard;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record TaskPatchRequest(
        String name,
        List<String> assigneeIds,
        String status,
        String priority,
        Integer pointsValue,
        String dueDate,
        Integer progress,
        BigDecimal budget,
        Map<String, Object> values) {
}

