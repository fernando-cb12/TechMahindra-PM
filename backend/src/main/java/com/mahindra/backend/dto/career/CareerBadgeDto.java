package com.mahindra.backend.dto.career;

public record CareerBadgeDto(
        String id,
        String name,
        String subtitle,
        String description,
        String icon,
        String status,
        String earnedDate) {
}
