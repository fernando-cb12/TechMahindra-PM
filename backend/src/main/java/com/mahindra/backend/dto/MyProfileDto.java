package com.mahindra.backend.dto;

public record MyProfileDto(
        Long id,
        String name,
        String email,
        String role,
        String timezone,
        String avatarUrl,
        NotificationSettingsDto notifications) {
}
