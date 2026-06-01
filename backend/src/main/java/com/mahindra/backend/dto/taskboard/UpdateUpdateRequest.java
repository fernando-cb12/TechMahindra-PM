package com.mahindra.backend.dto.taskboard;

import java.util.List;

public record UpdateUpdateRequest(
        String content,
        List<String> mentions) {
}
