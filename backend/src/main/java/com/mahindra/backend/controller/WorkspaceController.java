package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.AssignableUserDto;
import com.mahindra.backend.dto.CreateBoardRequest;
import com.mahindra.backend.dto.CreateWorkspaceRequest;
import com.mahindra.backend.dto.UpdateWorkspaceRequest;
import com.mahindra.backend.dto.WorkspaceBoardDto;
import com.mahindra.backend.dto.WorkspaceCardDto;
import com.mahindra.backend.service.WorkspaceService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workspaces")
@Validated
@Tag(name = "Workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceCardDto>> list(Authentication authentication) {
        return ResponseEntity.ok(workspaceService.listForCurrentUser(authentication));
    }

    @GetMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceCardDto> get(Authentication authentication, @PathVariable Long workspaceId) {
        return ResponseEntity.ok(workspaceService.getForCurrentUser(authentication, workspaceId));
    }

    @GetMapping("/{workspaceId}/boards")
    public ResponseEntity<List<WorkspaceBoardDto>> boards(Authentication authentication, @PathVariable Long workspaceId) {
        return ResponseEntity.ok(workspaceService.listBoards(authentication, workspaceId));
    }

    @PostMapping("/{workspaceId}/boards")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<WorkspaceBoardDto> createBoard(Authentication authentication,
            @PathVariable Long workspaceId,
            @RequestBody CreateBoardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.createBoard(authentication, workspaceId, request));
    }

    @PatchMapping("/{workspaceId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<WorkspaceCardDto> update(Authentication authentication,
            @PathVariable Long workspaceId,
            @RequestBody UpdateWorkspaceRequest request) {
        return ResponseEntity.ok(workspaceService.update(authentication, workspaceId, request));
    }

    @DeleteMapping("/{workspaceId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable Long workspaceId) {
        workspaceService.delete(authentication, workspaceId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workspaceId}/restore")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<WorkspaceCardDto> restore(Authentication authentication, @PathVariable Long workspaceId) {
        return ResponseEntity.ok(workspaceService.restore(authentication, workspaceId));
    }

    @GetMapping("/assignable-users")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<List<AssignableUserDto>> assignableUsers() {
        return ResponseEntity.ok(workspaceService.listAssignableUsers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<WorkspaceCardDto> create(Authentication authentication,
            @Valid @RequestBody CreateWorkspaceRequest request) {
        WorkspaceCardDto created = workspaceService.create(authentication, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
