package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.metrics.MetricDashboardDto;
import com.mahindra.backend.dto.metrics.MetricDashboardRequest;
import com.mahindra.backend.service.MetricsDashboardService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/metrics/dashboards")
@Validated
@Tag(name = "Metrics Dashboards")
public class MetricsDashboardController {

    private final MetricsDashboardService metricsDashboardService;

    public MetricsDashboardController(MetricsDashboardService metricsDashboardService) {
        this.metricsDashboardService = metricsDashboardService;
    }

    @GetMapping
    public ResponseEntity<List<MetricDashboardDto>> list(Authentication authentication) {
        return ResponseEntity.ok(metricsDashboardService.list(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MetricDashboardDto> get(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(metricsDashboardService.get(authentication, id));
    }

    @PostMapping
    public ResponseEntity<MetricDashboardDto> create(Authentication authentication,
            @RequestBody MetricDashboardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(metricsDashboardService.create(authentication, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MetricDashboardDto> update(Authentication authentication,
            @PathVariable Long id,
            @RequestBody MetricDashboardRequest request) {
        return ResponseEntity.ok(metricsDashboardService.update(authentication, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long id) {
        metricsDashboardService.delete(authentication, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<MetricDashboardDto> duplicate(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(metricsDashboardService.duplicate(authentication, id));
    }
}
