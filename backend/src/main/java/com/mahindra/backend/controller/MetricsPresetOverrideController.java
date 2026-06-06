package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.metrics.MetricPresetOverrideDto;
import com.mahindra.backend.dto.metrics.MetricPresetOverrideRequest;
import com.mahindra.backend.service.MetricsPresetOverrideService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/metrics/preset-overrides")
@Validated
@Tag(name = "Metrics Preset Overrides")
public class MetricsPresetOverrideController {

    private final MetricsPresetOverrideService metricsPresetOverrideService;

    public MetricsPresetOverrideController(MetricsPresetOverrideService metricsPresetOverrideService) {
        this.metricsPresetOverrideService = metricsPresetOverrideService;
    }

    @GetMapping
    public ResponseEntity<List<MetricPresetOverrideDto>> list(Authentication authentication) {
        return ResponseEntity.ok(metricsPresetOverrideService.list(authentication));
    }

    @PutMapping("/{presetId}")
    public ResponseEntity<MetricPresetOverrideDto> upsert(Authentication authentication,
            @PathVariable String presetId,
            @RequestBody MetricPresetOverrideRequest request) {
        return ResponseEntity.ok(metricsPresetOverrideService.upsert(authentication, presetId, request));
    }

    @DeleteMapping("/{presetId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String presetId) {
        metricsPresetOverrideService.delete(authentication, presetId);
        return ResponseEntity.noContent().build();
    }
}
