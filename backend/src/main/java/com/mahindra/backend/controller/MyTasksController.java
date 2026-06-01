package com.mahindra.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.mytasks.MyTasksResponseDto;
import com.mahindra.backend.service.MyTasksService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "My Tasks")
public class MyTasksController {

    private final MyTasksService myTasksService;

    public MyTasksController(MyTasksService myTasksService) {
        this.myTasksService = myTasksService;
    }

    @GetMapping("/my")
    public ResponseEntity<MyTasksResponseDto> myTasks(Authentication authentication) {
        return ResponseEntity.ok(myTasksService.listForCurrentUser(authentication));
    }
}
