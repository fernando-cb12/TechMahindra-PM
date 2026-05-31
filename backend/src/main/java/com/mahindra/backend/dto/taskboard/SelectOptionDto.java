package com.mahindra.backend.dto.taskboard;

public record SelectOptionDto(
        String id,
        String label,
        String color,
        String workflowMeaning) {

    public SelectOptionDto(String id, String label, String color) {
        this(id, label, color, "none");
    }
}

