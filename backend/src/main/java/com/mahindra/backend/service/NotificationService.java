package com.mahindra.backend.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.NotificationDto;
import com.mahindra.backend.dto.UnreadNotificationCountDto;
import com.mahindra.backend.entity.Notification;
import com.mahindra.backend.entity.Task;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.NotificationRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
            EmailNotificationService emailNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        return notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadNotificationCountDto unreadCount(Authentication authentication) {
        User user = resolveUser(authentication);
        return new UnreadNotificationCountDto(notificationRepository.countByRecipientIdAndReadAtIsNull(user.getId()));
    }

    @Transactional
    public NotificationDto markRead(Authentication authentication, Long notificationId) {
        User user = resolveUser(authentication);
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getRecipient().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getReadAt() == null) {
            Instant now = Instant.now();
            notification.setReadAt(now);
            notification.setUpdatedAt(now);
        }
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public UnreadNotificationCountDto markAllRead(Authentication authentication) {
        User user = resolveUser(authentication);
        notificationRepository.markAllRead(user.getId(), Instant.now());
        return unreadCount(authentication);
    }

    public void notifyTaskAssigned(User actor, User recipient, Task task) {
        if (actor.getId().equals(recipient.getId()) || !notificationEnabled(recipient, "issuesAssigned")) {
            return;
        }
        String title = "You were assigned: " + task.getTitle();
        String body = "%s assigned you to \"%s\" in %s / %s.".formatted(
                actor.getName(),
                task.getTitle(),
                task.getBoard().getWorkspace().getName(),
                task.getBoard().getName());
        createAndSend(actor, recipient, "task.assigned", title, body, taskLink(task), taskMetadata(task));
    }

    public void notifyTaskMention(User actor, User recipient, Task task) {
        if (actor.getId().equals(recipient.getId()) || !notificationEnabled(recipient, "mentions")) {
            return;
        }
        String title = actor.getName() + " mentioned you";
        String body = "%s mentioned you on \"%s\" in %s / %s.".formatted(
                actor.getName(),
                task.getTitle(),
                task.getBoard().getWorkspace().getName(),
                task.getBoard().getName());
        createAndSend(actor, recipient, "task.mentioned", title, body, taskLink(task), taskMetadata(task));
    }

    @Transactional
    protected void createAndSend(User actor, User recipient, String eventType, String title, String body,
            String linkPath, Map<String, Object> metadata) {
        Notification notification = new Notification();
        notification.setActor(actor);
        notification.setRecipient(recipient);
        notification.setEventType(eventType);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setLinkPath(linkPath);
        notification.setMetadata(metadata);
        notificationRepository.save(notification);

        var delivery = emailNotificationService.send(recipient.getEmail(), title, body + "\n\nOpen in CollabX: " + linkPath);
        notification.setEmailStatus(delivery.status());
        notification.setSesMessageId(delivery.messageId());
        notification.setErrorText(delivery.errorText());
        notification.setUpdatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    @SuppressWarnings("unchecked")
    private boolean notificationEnabled(User user, String key) {
        Object preferences = user.getPreferences() != null ? user.getPreferences().get("notifications") : null;
        if (!(preferences instanceof Map<?, ?> map)) {
            return true;
        }
        Object value = ((Map<String, Object>) map).get(key);
        return !(value instanceof Boolean enabled) || enabled;
    }

    private String taskLink(Task task) {
        return "/workspaces/%d/boards/%d".formatted(
                task.getBoard().getWorkspace().getId(),
                task.getBoard().getId());
    }

    private Map<String, Object> taskMetadata(Task task) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("workspaceId", String.valueOf(task.getBoard().getWorkspace().getId()));
        metadata.put("boardId", String.valueOf(task.getBoard().getId()));
        metadata.put("taskId", String.valueOf(task.getId()));
        metadata.put("taskTitle", task.getTitle());
        return metadata;
    }

    private NotificationDto toDto(Notification notification) {
        User actor = notification.getActor();
        return new NotificationDto(
                String.valueOf(notification.getId()),
                notification.getEventType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getLinkPath(),
                notification.getMetadata(),
                notification.getReadAt() != null,
                notification.getReadAt(),
                notification.getEmailStatus(),
                notification.getCreatedAt(),
                actor != null
                        ? new NotificationDto.ActorDto(String.valueOf(actor.getId()), actor.getName(), actor.getEmail())
                        : null);
    }
}
