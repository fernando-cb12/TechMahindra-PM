package com.mahindra.backend.dto.taskboard;

public record UpdateGroupRequest(
        String name,
        String color,
        Integer order) {
}
