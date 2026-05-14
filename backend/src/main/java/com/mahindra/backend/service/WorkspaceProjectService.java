package com.mahindra.backend.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.AssignableUserDto;
import com.mahindra.backend.dto.CreateWorkspaceProjectRequest;
import com.mahindra.backend.dto.WorkspaceProjectCardDto;
import com.mahindra.backend.entity.Project;
import com.mahindra.backend.entity.ProjectMember;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.repository.MilestoneRepository;
import com.mahindra.backend.repository.ProjectRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class WorkspaceProjectService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;

    public WorkspaceProjectService(ProjectRepository projectRepository, WorkspaceRepository workspaceRepository,
            UserRepository userRepository, TaskRepository taskRepository, MilestoneRepository milestoneRepository) {
        this.projectRepository = projectRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
    }

    @Transactional(readOnly = true)
    public List<AssignableUserDto> listAssignableUsers() {
        return userRepository.findByStatus(UserStatus.active).stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new AssignableUserDto(u.getId(), u.getName(), u.getEmail()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WorkspaceProjectCardDto> listForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        boolean admin = hasGlobalRole(user, "ADMIN");
        List<Project> projects;
        if (admin) {
            projects = projectRepository.findAllWithMembers();
        } else {
            List<Long> ids = projectRepository.findProjectIdsByMemberUserId(user.getId());
            if (ids.isEmpty()) {
                return List.of();
            }
            projects = projectRepository.findAllWithMembersByIds(ids);
        }
        projects.sort(Comparator.comparing(Project::getCreatedAt).reversed());
        return toDtos(projects);
    }

    @Transactional
    public WorkspaceProjectCardDto create(Authentication authentication, CreateWorkspaceProjectRequest request) {
        User creator = resolveUser(authentication);
        LinkedHashSet<Long> memberIds = new LinkedHashSet<>(request.memberUserIds());
        memberIds.add(creator.getId());

        List<User> members = new ArrayList<>();
        for (Long id : memberIds) {
            User u = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + id));
            if (u.getStatus() != UserStatus.active) {
                throw new IllegalArgumentException("User " + id + " is not active");
            }
            members.add(u);
        }

        Workspace workspace = new Workspace();
        workspace.setName(request.title().trim() + " — Program");
        workspaceRepository.save(workspace);

        Project project = new Project();
        project.setName(request.title().trim());
        project.setDescription(request.description().trim());
        project.setStatus(toPersistedStatus(request.status()));
        project.setCreatedBy(creator);
        project.setWorkspace(workspace);
        project.setBannerImageUrl(trimToNull(request.imageUrl()));
        project.setBudgetLabel(trimToNull(request.budgetLabel()));
        project.setCardDueDate(parseDueDate(request.dueDate()));

        for (User u : members) {
            ProjectMember pm = new ProjectMember();
            pm.setUser(u);
            pm.setRoleInProject(u.getId().equals(creator.getId()) ? "owner" : "collaborator");
            project.addMember(pm);
        }

        projectRepository.save(project);
        projectRepository.flush();

        List<Project> hydrated = projectRepository.findAllWithMembersByIds(List.of(project.getId()));
        return toDtos(hydrated).get(0);
    }

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private static boolean hasGlobalRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(r -> roleName.equals(r.getName()));
    }

    private List<WorkspaceProjectCardDto> toDtos(List<Project> projects) {
        if (projects.isEmpty()) {
            return List.of();
        }
        List<Long> ids = projects.stream().map(Project::getId).toList();
        Map<Long, long[]> taskStats = loadTaskStats(ids);
        Map<Long, long[]> milestoneStats = loadMilestoneStats(ids);

        List<WorkspaceProjectCardDto> out = new ArrayList<>();
        for (Project p : projects) {
            long[] t = taskStats.getOrDefault(p.getId(), new long[] { 0L, 0L });
            long doneTasks = t[0];
            long totalTasks = t[1];
            int current = percent(doneTasks, totalTasks);

            long[] m = milestoneStats.getOrDefault(p.getId(), new long[] { 0L, 0L });
            long doneMs = m[0];
            long totalMs = m[1];
            int estimated = totalMs > 0 ? percent(doneMs, totalMs) : current;

            List<String> memberNames = p.getMembers().stream()
                    .map(pm -> pm.getUser().getName())
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList();

            String due = p.getCardDueDate() != null ? p.getCardDueDate().format(ISO) : "No date";
            String budget = p.getBudgetLabel() != null && !p.getBudgetLabel().isBlank() ? p.getBudgetLabel() : "0k";

            out.add(new WorkspaceProjectCardDto(
                    String.valueOf(p.getId()),
                    p.getName(),
                    p.getDescription() != null ? p.getDescription() : "",
                    p.getBannerImageUrl(),
                    memberNames,
                    current,
                    estimated,
                    due,
                    budget,
                    toUiStatus(p.getStatus())));
        }
        return out;
    }

    private Map<Long, long[]> loadTaskStats(List<Long> projectIds) {
        Map<Long, long[]> map = new HashMap<>();
        for (Object[] row : taskRepository.countDoneAndTotalByProjectIds(projectIds)) {
            Long pid = (Long) row[0];
            long done = ((Number) row[1]).longValue();
            long total = ((Number) row[2]).longValue();
            map.put(pid, new long[] { done, total });
        }
        return map;
    }

    private Map<Long, long[]> loadMilestoneStats(List<Long> projectIds) {
        Map<Long, long[]> map = new HashMap<>();
        for (Object[] row : milestoneRepository.countCompletedAndTotalByProjectIds(projectIds)) {
            Long pid = (Long) row[0];
            long done = ((Number) row[1]).longValue();
            long total = ((Number) row[2]).longValue();
            map.put(pid, new long[] { done, total });
        }
        return map;
    }

    private static int percent(long part, long total) {
        if (total <= 0L) {
            return 0;
        }
        return (int) Math.round(100.0 * part / total);
    }

    private static String toUiStatus(String db) {
        if (db == null) {
            return "planning";
        }
        return switch (db) {
            case "draft" -> "planning";
            case "on_hold" -> "in-progress";
            case "active" -> "active";
            case "completed" -> "completed";
            case "archived" -> "completed";
            default -> "planning";
        };
    }

    private static String toPersistedStatus(String ui) {
        if (ui == null || ui.isBlank()) {
            return "draft";
        }
        return switch (ui) {
            case "planning" -> "draft";
            case "in-progress" -> "on_hold";
            case "active" -> "active";
            case "completed" -> "completed";
            default -> "draft";
        };
    }

    private static LocalDate parseDueDate(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty() || "No date".equalsIgnoreCase(s)) {
            return null;
        }
        try {
            return LocalDate.parse(s, ISO);
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        var us = DateTimeFormatter.ofPattern("MM/dd/uuuu");
        try {
            return LocalDate.parse(s, us);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid due date; use yyyy-MM-dd or MM/dd/yyyy", e);
        }
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
