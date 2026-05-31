package com.mahindra.backend.dto.ai;

import java.util.List;

public record AiWorkspaceDraftDto(
        String id,
        DraftWorkspaceDto workspace,
        List<DraftBoardDto> boards,
        String sourceFileName) {
}
