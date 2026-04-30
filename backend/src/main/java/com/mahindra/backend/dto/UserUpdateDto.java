package com.mahindra.backend.dto;

import java.util.Set;

import com.mahindra.backend.entity.UserStatus;

public record UserUpdateDto(
        String name,
        UserStatus status,
        Set<String> roles
) {
}
