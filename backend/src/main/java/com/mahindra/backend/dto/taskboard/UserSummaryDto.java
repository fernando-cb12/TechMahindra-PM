package com.mahindra.backend.dto.taskboard;

public record UserSummaryDto(
        String id,
        String name,
        String avatarUrl,
        String initials,
        String email) {
}

