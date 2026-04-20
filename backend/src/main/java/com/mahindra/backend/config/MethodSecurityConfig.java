package com.mahindra.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Role ordering for authorization: {@code ADMIN} &gt; {@code TEAM_LEAD} &gt; {@code DEVELOPER} &gt; {@code VIEW_ONLY}.
 * <p>
 * Use method security with {@code hasRole}, for example {@code @PreAuthorize("hasRole('DEVELOPER')")} so that
 * team leads and admins are also allowed. {@code DELETED_USER} is not part of the hierarchy and must be
 * modeled separately (typically inactive users who cannot authenticate).
 */
@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {

    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy(
                "ROLE_ADMIN > ROLE_TEAM_LEAD > ROLE_DEVELOPER > ROLE_VIEW_ONLY");
    }
}
