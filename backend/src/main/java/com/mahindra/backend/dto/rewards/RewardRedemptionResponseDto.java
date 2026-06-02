package com.mahindra.backend.dto.rewards;

public record RewardRedemptionResponseDto(
        String redemptionId,
        String status,
        int balance,
        RewardActivityDto activity) {
}
