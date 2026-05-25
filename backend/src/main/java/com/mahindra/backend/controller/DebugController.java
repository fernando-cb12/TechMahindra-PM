package com.mahindra.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.entity.User;
import com.mahindra.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final UserRepository userRepository;

    public DebugController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication == null) {
            response.put("authenticated", false);
            response.put("message", "No authentication context");
            return response;
        }

        response.put("authenticated", authentication.isAuthenticated());
        response.put("username", authentication.getName());
        response.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList());

        // Try to load from DB
        String email = authentication.getName();
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            response.put("user_id", user.getId());
            response.put("user_name", user.getName());
            response.put("user_status", user.getStatus());
            response.put("user_roles", user.getRoles().stream().map(r -> r.getName()).toList());
        } else {
            response.put("message", "User not found in database");
        }

        return response;
    }
}
