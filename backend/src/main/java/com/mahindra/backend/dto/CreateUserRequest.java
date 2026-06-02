package com.mahindra.backend.dto;

import java.util.Set;

import com.mahindra.backend.entity.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 128) String password,
        UserStatus status,
        @NotEmpty Set<@NotBlank String> roles
) {
}
