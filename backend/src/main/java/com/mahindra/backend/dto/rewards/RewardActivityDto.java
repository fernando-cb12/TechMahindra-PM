package com.mahindra.backend.dto.rewards;

public record RewardActivityDto(
        String id,
        String type,
        String category,
        String label,
        String detail,
        int points,
        String createdAt) {
}
