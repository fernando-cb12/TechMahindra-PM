package com.mahindra.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AssignableUserDto(Long id, String name, String email) {
}
