package com.mahindra.backend.dto.ai;

import java.util.List;

public record DraftGroupDto(
        String name,
        List<DraftTaskDto> tasks) {
}
