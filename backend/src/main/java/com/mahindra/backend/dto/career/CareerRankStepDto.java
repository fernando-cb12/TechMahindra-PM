package com.mahindra.backend.dto.career;

public record CareerRankStepDto(
        String id,
        String label,
        Integer pointsRequired,
        boolean current,
        boolean unlocked) {
}
