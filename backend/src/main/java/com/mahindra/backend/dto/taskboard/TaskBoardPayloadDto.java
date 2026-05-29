package com.mahindra.backend.dto.taskboard;

import java.util.List;
import java.util.Map;

public record TaskBoardPayloadDto(
        BoardConfigDto boardConfig,
        List<TaskGroupDto> groups,
        Map<String, TaskDto> tasks,
        Map<String, UserSummaryDto> users,
        List<BoardSummaryDto> availableBoards,
        List<BoardViewDto> views) {
}

