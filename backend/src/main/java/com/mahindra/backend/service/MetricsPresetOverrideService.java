package com.mahindra.backend.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.metrics.MetricPresetOverrideDto;
import com.mahindra.backend.dto.metrics.MetricPresetOverrideRequest;
import com.mahindra.backend.entity.MetricPresetOverride;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.MetricPresetOverrideRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
public class MetricsPresetOverrideService {

    private final MetricPresetOverrideRepository metricPresetOverrideRepository;
    private final UserRepository userRepository;

    public MetricsPresetOverrideService(MetricPresetOverrideRepository metricPresetOverrideRepository,
            UserRepository userRepository) {
        this.metricPresetOverrideRepository = metricPresetOverrideRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MetricPresetOverrideDto> list(Authentication authentication) {
        User user = resolveUser(authentication);
        return metricPresetOverrideRepository.findByUserIdOrderByPresetIdAsc(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public MetricPresetOverrideDto upsert(Authentication authentication, String presetId, MetricPresetOverrideRequest request) {
        User user = resolveUser(authentication);
        String normalizedPresetId = validatePresetId(presetId);
        MetricPresetOverride override = metricPresetOverrideRepository.findByUserIdAndPresetId(user.getId(), normalizedPresetId)
                .orElseGet(() -> {
                    MetricPresetOverride created = new MetricPresetOverride();
                    created.setUser(user);
                    created.setPresetId(normalizedPresetId);
                    return created;
                });
        override.setConfig(copyConfig(request == null ? null : request.config()));
        override.setUpdatedAt(Instant.now());
        metricPresetOverrideRepository.save(override);
        return toDto(override);
    }

    @Transactional
    public void delete(Authentication authentication, String presetId) {
        User user = resolveUser(authentication);
        metricPresetOverrideRepository.deleteByUserIdAndPresetId(user.getId(), validatePresetId(presetId));
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private String validatePresetId(String presetId) {
        if (presetId == null || presetId.isBlank()) {
            throw new IllegalArgumentException("Preset id is required");
        }
        String normalized = presetId.trim();
        if (!normalized.matches("[a-zA-Z0-9_-]{1,80}")) {
            throw new IllegalArgumentException("Invalid preset id");
        }
        return normalized;
    }

    private Map<String, Object> copyConfig(Map<String, Object> config) {
        return config == null ? new LinkedHashMap<>() : new LinkedHashMap<>(config);
    }

    private MetricPresetOverrideDto toDto(MetricPresetOverride override) {
        return new MetricPresetOverrideDto(
                override.getPresetId(),
                copyConfig(override.getConfig()),
                override.getCreatedAt().toString(),
                override.getUpdatedAt().toString());
    }
}
