package com.mahindra.backend.service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.CreateUserRequest;
import com.mahindra.backend.dto.MyProfileDto;
import com.mahindra.backend.dto.NotificationSettingsDto;
import com.mahindra.backend.dto.UpdateMyProfileRequest;
import com.mahindra.backend.dto.UserDto;
import com.mahindra.backend.dto.UserUpdateDto;
import com.mahindra.backend.exception.DuplicateEmailException;
import com.mahindra.backend.entity.Role;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.RoleRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
@Transactional
public class UserService {

    private static final Set<String> ASSIGNABLE_ROLES = Set.of(
            "ADMIN", "TEAM_LEAD", "DEVELOPER", "VIEW_ONLY");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
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

    public UserDto createUser(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(request.status() != null ? request.status() : UserStatus.active);
        user.setRoles(resolveRoles(request.roles()));

        user = userRepository.save(user);
        return mapToDto(user);
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

    @Transactional(readOnly = true)
    public MyProfileDto getMyProfile(Authentication authentication) {
        return mapToMyProfile(getAuthenticatedUser(authentication));
    }

    public MyProfileDto updateMyProfile(Authentication authentication, UpdateMyProfileRequest request) {
        User user = getAuthenticatedUser(authentication);
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        Map<String, Object> preferences = copyMap(user.getPreferences());
        Map<String, Object> profile = nestedMap(preferences, "profile");
        if (request.timezone() != null) {
            profile.put("timezone", request.timezone().trim());
        }
        if (request.avatarUrl() != null) {
            String trimmedAvatar = request.avatarUrl().trim();
            profile.put("avatarUrl", trimmedAvatar.isEmpty() ? null : trimmedAvatar);
        }
        preferences.put("profile", profile);

        if (request.notifications() != null) {
            Map<String, Object> notifications = nestedMap(preferences, "notifications");
            notifications.put("issuesAssigned", request.notifications().issuesAssigned());
            notifications.put("mentions", request.notifications().mentions());
            notifications.put("projectUpdates", request.notifications().projectUpdates());
            notifications.put("dailySummary", request.notifications().dailySummary());
            preferences.put("notifications", notifications);
        }

        validatePreferences(preferences);
        user.setPreferences(preferences);
        return mapToMyProfile(userRepository.save(user));
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
        } else {
            if (!(myTasks instanceof Map<?, ?> myTasksMap)) {
                throw new IllegalArgumentException("myTasks preferences must be an object");
            }
            Object filterMode = ((Map<String, Object>) myTasksMap).get("filterMode");
            if (filterMode != null && !Set.of("kpis", "filters").contains(filterMode)) {
                throw new IllegalArgumentException("Invalid myTasks.filterMode");
            }
        }

        Object notifications = preferences.get("notifications");
        if (notifications != null && !(notifications instanceof Map<?, ?>)) {
            throw new IllegalArgumentException("notifications preferences must be an object");
        }
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }
        return roleNames.stream()
                .map(String::trim)
                .map(String::toUpperCase)
                .peek(name -> {
                    if (!ASSIGNABLE_ROLES.contains(name)) {
                        throw new IllegalArgumentException("Role not allowed: " + name);
                    }
                })
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                .collect(Collectors.toSet());
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

    @SuppressWarnings("unchecked")
    private MyProfileDto mapToMyProfile(User user) {
        Map<String, Object> preferences = copyMap(user.getPreferences());
        Map<String, Object> profile = preferences.get("profile") instanceof Map<?, ?>
                ? new LinkedHashMap<>((Map<String, Object>) preferences.get("profile"))
                : new LinkedHashMap<>();
        Map<String, Object> notifications = preferences.get("notifications") instanceof Map<?, ?>
                ? new LinkedHashMap<>((Map<String, Object>) preferences.get("notifications"))
                : new LinkedHashMap<>();

        String primaryRole = user.getRoles().stream()
                .map(Role::getName)
                .filter(Objects::nonNull)
                .sorted(this::compareRolePriority)
                .findFirst()
                .map(this::formatRoleLabel)
                .orElse("User");

        return new MyProfileDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                primaryRole,
                stringPreference(profile.get("timezone"), "GMT-6"),
                stringPreference(profile.get("avatarUrl"), null),
                new NotificationSettingsDto(
                        booleanPreference(notifications.get("issuesAssigned"), true),
                        booleanPreference(notifications.get("mentions"), true),
                        booleanPreference(notifications.get("projectUpdates"), true),
                        booleanPreference(notifications.get("dailySummary"), true)));
    }

    private Map<String, Object> nestedMap(Map<String, Object> parent, String key) {
        Object current = parent.get(key);
        if (current instanceof Map<?, ?> existing) {
            @SuppressWarnings("unchecked")
            Map<String, Object> casted = new LinkedHashMap<>((Map<String, Object>) existing);
            return casted;
        }
        return new LinkedHashMap<>();
    }

    private String stringPreference(Object value, String fallback) {
        return value instanceof String text && !text.isBlank() ? text : fallback;
    }

    private boolean booleanPreference(Object value, boolean fallback) {
        return value instanceof Boolean bool ? bool : fallback;
    }

    private int compareRolePriority(String left, String right) {
        int leftPriority = rolePriority(left);
        int rightPriority = rolePriority(right);
        if (leftPriority != rightPriority) {
            return Integer.compare(rightPriority, leftPriority);
        }
        return left.compareToIgnoreCase(right);
    }

    private int rolePriority(String role) {
        if (role == null) {
            return 0;
        }
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "ADMIN" -> 4;
            case "TEAM_LEAD" -> 3;
            case "DEVELOPER" -> 2;
            case "VIEW_ONLY" -> 1;
            default -> 0;
        };
    }

    private String formatRoleLabel(String role) {
        return switch (role) {
            case "ADMIN" -> "Admin";
            case "TEAM_LEAD" -> "Team leader";
            case "DEVELOPER" -> "Developer";
            case "VIEW_ONLY" -> "View only";
            default -> role;
        };
    }
}
