package com.mahindra.backend.dto.rewards;

import java.util.List;

public record RewardsPageDto(
        int balance,
        int earnedThisMonth,
        int redeemedTotal,
        int teamRank,
        List<RewardItemDto> rewards,
        List<RewardActivityDto> recentActivity) {
}
