package com.mahindra.backend.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.metrics.MetricDashboardDto;
import com.mahindra.backend.dto.metrics.MetricDashboardRequest;
import com.mahindra.backend.entity.MetricDashboard;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.MetricDashboardRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
public class MetricsDashboardService {

    private final MetricDashboardRepository metricDashboardRepository;
    private final UserRepository userRepository;

    public MetricsDashboardService(MetricDashboardRepository metricDashboardRepository, UserRepository userRepository) {
        this.metricDashboardRepository = metricDashboardRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MetricDashboardDto> list(Authentication authentication) {
        User user = resolveUser(authentication);
        return metricDashboardRepository.findByUserIdAndDeletedAtIsNullOrderByUpdatedAtDescIdDesc(user.getId())
                .stream()
                .sorted((left, right) -> Boolean.compare(
                        Boolean.TRUE.equals(right.getDefaultDashboard()),
                        Boolean.TRUE.equals(left.getDefaultDashboard())))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MetricDashboardDto get(Authentication authentication, Long id) {
        User user = resolveUser(authentication);
        return toDto(resolveOwnedDashboard(user, id));
    }

    @Transactional
    public MetricDashboardDto create(Authentication authentication, MetricDashboardRequest request) {
        User user = resolveUser(authentication);
        MetricDashboard dashboard = new MetricDashboard();
        dashboard.setUser(user);
        applyRequest(dashboard, request, true);
        if (Boolean.TRUE.equals(dashboard.getDefaultDashboard())) {
            clearOtherDefaultDashboards(user, dashboard);
        }
        metricDashboardRepository.save(dashboard);
        return toDto(dashboard);
    }

    @Transactional
    public MetricDashboardDto update(Authentication authentication, Long id, MetricDashboardRequest request) {
        User user = resolveUser(authentication);
        MetricDashboard dashboard = resolveOwnedDashboard(user, id);
        applyRequest(dashboard, request, false);
        if (Boolean.TRUE.equals(dashboard.getDefaultDashboard())) {
            clearOtherDefaultDashboards(user, dashboard);
            dashboard.setDefaultDashboard(true);
        }
        dashboard.setUpdatedAt(Instant.now());
        metricDashboardRepository.save(dashboard);
        return toDto(dashboard);
    }

    @Transactional
    public void delete(Authentication authentication, Long id) {
        User user = resolveUser(authentication);
        MetricDashboard dashboard = resolveOwnedDashboard(user, id);
        dashboard.setDeletedAt(Instant.now());
        dashboard.setUpdatedAt(Instant.now());
        metricDashboardRepository.save(dashboard);
    }

    @Transactional
    public MetricDashboardDto duplicate(Authentication authentication, Long id) {
        User user = resolveUser(authentication);
        MetricDashboard source = resolveOwnedDashboard(user, id);
        MetricDashboard copy = new MetricDashboard();
        copy.setUser(user);
        copy.setName(source.getName() + " Copy");
        copy.setScopeType(source.getScopeType());
        copy.setScopeId(source.getScopeId());
        copy.setDefaultDashboard(false);
        copy.setVisibility("private");
        copy.setConfig(copyConfig(source.getConfig()));
        metricDashboardRepository.save(copy);
        return toDto(copy);
    }

    private void applyRequest(MetricDashboard dashboard, MetricDashboardRequest request, boolean creating) {
        if (request == null) {
            if (creating) {
                dashboard.setName("My Metrics Dashboard");
                dashboard.setConfig(defaultConfig());
            }
            return;
        }
        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isBlank()) {
                throw new IllegalArgumentException("Dashboard name is required");
            }
            dashboard.setName(name);
        } else if (creating) {
            dashboard.setName("My Metrics Dashboard");
        }
        if (request.scopeType() != null) {
            dashboard.setScopeType(validateScopeType(request.scopeType()));
        } else if (creating) {
            dashboard.setScopeType("global");
        }
        if (request.scopeId() != null) {
            dashboard.setScopeId(parseScopeId(request.scopeId()));
        } else if ("global".equals(dashboard.getScopeType())) {
            dashboard.setScopeId(null);
        }
        if (request.isDefault() != null) {
            dashboard.setDefaultDashboard(request.isDefault());
        }
        if (request.visibility() != null) {
            dashboard.setVisibility(validateVisibility(request.visibility()));
        }
        if (request.config() != null) {
            dashboard.setConfig(copyConfig(request.config()));
        } else if (creating) {
            dashboard.setConfig(defaultConfig());
        }
    }

    private String validateScopeType(String value) {
        return switch (value) {
            case "global", "workspace", "board" -> value;
            default -> throw new IllegalArgumentException("Invalid metrics dashboard scope type");
        };
    }

    private String validateVisibility(String value) {
        return switch (value) {
            case "private" -> value;
            case "shared" -> throw new IllegalArgumentException("Shared metrics dashboards are not available yet");
            default -> throw new IllegalArgumentException("Invalid metrics dashboard visibility");
        };
    }

    private Long parseScopeId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid metrics dashboard scope id", e);
        }
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private MetricDashboard resolveOwnedDashboard(User user, Long id) {
        return metricDashboardRepository.findByIdAndUserIdAndDeletedAtIsNull(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Metrics dashboard not found"));
    }

    private void clearOtherDefaultDashboards(User user, MetricDashboard selectedDashboard) {
        metricDashboardRepository.findByUserIdAndDefaultDashboardTrueAndDeletedAtIsNull(user.getId())
                .stream()
                .filter(dashboard -> selectedDashboard.getId() == null
                        || !dashboard.getId().equals(selectedDashboard.getId()))
                .forEach(dashboard -> dashboard.setDefaultDashboard(false));
    }

    private MetricDashboardDto toDto(MetricDashboard dashboard) {
        return new MetricDashboardDto(
                String.valueOf(dashboard.getId()),
                dashboard.getName(),
                dashboard.getScopeType(),
                dashboard.getScopeId() != null ? String.valueOf(dashboard.getScopeId()) : null,
                Boolean.TRUE.equals(dashboard.getDefaultDashboard()),
                dashboard.getVisibility(),
                copyConfig(dashboard.getConfig()),
                dashboard.getCreatedAt().toString(),
                dashboard.getUpdatedAt().toString());
    }

    private Map<String, Object> defaultConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("filters", new LinkedHashMap<String, Object>());
        config.put("widgets", List.of());
        return config;
    }

    private Map<String, Object> copyConfig(Map<String, Object> config) {
        return config == null ? new LinkedHashMap<>() : new LinkedHashMap<>(config);
    }
}
