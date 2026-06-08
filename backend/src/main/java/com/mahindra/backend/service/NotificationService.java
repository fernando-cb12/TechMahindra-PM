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
import com.mahindra.backend.entity.Workspace;
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
    public NotificationDto markUnread(Authentication authentication, Long notificationId) {
        User user = resolveUser(authentication);
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getRecipient().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getReadAt() != null) {
            notification.setReadAt(null);
            notification.setUpdatedAt(Instant.now());
        }
        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public UnreadNotificationCountDto markAllRead(Authentication authentication) {
        User user = resolveUser(authentication);
        notificationRepository.markAllRead(user.getId(), Instant.now());
        return unreadCount(authentication);
    }

    @Transactional
    public void delete(Authentication authentication, Long notificationId) {
        User user = resolveUser(authentication);
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getRecipient().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
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
        createAndSend(actor, recipient, "task.assigned", title, body, taskLink(task), taskMetadata(task),
                EmailNotificationTemplate.context(
                        "Workspace", task.getBoard().getWorkspace().getName(),
                        "Board", task.getBoard().getName(),
                        "Task", task.getTitle()));
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
        createAndSend(actor, recipient, "task.mentioned", title, body, taskLink(task), taskMetadata(task),
                EmailNotificationTemplate.context(
                        "Workspace", task.getBoard().getWorkspace().getName(),
                        "Board", task.getBoard().getName(),
                        "Task", task.getTitle()));
    }

    public void notifyWorkspaceAdded(User actor, User recipient, Workspace workspace, String source) {
        if (actor.getId().equals(recipient.getId()) || !notificationEnabled(recipient, "projectUpdates")) {
            return;
        }
        String title = "You were added to " + workspace.getName();
        String body = "%s added you to the \"%s\" workspace.".formatted(actor.getName(), workspace.getName());
        Map<String, Object> metadata = workspaceMetadata(workspace, source);
        createAndSend(actor, recipient, "workspace.member_added", title, body, workspaceLink(workspace), metadata,
                EmailNotificationTemplate.context(
                        "Workspace", workspace.getName(),
                        "Added by", actor.getName()));
    }

    @Transactional
    protected void createAndSend(User actor, User recipient, String eventType, String title, String body,
            String linkPath, Map<String, Object> metadata) {
        createAndSend(actor, recipient, eventType, title, body, linkPath, metadata, Map.of());
    }

    @Transactional
    protected void createAndSend(User actor, User recipient, String eventType, String title, String body,
            String linkPath, Map<String, Object> metadata, Map<String, String> emailContext) {
        Notification notification = new Notification();
        notification.setActor(actor);
        notification.setRecipient(recipient);
        notification.setEventType(eventType);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setLinkPath(linkPath);
        notification.setMetadata(metadata);
        notificationRepository.save(notification);

        var email = EmailNotificationTemplate.branded(title, body, linkPath, emailContext);
        var delivery = emailNotificationService.send(recipient.getEmail(), title, email.text(), email.html());
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
        return "/workspaces/%d/boards/%d?task=%d".formatted(
                task.getBoard().getWorkspace().getId(),
                task.getBoard().getId(),
                task.getId());
    }

    private String workspaceLink(Workspace workspace) {
        return "/workspaces/%d".formatted(workspace.getId());
    }

    private Map<String, Object> taskMetadata(Task task) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("workspaceId", String.valueOf(task.getBoard().getWorkspace().getId()));
        metadata.put("boardId", String.valueOf(task.getBoard().getId()));
        metadata.put("taskId", String.valueOf(task.getId()));
        metadata.put("taskTitle", task.getTitle());
        return metadata;
    }

    private Map<String, Object> workspaceMetadata(Workspace workspace, String source) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("workspaceId", String.valueOf(workspace.getId()));
        metadata.put("workspaceName", workspace.getName());
        if (source != null && !source.isBlank()) {
            metadata.put("source", source);
        }
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
