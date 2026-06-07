package com.mahindra.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class WorkspaceLifecycleService {

    private final WorkspaceRepository workspaceRepository;
    private final TaskRepository taskRepository;

    public WorkspaceLifecycleService(WorkspaceRepository workspaceRepository, TaskRepository taskRepository) {
        this.workspaceRepository = workspaceRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public void syncStatusFromTasks(Long workspaceId) {
        Workspace workspace = workspaceRepository.findActiveWithMembersByIdForUpdate(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if ("on_hold".equals(workspace.getStatus())) {
            return;
        }

        String nextStatus = deriveStatusFromTasks(workspaceId);
        if (!Objects.equals(workspace.getStatus(), nextStatus)) {
            workspace.setStatus(nextStatus);
            workspace.setUpdatedAt(Instant.now());
            workspaceRepository.save(workspace);
        }
    }

    private String deriveStatusFromTasks(Long workspaceId) {
        List<Object[]> rows = taskRepository.countDoneAndTotalByWorkspaceIds(List.of(workspaceId));
        if (rows.isEmpty()) {
            return "draft";
        }
        Object[] row = rows.get(0);
        long done = ((Number) row[1]).longValue();
        long total = ((Number) row[2]).longValue();
        if (total <= 0L) {
            return "draft";
        }
        if (done >= total) {
            return "completed";
        }
        return "active";
    }
}
