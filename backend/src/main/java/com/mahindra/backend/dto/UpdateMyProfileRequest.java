package com.mahindra.backend.dto;

public record UpdateMyProfileRequest(
        String name,
        String timezone,
        String avatarUrl,
        NotificationSettingsDto notifications) {
}
