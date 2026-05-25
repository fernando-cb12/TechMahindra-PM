package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.PresignedUploadRequest;
import com.mahindra.backend.dto.PresignedUploadResponse;
import com.mahindra.backend.service.FileUploadService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
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
}
