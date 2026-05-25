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
import com.mahindra.backend.dto.CreateWorkspaceRequest;
import com.mahindra.backend.dto.WorkspaceBoardDto;
import com.mahindra.backend.dto.WorkspaceCardDto;
import com.mahindra.backend.entity.Board;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.entity.WorkspaceMember;
import com.mahindra.backend.repository.BoardRepository;
import com.mahindra.backend.repository.MilestoneRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class WorkspaceService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private final WorkspaceRepository workspaceRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository, BoardRepository boardRepository,
            UserRepository userRepository, TaskRepository taskRepository, MilestoneRepository milestoneRepository) {
        this.workspaceRepository = workspaceRepository;
        this.boardRepository = boardRepository;
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
    public List<WorkspaceCardDto> listForCurrentUser(Authentication authentication) {
        User user = resolveUser(authentication);
        boolean admin = hasGlobalRole(user, "ADMIN");
        List<Workspace> workspaces;
        if (admin) {
            workspaces = workspaceRepository.findAllWithMembers();
        } else {
            List<Long> ids = workspaceRepository.findWorkspaceIdsByMemberUserId(user.getId());
            if (ids.isEmpty()) {
                return List.of();
            }
            workspaces = workspaceRepository.findAllWithMembersByIds(ids);
        }
        workspaces.sort(Comparator.comparing(Workspace::getCreatedAt).reversed());
        return toDtos(workspaces);
    }

    @Transactional(readOnly = true)
    public WorkspaceCardDto getForCurrentUser(Authentication authentication, Long workspaceId) {
        return listForCurrentUser(authentication).stream()
                .filter(w -> String.valueOf(workspaceId).equals(w.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
    }

    @Transactional(readOnly = true)
    public List<WorkspaceBoardDto> listBoards(Authentication authentication, Long workspaceId) {
        getForCurrentUser(authentication, workspaceId);
        return boardRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId).stream()
                .map(b -> new WorkspaceBoardDto(
                        String.valueOf(b.getId()),
                        b.getName(),
                        b.getDescription() != null ? b.getDescription() : "",
                        b.getColor()))
                .toList();
    }

    @Transactional
    public WorkspaceCardDto create(Authentication authentication, CreateWorkspaceRequest request) {
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
        workspace.setName(request.title().trim());
        workspace.setDescription(request.description().trim());
        workspace.setStatus(toPersistedStatus(request.status()));
        workspace.setCreatedBy(creator);
        workspace.setBannerImageUrl(trimToNull(request.imageUrl()));
        workspace.setBudgetLabel(trimToNull(request.budgetLabel()));
        workspace.setCardDueDate(parseDueDate(request.dueDate()));

        for (User u : members) {
            WorkspaceMember member = new WorkspaceMember();
            member.setUser(u);
            member.setRoleInWorkspace(u.getId().equals(creator.getId()) ? "owner" : "collaborator");
            workspace.addMember(member);
        }

        workspace.addBoard(defaultBoard("Planning", "Scope, milestones, and intake", "#5F0229"));
        workspace.addBoard(defaultBoard("Delivery", "Active implementation tasks", "#1976D2"));
        workspace.addBoard(defaultBoard("Review", "Validation, QA, and release checks", "#2E7D32"));

        workspaceRepository.save(workspace);
        workspaceRepository.flush();

        List<Workspace> hydrated = workspaceRepository.findAllWithMembersByIds(List.of(workspace.getId()));
        return toDtos(hydrated).get(0);
    }

    private static Board defaultBoard(String name, String description, String color) {
        Board board = new Board();
        board.setName(name);
        board.setDescription(description);
        board.setColor(color);
        return board;
    }

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private static boolean hasGlobalRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(r -> roleName.equals(r.getName()));
    }

    private List<WorkspaceCardDto> toDtos(List<Workspace> workspaces) {
        if (workspaces.isEmpty()) {
            return List.of();
        }
        List<Long> ids = workspaces.stream().map(Workspace::getId).toList();
        Map<Long, long[]> taskStats = loadTaskStats(ids);
        Map<Long, long[]> milestoneStats = loadMilestoneStats(ids);

        List<WorkspaceCardDto> out = new ArrayList<>();
        for (Workspace w : workspaces) {
            long[] t = taskStats.getOrDefault(w.getId(), new long[] { 0L, 0L });
            int current = percent(t[0], t[1]);

            long[] m = milestoneStats.getOrDefault(w.getId(), new long[] { 0L, 0L });
            int estimated = m[1] > 0 ? percent(m[0], m[1]) : current;

            List<String> memberNames = w.getMembers().stream()
                    .map(member -> member.getUser().getName())
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList();

            String due = w.getCardDueDate() != null ? w.getCardDueDate().format(ISO) : "No date";
            String budget = w.getBudgetLabel() != null && !w.getBudgetLabel().isBlank() ? w.getBudgetLabel() : "0k";

            out.add(new WorkspaceCardDto(
                    String.valueOf(w.getId()),
                    w.getName(),
                    w.getDescription() != null ? w.getDescription() : "",
                    w.getBannerImageUrl(),
                    memberNames,
                    current,
                    estimated,
                    due,
                    budget,
                    toUiStatus(w.getStatus())));
        }
        return out;
    }

    private Map<Long, long[]> loadTaskStats(List<Long> workspaceIds) {
        Map<Long, long[]> map = new HashMap<>();
        for (Object[] row : taskRepository.countDoneAndTotalByWorkspaceIds(workspaceIds)) {
            Long workspaceId = (Long) row[0];
            long done = ((Number) row[1]).longValue();
            long total = ((Number) row[2]).longValue();
            map.put(workspaceId, new long[] { done, total });
        }
        return map;
    }

    private Map<Long, long[]> loadMilestoneStats(List<Long> workspaceIds) {
        Map<Long, long[]> map = new HashMap<>();
        for (Object[] row : milestoneRepository.countCompletedAndTotalByWorkspaceIds(workspaceIds)) {
            Long workspaceId = (Long) row[0];
            long done = ((Number) row[1]).longValue();
            long total = ((Number) row[2]).longValue();
            map.put(workspaceId, new long[] { done, total });
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
