package com.mahindra.backend.dto;

import java.util.List;

public record WorkspaceMemberDto(
        String id,
        String name,
        String email,
        String avatarUrl,
        List<String> roles,
        String workspaceRole) {
}
