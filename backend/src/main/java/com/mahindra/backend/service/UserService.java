package com.mahindra.backend.service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.UserDto;
import com.mahindra.backend.dto.UserUpdateDto;
import com.mahindra.backend.entity.Role;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.RoleRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> searchUsersByName(String name) {
        return userRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByStatus(UserStatus status) {
        return userRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .toList();
    }

    public UserDto updateUser(Long id, UserUpdateDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (updateDto.name() != null && !updateDto.name().isBlank()) {
            user.setName(updateDto.name());
        }
        if (updateDto.status() != null) {
            user.setStatus(updateDto.status());
        }
        if (updateDto.roles() != null) {
            Set<Role> roles = updateDto.roles().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        user = userRepository.save(user);
        return mapToDto(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPreferences(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return copyMap(user.getPreferences());
    }

    public Map<String, Object> updatePreferences(Authentication authentication, Map<String, Object> patch) {
        User user = getAuthenticatedUser(authentication);
        Map<String, Object> merged = copyMap(user.getPreferences());
        mergePreferences(merged, patch);
        validatePreferences(merged);
        user.setPreferences(merged);
        return copyMap(userRepository.save(user).getPreferences());
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private Map<String, Object> copyMap(Map<String, Object> source) {
        return source == null ? new LinkedHashMap<>() : new LinkedHashMap<>(source);
    }

    @SuppressWarnings("unchecked")
    private void mergePreferences(Map<String, Object> target, Map<String, Object> patch) {
        if (patch == null) {
            return;
        }
        patch.forEach((key, value) -> {
            if (value instanceof Map<?, ?> valueMap && target.get(key) instanceof Map<?, ?> targetMap) {
                Map<String, Object> nested = new LinkedHashMap<>((Map<String, Object>) targetMap);
                mergePreferences(nested, (Map<String, Object>) valueMap);
                target.put(key, nested);
            } else {
                target.put(key, value);
            }
        });
    }

    @SuppressWarnings("unchecked")
    private void validatePreferences(Map<String, Object> preferences) {
        Object myTasks = preferences.get("myTasks");
        if (myTasks == null) {
            return;
        }
        if (!(myTasks instanceof Map<?, ?> myTasksMap)) {
            throw new IllegalArgumentException("myTasks preferences must be an object");
        }
        Object filterMode = ((Map<String, Object>) myTasksMap).get("filterMode");
        if (filterMode != null && !Set.of("kpis", "filters").contains(filterMode)) {
            throw new IllegalArgumentException("Invalid myTasks.filterMode");
        }
    }

    private UserDto mapToDto(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getStatus(),
                user.getCreatedAt(),
                roleNames
        );
    }
}
