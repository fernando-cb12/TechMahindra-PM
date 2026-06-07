package com.mahindra.backend.service;

public final class WorkspaceStatusMapper {

    private WorkspaceStatusMapper() {
    }

    public static String toUiStatus(String db) {
        if (db == null || db.isBlank()) {
            return "planning";
        }
        return switch (db) {
            case "draft" -> "planning";
            case "active" -> "in-progress";
            case "on_hold" -> "on-hold";
            case "completed", "archived" -> "completed";
            default -> "planning";
        };
    }

    public static String toPersistedStatus(String ui) {
        if (ui == null || ui.isBlank()) {
            return "draft";
        }
        return switch (ui) {
            case "planning" -> "draft";
            case "in-progress", "active" -> "active";
            case "on-hold" -> "on_hold";
            case "completed" -> "completed";
            default -> "draft";
        };
    }
}
