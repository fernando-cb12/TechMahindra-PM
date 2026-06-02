package com.mahindra.backend.dto.taskboard;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record AddBoardMembersRequest(
        @NotEmpty List<@NotNull Long> userIds
) {
}
