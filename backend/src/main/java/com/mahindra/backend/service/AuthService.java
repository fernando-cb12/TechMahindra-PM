package com.mahindra.backend.service;

import java.util.Locale;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.config.JwtProperties;
import com.mahindra.backend.dto.AuthResponse;
import com.mahindra.backend.dto.LoginRequest;
import com.mahindra.backend.dto.RegisterRequest;
import com.mahindra.backend.entity.Role;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.exception.DuplicateEmailException;
import com.mahindra.backend.repository.RoleRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder,
            JwtService jwtService, JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }
        Role member = roleRepository.findByName("VIEW_ONLY")
                .orElseThrow(() -> new IllegalStateException(
                        "Default role VIEW_ONLY is missing."));
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.active);
        user.getRoles().add(member);
        userRepository.save(user);
        return toResponse(jwtService.generateToken(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (user.getStatus() != UserStatus.active) {
            throw new BadCredentialsException("Invalid credentials");
        }
        return toResponse(jwtService.generateToken(user));
    }

    private AuthResponse toResponse(String token) {
        long seconds = jwtProperties.expirationMs() / 1000L;
        return new AuthResponse(token, "Bearer", seconds);
    }
}
