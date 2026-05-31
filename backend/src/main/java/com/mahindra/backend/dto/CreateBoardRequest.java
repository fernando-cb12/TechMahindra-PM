package com.mahindra.backend.dto;

public record CreateBoardRequest(
        String name,
        String description,
        String color) {
}
