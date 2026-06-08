package com.mahindra.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.AssignableUserDto;
import com.mahindra.backend.dto.CreateWorkspaceRequest;
import com.mahindra.backend.dto.UpdateWorkspaceRequest;
import com.mahindra.backend.dto.WorkspaceBoardDto;
import com.mahindra.backend.dto.WorkspaceCardDto;
import com.mahindra.backend.dto.WorkspaceMemberDto;
import com.mahindra.backend.dto.taskboard.CreateBoardRequest;
import com.mahindra.backend.entity.Board;
import com.mahindra.backend.entity.BoardMember;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.entity.WorkspaceMember;
import com.mahindra.backend.repository.BoardRepository;
import com.mahindra.backend.repository.BoardMemberRepository;
import com.mahindra.backend.repository.MilestoneRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class WorkspaceService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private final WorkspaceRepository workspaceRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final JdbcTemplate jdbcTemplate;

    public WorkspaceService(WorkspaceRepository workspaceRepository, BoardRepository boardRepository,
            BoardMemberRepository boardMemberRepository,
            UserRepository userRepository, TaskRepository taskRepository, MilestoneRepository milestoneRepository,
            JdbcTemplate jdbcTemplate) {
        this.workspaceRepository = workspaceRepository;
        this.boardRepository = boardRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.milestoneRepository = milestoneRepository;
        this.jdbcTemplate = jdbcTemplate;
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
        User user = resolveUser(authentication);
        Workspace workspace = resolveAccessibleWorkspace(user, workspaceId);
        return toDtos(List.of(workspace)).get(0);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceBoardDto> listBoards(Authentication authentication, Long workspaceId) {
        User user = resolveUser(authentication);
        resolveAccessibleWorkspace(user, workspaceId);
        boolean admin = hasGlobalRole(user, "ADMIN");
        return boardRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId).stream()
                .filter(b -> admin || boardMemberRepository.existsByBoardIdAndUserIdAndDeletedAtIsNull(b.getId(), user.getId()))
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
        workspace.setStatus(WorkspaceStatusMapper.toPersistedStatus(request.status()));
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

        workspace.addBoard(defaultBoard("Task Board", "", "#5F0229", creator, 0));

        workspaceRepository.save(workspace);
        workspaceRepository.flush();

        for (Board board : workspace.getBoards()) {
            for (WorkspaceMember workspaceMember : workspace.getMembers()) {
                BoardMember boardMember = new BoardMember();
                boardMember.setBoard(board);
                boardMember.setUser(workspaceMember.getUser());
                boardMember.setAssignedBy(creator);
                boardMember.setRoleInBoard(switch (workspaceMember.getRoleInWorkspace()) {
                    case "owner" -> "owner";
                    case "viewer" -> "viewer";
                    default -> "editor";
                });
                boardMemberRepository.save(boardMember);
            }
        }

        List<Workspace> hydrated = workspaceRepository.findAllWithMembersByIds(List.of(workspace.getId()));
        return toDtos(hydrated).get(0);
    }

    @Transactional
    public WorkspaceCardDto update(Authentication authentication, Long workspaceId, UpdateWorkspaceRequest request) {
        User user = resolveUser(authentication);
        Workspace workspace = resolveWorkspaceManager(user, workspaceId);
        if (request.title() != null && !request.title().isBlank()) {
            workspace.setName(request.title().trim());
        }
        if (request.description() != null) {
            workspace.setDescription(request.description().trim());
        }
        if (request.status() != null) {
            workspace.setStatus(WorkspaceStatusMapper.toPersistedStatus(request.status()));
        }
        if (request.imageUrl() != null) {
            workspace.setBannerImageUrl(trimToNull(request.imageUrl()));
        }
        if (request.budgetLabel() != null) {
            workspace.setBudgetLabel(trimToNull(request.budgetLabel()));
        }
        if (request.dueDate() != null) {
            workspace.setCardDueDate(parseDueDate(request.dueDate()));
        }
        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);
        return toDtos(List.of(workspace)).get(0);
    }

    @Transactional
    public WorkspaceCardDto addMembers(Authentication authentication, Long workspaceId, List<Long> userIds) {
        User manager = resolveUser(authentication);
        Workspace workspace = resolveWorkspaceManagerForUpdate(manager, workspaceId);
        if (userIds == null || userIds.isEmpty()) {
            throw new IllegalArgumentException("At least one user is required");
        }

        LinkedHashSet<Long> uniqueUserIds = new LinkedHashSet<>(userIds);
        LinkedHashSet<Long> existingMemberIds = new LinkedHashSet<>();
        for (WorkspaceMember member : workspace.getMembers()) {
            existingMemberIds.add(member.getUser().getId());
        }

        List<Board> boards = boardRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId);
        List<BoardMember> boardMembersToSave = new ArrayList<>();
        boolean changed = false;
        for (Long userId : uniqueUserIds) {
            User invitedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + userId));
            if (invitedUser.getStatus() != UserStatus.active) {
                throw new IllegalArgumentException("User " + userId + " is not active");
            }
            if (!existingMemberIds.contains(invitedUser.getId())) {
                WorkspaceMember workspaceMember = new WorkspaceMember();
                workspaceMember.setUser(invitedUser);
                workspaceMember.setRoleInWorkspace("collaborator");
                workspace.addMember(workspaceMember);
                existingMemberIds.add(invitedUser.getId());
                changed = true;
            }

            for (Board board : boards) {
                BoardMember boardMember = boardMemberRepository.findByBoardIdAndUserId(board.getId(), invitedUser.getId())
                        .orElseGet(() -> {
                            BoardMember created = new BoardMember();
                            created.setBoard(board);
                            created.setUser(invitedUser);
                            return created;
                        });
                boardMember.setAssignedBy(manager);
                boardMember.setRoleInBoard("editor");
                boardMember.setDeletedAt(null);
                boardMember.setDeletedBy(null);
                boardMember.setPurgeAfter(null);
                boardMembersToSave.add(boardMember);
            }
        }

        if (changed) {
            workspace.setUpdatedAt(Instant.now());
        }
        workspaceRepository.save(workspace);
        boardMemberRepository.saveAll(boardMembersToSave);
        workspaceRepository.flush();
        return toDtos(List.of(workspace)).get(0);
    }

    @Transactional
    public WorkspaceCardDto removeMember(Authentication authentication, Long workspaceId, Long userId) {
        User manager = resolveUser(authentication);
        Workspace workspace = resolveWorkspaceManagerForUpdate(manager, workspaceId);
        if (manager.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot remove yourself from this workspace");
        }

        WorkspaceMember memberToRemove = workspace.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User is not a member of this workspace"));

        workspace.getMembers().remove(memberToRemove);

        Instant now = Instant.now();
        Instant purgeAfter = now.plusSeconds(30L * 24 * 60 * 60);
        List<BoardMember> boardMemberships = boardMemberRepository
                .findByBoardWorkspaceIdAndUserIdAndDeletedAtIsNull(workspaceId, userId);
        for (BoardMember boardMember : boardMemberships) {
            boardMember.setDeletedAt(now);
            boardMember.setDeletedBy(manager);
            boardMember.setPurgeAfter(purgeAfter);
        }

        workspace.setUpdatedAt(now);
        workspaceRepository.save(workspace);
        boardMemberRepository.saveAll(boardMemberships);
        workspaceRepository.flush();
        return toDtos(List.of(workspace)).get(0);
    }

    @Transactional
    public void delete(Authentication authentication, Long workspaceId) {
        User user = resolveUser(authentication);
        Workspace workspace = resolveWorkspaceManager(user, workspaceId);
        workspace.setDeletedAt(Instant.now());
        workspace.setDeletedBy(user);
        workspace.setPurgeAfter(Instant.now().plusSeconds(30L * 24 * 60 * 60));
        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);
    }

    @Transactional
    public WorkspaceCardDto restore(Authentication authentication, Long workspaceId) {
        User user = resolveUser(authentication);
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        if (!canManageWorkspace(user, workspace)) {
            throw new IllegalArgumentException("User cannot manage this workspace");
        }
        workspace.setDeletedAt(null);
        workspace.setDeletedBy(null);
        workspace.setPurgeAfter(null);
        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);
        return toDtos(List.of(workspace)).get(0);
    }

    @Transactional
    public WorkspaceBoardDto createBoard(Authentication authentication, Long workspaceId, CreateBoardRequest request) {
        User user = resolveUser(authentication);
        lockWorkspaceBoardCreation(workspaceId);
        Workspace workspace = resolveWorkspaceManager(user, workspaceId);
        String name = request != null && request.name() != null && !request.name().isBlank() ? request.name().trim() : "Task Board";
        String description = request != null && request.description() != null ? request.description().trim() : "";
        String color = request != null && request.color() != null && !request.color().isBlank() ? request.color().trim() : "#5F0229";

        var recentDuplicate = boardRepository.findFirstByWorkspaceIdAndCreatedByIdAndNameAndDescriptionAndColorAndDeletedAtIsNullAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                workspaceId,
                user.getId(),
                name,
                description,
                color,
                Instant.now().minusSeconds(5));
        if (recentDuplicate.isPresent()) {
            return toBoardDto(recentDuplicate.get());
        }

        List<Board> existingBoards = boardRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId);
        Board board = defaultBoard(
                name,
                description,
                color,
                user,
                existingBoards.size());
        workspace.addBoard(board);
        boardRepository.saveAndFlush(board);
        for (WorkspaceMember workspaceMember : workspace.getMembers()) {
            BoardMember boardMember = new BoardMember();
            boardMember.setBoard(board);
            boardMember.setUser(workspaceMember.getUser());
            boardMember.setAssignedBy(user);
            boardMember.setRoleInBoard(switch (workspaceMember.getRoleInWorkspace()) {
                case "owner" -> "owner";
                case "viewer" -> "viewer";
                default -> "editor";
            });
            boardMemberRepository.save(boardMember);
        }
        boardMemberRepository.flush();
        return toBoardDto(board);
    }

    private void lockWorkspaceBoardCreation(Long workspaceId) {
        jdbcTemplate.query("select pg_advisory_xact_lock(?)", rs -> null, workspaceId);
    }

    private static Board defaultBoard(String name, String description, String color, User creator, int position) {
        Board board = new Board();
        board.setName(name);
        board.setDescription(description);
        board.setColor(color);
        board.setCreatedBy(creator);
        board.setPosition(position);
        return board;
    }

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private Workspace resolveAccessibleWorkspace(User user, Long workspaceId) {
        Workspace workspace = workspaceRepository.findActiveWithMembersById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        if (hasGlobalRole(user, "ADMIN") || workspace.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()))) {
            return workspace;
        }
        throw new IllegalArgumentException("Workspace not found");
    }

    private Workspace resolveWorkspaceManager(User user, Long workspaceId) {
        Workspace workspace = resolveAccessibleWorkspace(user, workspaceId);
        if (canManageWorkspace(user, workspace)) {
            return workspace;
        }
        throw new IllegalArgumentException("User cannot manage this workspace");
    }

    private Workspace resolveWorkspaceManagerForUpdate(User user, Long workspaceId) {
        Workspace workspace = workspaceRepository.findActiveWithMembersByIdForUpdate(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        if (canManageWorkspace(user, workspace)) {
            return workspace;
        }
        throw new IllegalArgumentException("User cannot manage this workspace");
    }

    private boolean canManageWorkspace(User user, Workspace workspace) {
        if (hasGlobalRole(user, "ADMIN")) {
            return true;
        }
        if (!hasGlobalRole(user, "TEAM_LEAD")) {
            return false;
        }
        return workspace.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId())
                        && ("owner".equals(m.getRoleInWorkspace()) || "collaborator".equals(m.getRoleInWorkspace())));
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
            List<WorkspaceMemberDto> memberDetails = w.getMembers().stream()
                    .sorted(Comparator.comparing(member -> member.getUser().getName(), String.CASE_INSENSITIVE_ORDER))
                    .map(member -> new WorkspaceMemberDto(
                            String.valueOf(member.getUser().getId()),
                            member.getUser().getName(),
                            member.getUser().getEmail(),
                            avatarUrl(member.getUser()),
                            member.getUser().getRoles().stream()
                                    .map(role -> role.getName())
                                    .sorted(this::compareRolePriority)
                                    .toList(),
                            member.getRoleInWorkspace()))
                    .toList();

            String due = w.getCardDueDate() != null ? w.getCardDueDate().format(ISO) : "No date";
            String budget = w.getBudgetLabel() != null && !w.getBudgetLabel().isBlank() ? w.getBudgetLabel() : "0k";

            out.add(new WorkspaceCardDto(
                    String.valueOf(w.getId()),
                    w.getName(),
                    w.getDescription() != null ? w.getDescription() : "",
                    w.getBannerImageUrl(),
                    memberNames,
                    memberDetails,
                    current,
                    estimated,
                    due,
                    budget,
                    WorkspaceStatusMapper.toUiStatus(w.getStatus())));
        }
        return out;
    }

    private WorkspaceBoardDto toBoardDto(Board board) {
        return new WorkspaceBoardDto(
                String.valueOf(board.getId()),
                board.getName(),
                board.getDescription() != null ? board.getDescription() : "",
                board.getColor());
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

    private static LocalDate parseDueDate(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty() || "No date".equalsIgnoreCase(s)) {
            return null;
        }
        LocalDate parsed;
        try {
            parsed = LocalDate.parse(s, ISO);
            validateFutureDueDate(parsed);
            return parsed;
        } catch (DateTimeParseException ignored) {
        }
        var us = DateTimeFormatter.ofPattern("MM/dd/uuuu");
        try {
            parsed = LocalDate.parse(s, us);
            validateFutureDueDate(parsed);
            return parsed;
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid due date; use yyyy-MM-dd or MM/dd/yyyy", e);
        }
    }

    private static void validateFutureDueDate(LocalDate dueDate) {
        if (!dueDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Due date must be in the future");
        }
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private int compareRolePriority(String left, String right) {
        int leftPriority = rolePriority(left);
        int rightPriority = rolePriority(right);
        if (leftPriority != rightPriority) {
            return Integer.compare(rightPriority, leftPriority);
        }
        return left.compareToIgnoreCase(right);
    }

    private int rolePriority(String role) {
        if (role == null) {
            return 0;
        }
        return switch (role.toUpperCase(Locale.ROOT)) {
            case "ADMIN" -> 4;
            case "TEAM_LEAD" -> 3;
            case "DEVELOPER" -> 2;
            case "VIEW_ONLY" -> 1;
            default -> 0;
        };
    }

    @SuppressWarnings("unchecked")
    private String avatarUrl(User user) {
        if (user.getPreferences() == null) {
            return null;
        }
        Object profile = user.getPreferences().get("profile");
        if (!(profile instanceof Map<?, ?> profileMap)) {
            return null;
        }
        Object avatarUrl = ((Map<String, Object>) profileMap).get("avatarUrl");
        return avatarUrl instanceof String value && !value.isBlank() ? value : null;
    }
}
