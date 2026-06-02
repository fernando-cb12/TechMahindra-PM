package com.mahindra.backend.dto.career;

import java.util.List;

public record CareerPageDto(
        int rankProgress,
        int currentXp,
        int maxXp,
        int earnedBadges,
        int totalBadges,
        List<CareerRankStepDto> ranks,
        List<CareerStatDto> stats,
        List<CareerBadgeDto> badges) {
}
