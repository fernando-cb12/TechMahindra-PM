package com.mahindra.backend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.mahindra.backend.config.JwtProperties;
import com.mahindra.backend.entity.Role;
import com.mahindra.backend.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] keyBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.expirationMs());
        Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        String roles = roleNames.stream().sorted().collect(Collectors.joining(","));
        int accessLevel = roleNames.stream().mapToInt(JwtService::roleAccessLevel).max().orElse(0);
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("roles", roles)
                .claim("accessLevel", accessLevel)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Numeric rank for UI hints; aligns with {@link com.mahindra.backend.config.MethodSecurityConfig} ordering
     * (higher means more capability). Roles outside this ladder (e.g. {@code DELETED_USER}) map to zero.
     */
    private static int roleAccessLevel(String roleName) {
        if (roleName == null) {
            return 0;
        }
        return switch (roleName) {
            case "VIEW_ONLY" -> 1;
            case "DEVELOPER" -> 2;
            case "TEAM_LEAD" -> 3;
            case "ADMIN" -> 4;
            default -> 0;
        };
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = parseClaims(token);
        String email = claims.getSubject();
        return email != null
                && email.equals(userDetails.getUsername())
                && !claims.getExpiration().before(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
