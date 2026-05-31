package com.mahindra.backend.dto.ai;

import java.util.List;

public record DraftBoardDto(
        String name,
        String description,
        List<DraftGroupDto> groups) {
}
