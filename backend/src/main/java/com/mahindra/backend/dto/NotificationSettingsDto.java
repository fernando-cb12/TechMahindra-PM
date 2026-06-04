package com.mahindra.backend.dto;

public record NotificationSettingsDto(
        boolean issuesAssigned,
        boolean mentions,
        boolean projectUpdates,
        boolean dailySummary) {
}
