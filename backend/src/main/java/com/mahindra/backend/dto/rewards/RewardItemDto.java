package com.mahindra.backend.dto.rewards;

public record RewardItemDto(
        String id,
        String name,
        String description,
        String meta,
        int cost,
        String category,
        String iconVariant,
        String badge) {
}
