package com.mahindra.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.mytasks.MyTaskItemDto;
import com.mahindra.backend.dto.mytasks.MyTasksResponseDto;
import com.mahindra.backend.dto.mytasks.MyTasksSummaryDto;
import com.mahindra.backend.dto.taskboard.FileAttachmentDto;
import com.mahindra.backend.dto.taskboard.TaskActivityDto;
import com.mahindra.backend.dto.taskboard.TaskUpdateDto;
import com.mahindra.backend.dto.taskboard.UserSummaryDto;
import com.mahindra.backend.entity.BoardColumnOption;
import com.mahindra.backend.entity.Task;
import com.mahindra.backend.entity.TaskActivity;
import com.mahindra.backend.entity.TaskFile;
import com.mahindra.backend.entity.TaskUpdate;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.repository.TaskActivityRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.UserRepository;

@Service
public class MyTasksService {

    private static final String FALLBACK_STATUS_COLOR = "#667085";
    private static final String FALLBACK_PRIORITY_COLOR = "#667085";

    private final TaskRepository taskRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final UserRepository userRepository;

    public MyTasksService(TaskRepository taskRepository,
            TaskActivityRepository taskActivityRepository,
            UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.taskActivityRepository = taskActivityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public MyTasksResponseDto listForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        List<MyTaskItemDto> items = taskRepository.findMyAssignedTasks(user.getId(), isAdmin(user)).stream()
                .map(this::toItemDto)
                .toList();
        return new MyTasksResponseDto(items, toSummary(items));
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
    }

    private MyTaskItemDto toItemDto(Task task) {
        BoardColumnOption statusOption = task.getStatusOption();
        BoardColumnOption priorityOption = task.getPriorityOption();
        String workflow = resolveWorkflow(statusOption, task);
        List<TaskFile> files = task.getFiles().stream()
                .filter(file -> file.getDeletedAt() == null)
                .sorted(Comparator.comparing(TaskFile::getUploadedAt))
                .toList();
        List<TaskUpdate> updates = task.getUpdates().stream()
                .filter(update -> update.getDeletedAt() == null)
                .sorted(Comparator.comparing(TaskUpdate::getCreatedAt))
                .toList();
        List<TaskActivity> activities = taskActivityRepository.findTop50ByTaskIdAndVisibilityOrderByCreatedAtDesc(task.getId(), "user");

        return new MyTaskItemDto(
                String.valueOf(task.getId()),
                String.valueOf(task.getBoard().getWorkspace().getId()),
                task.getBoard().getWorkspace().getName(),
                String.valueOf(task.getBoard().getId()),
                task.getBoard().getName(),
                task.getGroup() != null ? String.valueOf(task.getGroup().getId()) : "",
                task.getGroup() != null ? task.getGroup().getName() : "Ungrouped",
                task.getGroup() != null ? task.getGroup().getColor() : "#667085",
                task.getTitle(),
                task.getStatus(),
                statusOption != null ? statusOption.getLabel() : fallbackStatusLabel(task.getStatus()),
                statusOption != null ? statusOption.getColor() : FALLBACK_STATUS_COLOR,
                workflow,
                task.getPriority(),
                priorityOption != null ? priorityOption.getLabel() : fallbackPriorityLabel(task.getPriority()),
                priorityOption != null ? priorityOption.getColor() : FALLBACK_PRIORITY_COLOR,
                task.getDueDate() != null ? task.getDueDate().toString() : null,
                task.getProgress(),
                updates.stream().map(update -> toUpdateDto(update, files)).toList(),
                files.stream().map(this::toFileDto).toList(),
                activities.stream().map(this::toActivityDto).toList(),
                task.getCreatedAt().toString(),
                task.getUpdatedAt().toString());
    }

    private String resolveWorkflow(BoardColumnOption statusOption, Task task) {
        if (statusOption != null && statusOption.getWorkflowMeaning() != null && !"none".equals(statusOption.getWorkflowMeaning())) {
            return statusOption.getWorkflowMeaning();
        }
        if (task.getCompletedAt() != null || "done".equals(task.getStatus())) {
            return "done";
        }
        if ("in_progress".equals(task.getStatus())) {
            return "in_progress";
        }
        if ("todo".equals(task.getStatus()) || "new".equals(task.getStatus())) {
            return "new";
        }
        return "unclassified";
    }

