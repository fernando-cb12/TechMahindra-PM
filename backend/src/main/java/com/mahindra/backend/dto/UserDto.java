package com.mahindra.backend.dto;

import java.time.Instant;
import java.util.Set;

import com.mahindra.backend.entity.UserStatus;

public record UserDto(
        Long id,
        String name,
        String email,
        UserStatus status,
        Instant createdAt,
        Set<String> roles
) {
}
