package com.mahindra.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.CreateUserRequest;
import com.mahindra.backend.dto.MyProfileDto;
import com.mahindra.backend.dto.UpdateMyProfileRequest;
import com.mahindra.backend.dto.UserDto;
import com.mahindra.backend.dto.UserUpdateDto;

import jakarta.validation.Valid;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) UserStatus status) {
        
        if (name != null && !name.isBlank()) {
            return ResponseEntity.ok(userService.searchUsersByName(name));
        } else if (status != null) {
            return ResponseEntity.ok(userService.getUsersByStatus(status));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<Map<String, Object>> getMyPreferences(Authentication authentication) {
        return ResponseEntity.ok(userService.getPreferences(authentication));
    }

    @GetMapping("/me")
    public ResponseEntity<MyProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getMyProfile(authentication));
    }

    @PatchMapping("/me")
    public ResponseEntity<MyProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody UpdateMyProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(authentication, request));
    }

    @PatchMapping("/me/preferences")
    public ResponseEntity<Map<String, Object>> updateMyPreferences(
            Authentication authentication,
            @RequestBody Map<String, Object> preferences) {
        return ResponseEntity.ok(userService.updatePreferences(authentication, preferences));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserUpdateDto updateDto) {
        return ResponseEntity.ok(userService.updateUser(id, updateDto));
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