    private String fallbackStatusLabel(String status) {
        if (status == null || status.isBlank()) {
            return "Open";
        }
        return switch (status) {
            case "todo" -> "To Do";
            case "in_progress" -> "In Progress";
            case "done" -> "Done";
            default -> humanize(status);
        };
    }

    private String fallbackPriorityLabel(String priority) {
        if (priority == null || priority.isBlank()) {
            return "Medium";
        }
        return humanize(priority);
    }

    private String humanize(String value) {
        return java.util.Arrays.stream(value.split("[_\\-\\s]+"))
                .filter(part -> !part.isBlank())
                .map(part -> part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    private MyTasksSummaryDto toSummary(List<MyTaskItemDto> items) {
        LocalDate today = LocalDate.now();
        Instant staleThreshold = Instant.now().minus(7, ChronoUnit.DAYS);
        long completed = items.stream().filter(item -> "done".equals(item.workflow())).count();
        long inProgress = items.stream().filter(item -> "in_progress".equals(item.workflow())).count();
        long overdue = items.stream().filter(item -> !"done".equals(item.workflow()) && isBeforeToday(item.dueDate(), today)).count();
        long dueSoon = items.stream().filter(item -> !"done".equals(item.workflow()) && isDueSoon(item.dueDate(), today)).count();
        long stale = items.stream().filter(item -> !"done".equals(item.workflow()) && Instant.parse(item.updatedAt()).isBefore(staleThreshold)).count();
        return new MyTasksSummaryDto(
                items.size(),
                items.size() - completed,
                inProgress,
                dueSoon,
                overdue,
                completed,
                stale);
    }

    private boolean isBeforeToday(String value, LocalDate today) {
        return value != null && LocalDate.parse(value).isBefore(today);
    }

    private boolean isDueSoon(String value, LocalDate today) {
        if (value == null) {
            return false;
        }
        LocalDate dueDate = LocalDate.parse(value);
        return !dueDate.isBefore(today) && !dueDate.isAfter(today.plusDays(7));
    }

    private TaskUpdateDto toUpdateDto(TaskUpdate update, List<TaskFile> allFiles) {
        List<TaskFile> files = allFiles.stream()
                .filter(file -> file.getUpdate() != null && file.getUpdate().getId().equals(update.getId()))
                .toList();
        return new TaskUpdateDto(
                String.valueOf(update.getId()),
                String.valueOf(update.getTask().getId()),
                String.valueOf(update.getAuthor().getId()),
                update.getContent(),
                update.getCreatedAt().toString(),
                update.getUpdatedAt() != null ? update.getUpdatedAt().toString() : null,
                files.stream().map(this::toFileDto).toList(),
                update.getMentions().stream().map(user -> String.valueOf(user.getId())).toList());
    }

    private FileAttachmentDto toFileDto(TaskFile file) {
        return new FileAttachmentDto(
                String.valueOf(file.getId()),
                file.getFileName(),
                file.getStorageUrl(),
                file.getUploadedAt().toString(),
                file.getMimeType() != null ? file.getMimeType() : "application/octet-stream",
                file.getSizeBytes(),
                toUserDto(file.getUploadedBy()));
    }

    private TaskActivityDto toActivityDto(TaskActivity activity) {
        return new TaskActivityDto(
                String.valueOf(activity.getId()),
                activity.getTask() != null ? String.valueOf(activity.getTask().getId()) : null,
                String.valueOf(activity.getActor().getId()),
                activity.getActor().getName(),
                initials(activity.getActor().getName()),
                activity.getEventType(),
                activity.getFieldKey(),
                activity.getOldValue(),
                activity.getNewValue(),
                activity.getCreatedAt().toString(),
                activity.getMetadata());
    }

    private UserSummaryDto toUserDto(User user) {
        return new UserSummaryDto(
                String.valueOf(user.getId()),
                user.getName(),
                null,
                initials(user.getName()),
                user.getEmail());
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) {
            return "?";
        }
        return java.util.Arrays.stream(name.trim().split("\\s+"))
                .filter(s -> !s.isBlank())
                .limit(2)
                .map(s -> s.substring(0, 1).toUpperCase())
                .collect(Collectors.joining());
    }
}
