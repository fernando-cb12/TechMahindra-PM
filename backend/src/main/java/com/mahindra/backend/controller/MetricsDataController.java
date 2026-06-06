package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.metrics.MetricCatalogDto;
import com.mahindra.backend.dto.metrics.MetricFieldMappingRequest;
import com.mahindra.backend.dto.metrics.MetricQueryRequest;
import com.mahindra.backend.dto.metrics.MetricQueryResponse;
import com.mahindra.backend.dto.metrics.MetricSemanticFieldDto;
import com.mahindra.backend.service.MetricsDataService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/metrics")
@Validated
@Tag(name = "Metrics")
public class MetricsDataController {

    private final MetricsDataService metricsDataService;

    public MetricsDataController(MetricsDataService metricsDataService) {
        this.metricsDataService = metricsDataService;
    }

    @GetMapping("/catalog")
    public ResponseEntity<MetricCatalogDto> catalog(Authentication authentication,
            @RequestParam(required = false) List<String> workspaceIds,
            @RequestParam(required = false) List<String> boardIds) {
        return ResponseEntity.ok(metricsDataService.catalog(authentication, workspaceIds, boardIds));
    }

    @PostMapping("/query")
    public ResponseEntity<MetricQueryResponse> query(Authentication authentication,
            @RequestBody MetricQueryRequest request) {
        return ResponseEntity.ok(metricsDataService.query(authentication, request));
    }

    @PutMapping("/field-mappings/{boardId}/{semanticKey}")
    public ResponseEntity<MetricSemanticFieldDto> updateFieldMapping(Authentication authentication,
            @PathVariable Long boardId,
            @PathVariable String semanticKey,
            @RequestBody MetricFieldMappingRequest request) {
        return ResponseEntity.ok(metricsDataService.updateFieldMapping(authentication, boardId, semanticKey, request));
    }

    @DeleteMapping("/field-mappings/{boardId}/{semanticKey}")
    public ResponseEntity<Void> deleteFieldMapping(Authentication authentication,
            @PathVariable Long boardId,
            @PathVariable String semanticKey) {
        metricsDataService.deleteFieldMapping(authentication, boardId, semanticKey);
        return ResponseEntity.noContent().build();
    }
}
