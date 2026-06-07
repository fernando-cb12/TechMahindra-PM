package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.mytasks.MyTasksResponseDto;
import com.mahindra.backend.service.MyTasksService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks")
public class MyTasksController {

    private final MyTasksService myTasksService;

    public MyTasksController(MyTasksService myTasksService) {
        this.myTasksService = myTasksService;
    }

    @GetMapping
    public ResponseEntity<MyTasksResponseDto> tasks(Authentication authentication,
            @RequestParam(required = false) Long workspaceId) {
        return ResponseEntity.ok(myTasksService.listVisibleTasks(authentication, workspaceId));
    }

    @GetMapping("/my")
    public ResponseEntity<MyTasksResponseDto> myTasks(Authentication authentication,
            @RequestParam(required = false) Long workspaceId) {
        return ResponseEntity.ok(myTasksService.listVisibleTasks(authentication, workspaceId));
    }
}
