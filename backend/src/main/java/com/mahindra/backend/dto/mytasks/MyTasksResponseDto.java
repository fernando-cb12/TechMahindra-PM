package com.mahindra.backend.dto.mytasks;

import java.util.List;

public record MyTasksResponseDto(
        List<MyTaskItemDto> items,
        MyTasksSummaryDto summary) {
}
