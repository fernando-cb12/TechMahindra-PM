package com.mahindra.backend.dto.taskboard;

public record CreateBoardRequest(
        String name,
        String description,
        String color) {
}
