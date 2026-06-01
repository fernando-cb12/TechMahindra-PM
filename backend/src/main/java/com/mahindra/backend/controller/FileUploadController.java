package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.PresignedUploadRequest;
import com.mahindra.backend.dto.PresignedUploadResponse;
import com.mahindra.backend.service.FileUploadService;
import com.mahindra.backend.service.TaskBoardService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads")
public class FileUploadController {

    private final FileUploadService fileUploadService;
    private final TaskBoardService taskBoardService;

    public FileUploadController(FileUploadService fileUploadService, TaskBoardService taskBoardService) {
        this.fileUploadService = fileUploadService;
        this.taskBoardService = taskBoardService;
    }

    @PostMapping("/workspace-banner/presign")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<PresignedUploadResponse> presignWorkspaceBanner(
            @Valid @RequestBody PresignedUploadRequest request) {
        PresignedUploadResponse upload = fileUploadService.createWorkspaceBannerUpload(
                request.fileName(),
                request.contentType());
        return ResponseEntity.ok(upload);
    }

    @PostMapping("/ai-imports/presign")
    @PreAuthorize("hasAnyRole('ADMIN','TEAM_LEAD')")
    public ResponseEntity<PresignedUploadResponse> presignAiImport(
            @Valid @RequestBody PresignedUploadRequest request) {
        PresignedUploadResponse upload = fileUploadService.createAiImportUpload(
                request.fileName(),
                request.contentType(),
                request.sizeBytes());
        return ResponseEntity.ok(upload);
    }

    @PostMapping("/workspaces/{workspaceId}/boards/{boardId}/tasks/{taskId}/updates/presign")
    public ResponseEntity<PresignedUploadResponse> presignTaskUpdateFile(
            Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody PresignedUploadRequest request) {
        taskBoardService.assertCanEditTask(authentication, workspaceId, boardId, taskId);
        PresignedUploadResponse upload = fileUploadService.createTaskUpdateUpload(
                workspaceId,
                boardId,
                taskId,
                request.fileName(),
                request.contentType(),
                request.sizeBytes());
        return ResponseEntity.ok(upload);
    }
}
