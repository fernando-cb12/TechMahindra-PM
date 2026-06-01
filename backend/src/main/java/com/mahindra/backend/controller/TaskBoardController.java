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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.taskboard.ColumnDefinitionDto;
import com.mahindra.backend.dto.taskboard.ColumnUpdateRequest;
import com.mahindra.backend.dto.taskboard.ColumnUpsertRequest;
import com.mahindra.backend.dto.taskboard.CreateGroupRequest;
import com.mahindra.backend.dto.taskboard.CreateTaskRequest;
import com.mahindra.backend.dto.taskboard.CreateUpdateRequest;
import com.mahindra.backend.dto.taskboard.MoveGroupRequest;
import com.mahindra.backend.dto.taskboard.MoveTaskRequest;
import com.mahindra.backend.dto.taskboard.TaskBoardPayloadDto;
import com.mahindra.backend.dto.taskboard.TaskDto;
import com.mahindra.backend.dto.taskboard.TaskGroupDto;
import com.mahindra.backend.dto.taskboard.TaskPatchRequest;
import com.mahindra.backend.dto.taskboard.TaskUpdateDto;
import com.mahindra.backend.dto.taskboard.UpdateBoardRequest;
import com.mahindra.backend.dto.taskboard.UpdateGroupRequest;
import com.mahindra.backend.dto.taskboard.UpdateUpdateRequest;
import com.mahindra.backend.service.TaskBoardService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/boards/{boardId}")
@Validated
@Tag(name = "Task Boards")
public class TaskBoardController {

    private final TaskBoardService taskBoardService;

    public TaskBoardController(TaskBoardService taskBoardService) {
        this.taskBoardService = taskBoardService;
    }

    @GetMapping
    public ResponseEntity<TaskBoardPayloadDto> getBoard(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId) {
        return ResponseEntity.ok(taskBoardService.getBoard(authentication, workspaceId, boardId));
    }

    @PatchMapping
    public ResponseEntity<TaskBoardPayloadDto> updateBoard(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @RequestBody UpdateBoardRequest request) {
        return ResponseEntity.ok(taskBoardService.updateBoard(authentication, workspaceId, boardId, request));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteBoard(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId) {
        taskBoardService.deleteBoard(authentication, workspaceId, boardId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restore")
    public ResponseEntity<TaskBoardPayloadDto> restoreBoard(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId) {
        return ResponseEntity.ok(taskBoardService.restoreBoard(authentication, workspaceId, boardId));
    }

    @PostMapping("/groups")
    public ResponseEntity<TaskGroupDto> createGroup(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskBoardService.createGroup(authentication, workspaceId, boardId, request));
    }

    @PatchMapping("/groups/{groupId}")
    public ResponseEntity<TaskGroupDto> updateGroup(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long groupId,
            @RequestBody UpdateGroupRequest request) {
        return ResponseEntity.ok(taskBoardService.updateGroup(authentication, workspaceId, boardId, groupId, request));
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long groupId) {
        taskBoardService.deleteGroup(authentication, workspaceId, boardId, groupId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/groups/{groupId}/restore")
    public ResponseEntity<TaskGroupDto> restoreGroup(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long groupId) {
        return ResponseEntity.ok(taskBoardService.restoreGroup(authentication, workspaceId, boardId, groupId));
    }

    @PutMapping("/groups/{groupId}/move")
    public ResponseEntity<Void> moveGroup(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long groupId,
            @Valid @RequestBody MoveGroupRequest request) {
        taskBoardService.moveGroup(authentication, workspaceId, boardId, groupId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/groups/{groupId}/tasks")
    public ResponseEntity<TaskDto> createTask(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long groupId,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskBoardService.createTask(authentication, workspaceId, boardId, groupId, request));
    }

    @PatchMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> patchTask(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @RequestBody TaskPatchRequest request) {
        return ResponseEntity.ok(taskBoardService.patchTask(authentication, workspaceId, boardId, taskId, request));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId) {
        taskBoardService.deleteTask(authentication, workspaceId, boardId, taskId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{taskId}/restore")
    public ResponseEntity<TaskDto> restoreTask(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(taskBoardService.restoreTask(authentication, workspaceId, boardId, taskId));
    }

    @PostMapping("/columns")
    public ResponseEntity<ColumnDefinitionDto> createColumn(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @Valid @RequestBody ColumnUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskBoardService.createColumn(authentication, workspaceId, boardId, request));
    }

    @PutMapping("/columns")
    public ResponseEntity<List<ColumnDefinitionDto>> replaceColumns(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @RequestBody List<ColumnUpdateRequest> request) {
        return ResponseEntity.ok(taskBoardService.replaceColumns(authentication, workspaceId, boardId, request));
    }

    @PostMapping("/tasks/{taskId}/updates")
    public ResponseEntity<TaskUpdateDto> createUpdate(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @RequestBody CreateUpdateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskBoardService.createUpdate(authentication, workspaceId, boardId, taskId, request));
    }

    @PatchMapping("/tasks/{taskId}/updates/{updateId}")
    public ResponseEntity<TaskUpdateDto> updateUpdate(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @PathVariable Long updateId,
            @RequestBody UpdateUpdateRequest request) {
        return ResponseEntity.ok(taskBoardService.updateUpdate(authentication, workspaceId, boardId, taskId, updateId, request));
    }

    @PutMapping("/tasks/{taskId}/move")
    public ResponseEntity<Void> moveTask(Authentication authentication,
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @PathVariable Long taskId,
            @Valid @RequestBody MoveTaskRequest request) {
        taskBoardService.moveTask(authentication, workspaceId, boardId, taskId, request);
        return ResponseEntity.noContent().build();
    }
}
