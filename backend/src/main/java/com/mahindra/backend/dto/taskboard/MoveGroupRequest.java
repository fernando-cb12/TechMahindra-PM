package com.mahindra.backend.dto.taskboard;

import jakarta.validation.constraints.NotNull;

public record MoveGroupRequest(
        @NotNull Long toBoardId,
        Integer position) {
}
