package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.AssignableUserDto;
import com.mahindra.backend.dto.CreateWorkspaceProjectRequest;
import com.mahindra.backend.dto.WorkspaceProjectCardDto;
import com.mahindra.backend.service.WorkspaceProjectService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workspace-projects")
@Validated
@Tag(name = "Workspace projects")
public class WorkspaceProjectController {

    private final WorkspaceProjectService workspaceProjectService;

    public WorkspaceProjectController(WorkspaceProjectService workspaceProjectService) {
        this.workspaceProjectService = workspaceProjectService;
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceProjectCardDto>> list(Authentication authentication) {
        return ResponseEntity.ok(workspaceProjectService.listForCurrentUser(authentication));
    }

    @GetMapping("/assignable-users")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<List<AssignableUserDto>> assignableUsers() {
        return ResponseEntity.ok(workspaceProjectService.listAssignableUsers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<WorkspaceProjectCardDto> create(Authentication authentication,
            @Valid @RequestBody CreateWorkspaceProjectRequest request) {
        WorkspaceProjectCardDto created = workspaceProjectService.create(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
