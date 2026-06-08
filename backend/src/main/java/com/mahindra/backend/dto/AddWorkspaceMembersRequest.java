package com.mahindra.backend.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record AddWorkspaceMembersRequest(
        @NotEmpty List<@NotNull Long> userIds) {
}
