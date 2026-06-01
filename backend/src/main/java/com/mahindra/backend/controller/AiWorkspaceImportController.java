package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.ai.AiImportProcessRequest;
import com.mahindra.backend.dto.ai.AiWorkspaceApproveRequest;
import com.mahindra.backend.dto.ai.AiWorkspaceApproveResponse;
import com.mahindra.backend.dto.ai.AiWorkspaceDraftDto;
import com.mahindra.backend.service.AiWorkspaceImportService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ai/workspace-imports")
@Validated
@Tag(name = "AI Workspace Imports")
@PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
public class AiWorkspaceImportController {

    private final AiWorkspaceImportService aiWorkspaceImportService;

    public AiWorkspaceImportController(AiWorkspaceImportService aiWorkspaceImportService) {
        this.aiWorkspaceImportService = aiWorkspaceImportService;
    }

    @PostMapping("/process")
    public ResponseEntity<AiWorkspaceDraftDto> process(Authentication authentication,
            @Valid @RequestBody AiImportProcessRequest request) {
        return ResponseEntity.ok(aiWorkspaceImportService.process(authentication, request));
    }

    @GetMapping("/{draftId}")
    public ResponseEntity<AiWorkspaceDraftDto> getDraft(@PathVariable String draftId) {
        return ResponseEntity.ok(aiWorkspaceImportService.getDraft(draftId));
    }

    @PostMapping("/approve")
    public ResponseEntity<AiWorkspaceApproveResponse> approve(Authentication authentication,
            @Valid @RequestBody AiWorkspaceApproveRequest request) {
        return ResponseEntity.ok(aiWorkspaceImportService.approve(authentication, request));
    }

    @DeleteMapping("/{draftId}")
    public ResponseEntity<Void> discard(@PathVariable String draftId) {
        aiWorkspaceImportService.discard(draftId);
        return ResponseEntity.noContent().build();
    }
}
