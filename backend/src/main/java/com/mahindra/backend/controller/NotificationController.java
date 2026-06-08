package com.mahindra.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mahindra.backend.dto.NotificationDto;
import com.mahindra.backend.dto.UnreadNotificationCountDto;
import com.mahindra.backend.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> list(Authentication authentication) {
        return ResponseEntity.ok(notificationService.listCurrentUser(authentication));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountDto> unreadCount(Authentication authentication) {
        return ResponseEntity.ok(notificationService.unreadCount(authentication));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(authentication, id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<UnreadNotificationCountDto> markAllRead(Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAllRead(authentication));
    }
}
