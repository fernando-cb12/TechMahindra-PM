package com.mahindra.backend.dto.ai;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record AiWorkspaceApproveRequest(
        @NotNull AiWorkspaceDraftDto draft,
        List<Long> memberUserIds,
        String status) {
}
