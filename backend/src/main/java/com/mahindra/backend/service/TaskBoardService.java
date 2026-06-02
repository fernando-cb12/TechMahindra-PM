package com.mahindra.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.AssignableUserDto;
import com.mahindra.backend.dto.taskboard.BoardConfigDto;
import com.mahindra.backend.dto.taskboard.BoardSummaryDto;
import com.mahindra.backend.dto.taskboard.BoardViewDto;
import com.mahindra.backend.dto.taskboard.ColumnDefinitionDto;
import com.mahindra.backend.dto.taskboard.ColumnUpdateRequest;
import com.mahindra.backend.dto.taskboard.ColumnUpsertRequest;
import com.mahindra.backend.dto.taskboard.AddBoardMembersRequest;
import com.mahindra.backend.dto.taskboard.CreateGroupRequest;
import com.mahindra.backend.dto.taskboard.CreateTaskRequest;
import com.mahindra.backend.dto.taskboard.CreateUpdateRequest;
import com.mahindra.backend.dto.taskboard.FileAttachmentDto;
import com.mahindra.backend.dto.taskboard.FileAttachmentInputDto;
import com.mahindra.backend.dto.taskboard.MoveGroupRequest;
import com.mahindra.backend.dto.taskboard.MoveTaskRequest;
import com.mahindra.backend.dto.taskboard.SelectOptionDto;
import com.mahindra.backend.dto.taskboard.TaskBoardPayloadDto;
import com.mahindra.backend.dto.taskboard.TaskActivityDto;
import com.mahindra.backend.dto.taskboard.TaskDto;
import com.mahindra.backend.dto.taskboard.TaskGroupDto;
import com.mahindra.backend.dto.taskboard.TaskPatchRequest;
import com.mahindra.backend.dto.taskboard.TaskUpdateDto;
import com.mahindra.backend.dto.taskboard.UpdateBoardRequest;
import com.mahindra.backend.dto.taskboard.UpdateGroupRequest;
import com.mahindra.backend.dto.taskboard.UpdateUpdateRequest;
import com.mahindra.backend.dto.taskboard.UserSummaryDto;
import com.mahindra.backend.entity.Board;
import com.mahindra.backend.entity.BoardColumn;
import com.mahindra.backend.entity.BoardColumnOption;
import com.mahindra.backend.entity.BoardMember;
import com.mahindra.backend.entity.BoardView;
import com.mahindra.backend.entity.Task;
import com.mahindra.backend.entity.TaskActivity;
import com.mahindra.backend.entity.TaskCustomValue;
import com.mahindra.backend.entity.TaskFile;
import com.mahindra.backend.entity.TaskGroup;
import com.mahindra.backend.entity.TaskUpdate;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.entity.WorkspaceMember;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.repository.BoardColumnOptionRepository;
import com.mahindra.backend.repository.BoardColumnRepository;
import com.mahindra.backend.repository.BoardMemberRepository;
import com.mahindra.backend.repository.BoardRepository;
import com.mahindra.backend.repository.BoardViewRepository;
import com.mahindra.backend.repository.TaskActivityRepository;
import com.mahindra.backend.repository.TaskCustomValueRepository;
import com.mahindra.backend.repository.TaskFileRepository;
import com.mahindra.backend.repository.TaskGroupRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.TaskUpdateRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class TaskBoardService {

    private static final List<SelectOptionDto> DEFAULT_STATUS = List.of(
            new SelectOptionDto("todo", "To Do", "#B3B3B3", "new"),
            new SelectOptionDto("in_progress", "In Progress", "#EAC24F", "in_progress"),
            new SelectOptionDto("review", "Review", "#A3334D"),
            new SelectOptionDto("done", "Done", "#4CAF50", "done"),
            new SelectOptionDto("blocked", "Blocked", "#FB485B"));

    private static final List<SelectOptionDto> DEFAULT_PRIORITY = List.of(
            new SelectOptionDto("critical", "Critical", "#FB485B"),
            new SelectOptionDto("high", "High", "#EAC24F"),
            new SelectOptionDto("medium", "Medium", "#A3334D"),
            new SelectOptionDto("low", "Low", "#20EA37"));

    private final WorkspaceRepository workspaceRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final UserRepository userRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final BoardColumnOptionRepository boardColumnOptionRepository;
    private final BoardViewRepository boardViewRepository;
    private final TaskRepository taskRepository;
    private final TaskCustomValueRepository taskCustomValueRepository;
    private final TaskUpdateRepository taskUpdateRepository;
    private final TaskFileRepository taskFileRepository;
    private final TaskActivityRepository taskActivityRepository;

    public TaskBoardService(WorkspaceRepository workspaceRepository, BoardRepository boardRepository,
            BoardMemberRepository boardMemberRepository, UserRepository userRepository,
            TaskGroupRepository taskGroupRepository, BoardColumnRepository boardColumnRepository,
            BoardColumnOptionRepository boardColumnOptionRepository, BoardViewRepository boardViewRepository,
            TaskRepository taskRepository, TaskCustomValueRepository taskCustomValueRepository,
            TaskUpdateRepository taskUpdateRepository, TaskFileRepository taskFileRepository,
            TaskActivityRepository taskActivityRepository) {
        this.workspaceRepository = workspaceRepository;
        this.boardRepository = boardRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.userRepository = userRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.boardColumnOptionRepository = boardColumnOptionRepository;
        this.boardViewRepository = boardViewRepository;
        this.taskRepository = taskRepository;
        this.taskCustomValueRepository = taskCustomValueRepository;
        this.taskUpdateRepository = taskUpdateRepository;
        this.taskFileRepository = taskFileRepository;
        this.taskActivityRepository = taskActivityRepository;
    }

    @Transactional
    public TaskBoardPayloadDto getBoard(Authentication authentication, Long workspaceId, Long boardId) {
        User user = resolveUser(authentication);
        Board board = resolveAccessibleBoard(user, workspaceId, boardId);
        return toPayload(user, board);
    }

    @Transactional
    public TaskBoardPayloadDto updateBoard(Authentication authentication, Long workspaceId, Long boardId,
            UpdateBoardRequest request) {
        User user = resolveUser(authentication);
        Board board = resolveBoardManager(user, workspaceId, boardId);
        if (request.name() != null && !request.name().isBlank()) {
            board.setName(request.name().trim());
            board.setUpdatedAt(Instant.now());
            boardRepository.save(board);
            recordActivity(board, null, user, "board_renamed", "board", null, board.getName(), "user");
        }
        return toPayload(user, board);
    }

    @Transactional
    public void deleteBoard(Authentication authentication, Long workspaceId, Long boardId) {
        User user = resolveUser(authentication);
        Board board = resolveBoardManager(user, workspaceId, boardId);
        board.setDeletedAt(Instant.now());
        board.setDeletedBy(user);
        board.setPurgeAfter(Instant.now().plusSeconds(30L * 24 * 60 * 60));
        board.setUpdatedAt(Instant.now());
        boardRepository.save(board);
        recordActivity(board, null, user, "board_deleted", "board", board.getName(), null, "user");
    }

    @Transactional
    public TaskBoardPayloadDto restoreBoard(Authentication authentication, Long workspaceId, Long boardId) {
        User user = resolveUser(authentication);
        Board board = resolveBoardManagerIncludingDeleted(user, workspaceId, boardId);
        board.setDeletedAt(null);
        board.setDeletedBy(null);
        board.setPurgeAfter(null);
        board.setUpdatedAt(Instant.now());
        boardRepository.save(board);
        recordActivity(board, null, user, "board_restored", "board", null, board.getName(), "user");
        return toPayload(user, board);
    }

    @Transactional
    public TaskBoardPayloadDto addMembers(Authentication authentication, Long workspaceId, Long boardId,
            AddBoardMembersRequest request) {
        User actor = resolveUser(authentication);
        Board board = resolveEditableBoard(actor, workspaceId, boardId);
        Workspace workspace = workspaceRepository.findActiveWithMembersByIdForUpdate(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (!board.getWorkspace().getId().equals(workspace.getId())) {
            throw new ResourceNotFoundException("Board not found");
        }

        Set<Long> workspaceMemberIds = workspace.getMembers().stream()
                .map(member -> member.getUser().getId())
                .collect(Collectors.toSet());
        List<String> addedNames = new ArrayList<>();

        for (Long userId : request.userIds().stream().distinct().toList()) {
            User invitedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + userId));
            if (invitedUser.getStatus() != UserStatus.active) {
                throw new IllegalArgumentException("User " + userId + " is not active");
            }

            if (!workspaceMemberIds.contains(invitedUser.getId())) {
                WorkspaceMember workspaceMember = new WorkspaceMember();
                workspaceMember.setUser(invitedUser);
                workspaceMember.setRoleInWorkspace("collaborator");
                workspace.addMember(workspaceMember);
                workspaceMemberIds.add(invitedUser.getId());
            }

            BoardMember boardMember = boardMemberRepository.findByBoardIdAndUserId(boardId, invitedUser.getId())
                    .orElseGet(BoardMember::new);
            if (boardMember.getId() == null) {
                boardMember.setBoard(board);
                boardMember.setUser(invitedUser);
            }
            boardMember.setAssignedBy(actor);
            boardMember.setAssignedAt(Instant.now());
            boardMember.setRoleInBoard("editor");
            boardMember.setDeletedAt(null);
            boardMember.setDeletedBy(null);
            boardMember.setPurgeAfter(null);
            boardMemberRepository.save(boardMember);
            addedNames.add(invitedUser.getName());
        }

        workspace.setUpdatedAt(Instant.now());
        workspaceRepository.save(workspace);
        if (!addedNames.isEmpty()) {
            recordActivity(board, null, actor, "board_members_added", "members", null, addedNames, "user");
        }
        return toPayload(actor, board);
    }

    @Transactional(readOnly = true)
    public List<AssignableUserDto> listMemberCandidates(Authentication authentication, Long workspaceId, Long boardId) {
        User actor = resolveUser(authentication);
        Board board = resolveEditableBoard(actor, workspaceId, boardId);
        Workspace workspace = workspaceRepository.findActiveWithMembersById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        if (!board.getWorkspace().getId().equals(workspace.getId())) {
            throw new ResourceNotFoundException("Board not found");
        }
        Set<Long> workspaceMemberIds = workspace.getMembers().stream()
                .map(member -> member.getUser().getId())
                .collect(Collectors.toSet());
        return userRepository.findByStatus(UserStatus.active).stream()
                .filter(user -> !workspaceMemberIds.contains(user.getId()))
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(user -> new AssignableUserDto(user.getId(), user.getName(), user.getEmail()))
                .toList();
    }

    @Transactional(readOnly = true)
    public void assertCanEditTask(Authentication authentication, Long workspaceId, Long boardId, Long taskId) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        resolveTask(boardId, taskId);
    }

    @Transactional
    public TaskGroupDto createGroup(Authentication authentication, Long workspaceId, Long boardId, CreateGroupRequest request) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        TaskGroup group = new TaskGroup();
        group.setBoard(board);
        group.setName(request.name().trim());
        group.setColor(request.color() != null && !request.color().isBlank() ? request.color() : "#A3334D");
        group.setPosition(taskGroupRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId).size());
        taskGroupRepository.save(group);
        recordActivity(board, null, user, "group_created", "group", null, group.getName(), "user");
        return toGroupDto(group, List.of());
    }

    @Transactional
    public TaskGroupDto updateGroup(Authentication authentication, Long workspaceId, Long boardId, Long groupId,
            UpdateGroupRequest request) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        TaskGroup group = taskGroupRepository.findByIdAndBoardIdAndDeletedAtIsNull(groupId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Task group not found"));
        Map<String, Object> before = new LinkedHashMap<>();
        before.put("name", group.getName());
        before.put("color", group.getColor());
        before.put("order", group.getPosition());

        if (request.name() != null && !request.name().isBlank()) {
            group.setName(request.name().trim());
        }
        if (request.color() != null && !request.color().isBlank()) {
            group.setColor(request.color());
        }
        if (request.order() != null) {
            group.setPosition(Math.max(0, request.order()));
        }
        group.setUpdatedAt(Instant.now());
        taskGroupRepository.save(group);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("name", group.getName());
        after.put("color", group.getColor());
        after.put("order", group.getPosition());
        recordActivity(board, null, user, "group_updated", "group", before, after, "user");
        return toGroupDto(group, taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId));
    }

    @Transactional
    public void deleteGroup(Authentication authentication, Long workspaceId, Long boardId, Long groupId) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        TaskGroup group = taskGroupRepository.findByIdAndBoardIdAndDeletedAtIsNull(groupId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Task group not found"));
        Instant now = Instant.now();
        Instant purgeAfter = now.plusSeconds(30L * 24 * 60 * 60);
        group.setDeletedAt(now);
        group.setDeletedBy(user);
        group.setPurgeAfter(purgeAfter);
        group.setUpdatedAt(now);
        List<Task> tasks = taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId);
        for (Task task : tasks) {
            task.setDeletedAt(now);
            task.setDeletedBy(user);
            task.setPurgeAfter(purgeAfter);
            task.setUpdatedAt(now);
        }
        taskGroupRepository.save(group);
        taskRepository.saveAll(tasks);
        recordActivity(board, null, user, "group_deleted", "group", group.getName(), null, "user");
    }

    @Transactional
    public TaskGroupDto restoreGroup(Authentication authentication, Long workspaceId, Long boardId, Long groupId) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        TaskGroup group = taskGroupRepository.findByIdAndBoardId(groupId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Task group not found"));
        group.setDeletedAt(null);
        group.setDeletedBy(null);
        group.setPurgeAfter(null);
        Instant now = Instant.now();
        group.setUpdatedAt(now);
        List<Task> tasks = taskRepository.findByGroupIdOrderByPositionAscIdAsc(groupId);
        for (Task task : tasks) {
            task.setDeletedAt(null);
            task.setDeletedBy(null);
            task.setPurgeAfter(null);
            task.setUpdatedAt(now);
        }
        taskGroupRepository.save(group);
        taskRepository.saveAll(tasks);
        recordActivity(board, null, user, "group_restored", "group", null, group.getName(), "user");
        return toGroupDto(group, taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId));
    }

    @Transactional
    public void moveGroup(Authentication authentication, Long workspaceId, Long boardId, Long groupId, MoveGroupRequest request) {
        User user = resolveUser(authentication);
        Board sourceBoard = resolveEditableBoard(user, workspaceId, boardId);
        Board targetBoard = resolveEditableBoard(user, workspaceId, request.toBoardId());
        TaskGroup group = taskGroupRepository.findByIdAndBoardIdAndDeletedAtIsNull(groupId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Task group not found"));
        if (sourceBoard.getId().equals(targetBoard.getId())) {
            return;
        }
        int targetPosition = request.position() != null
                ? Math.max(0, request.position())
                : taskGroupRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(targetBoard.getId()).size();
        Map<String, Object> before = Map.of("board", sourceBoard.getName(), "group", group.getName());
        group.setBoard(targetBoard);
        group.setPosition(targetPosition);
        group.setUpdatedAt(Instant.now());
        List<Task> tasks = taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId);
        for (Task task : tasks) {
            task.setBoard(targetBoard);
            task.setUpdatedAt(Instant.now());
        }
        taskGroupRepository.save(group);
        taskRepository.saveAll(tasks);
        Map<String, Object> after = Map.of("board", targetBoard.getName(), "group", group.getName());
        recordActivity(targetBoard, null, user, "group_moved", "board", before, after, "user");
    }

    @Transactional
    public TaskDto createTask(Authentication authentication, Long workspaceId, Long boardId, Long groupId,
            CreateTaskRequest request) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        TaskGroup group = taskGroupRepository.findById(groupId)
                .filter(g -> g.getDeletedAt() == null && g.getBoard().getId().equals(boardId))
                .orElseThrow(() -> new ResourceNotFoundException("Task group not found"));

        Map<String, BoardColumnOption> statusOptions = optionMap(boardId, "col_status");
        Map<String, BoardColumnOption> priorityOptions = optionMap(boardId, "col_priority");

        Task task = new Task();
        task.setBoard(board);
        task.setGroup(group);
        task.setTitle(request.name().trim());
        task.setCreatedBy(user);
        task.setStatus("todo");
        task.setPriority("medium");
        task.setStatusOption(statusOptions.get("todo"));
        task.setPriorityOption(priorityOptions.get("medium"));
        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            task.setDueDate(parseDate(request.dueDate()));
        }
        task.setPosition(taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId).size());
        taskRepository.save(task);
        recordActivity(board, task, user, "task_created", "task", null, task.getTitle(), "user");
        return toTaskDto(task, List.of(), List.of(), List.of(),
                taskActivityRepository.findTop100ByBoardIdAndVisibilityOrderByCreatedAtDesc(boardId, "user"));
    }

    @Transactional
    public TaskDto patchTask(Authentication authentication, Long workspaceId, Long boardId, Long taskId,
            TaskPatchRequest request) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        Task task = resolveTask(boardId, taskId);
        Map<String, Object> before = taskSnapshot(task);

        if (request.name() != null) {
            task.setTitle(request.name().trim());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
            task.setStatusOption(optionMap(boardId, "col_status").get(request.status()));
            if ("done".equals(request.status()) && task.getCompletedAt() == null) {
                task.setCompletedAt(Instant.now());
            } else if (!"done".equals(request.status())) {
                task.setCompletedAt(null);
            }
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
            task.setPriorityOption(optionMap(boardId, "col_priority").get(request.priority()));
        }
        if (request.dueDate() != null) {
            task.setDueDate(parseDate(request.dueDate()));
        }
        if (request.progress() != null) {
            task.setProgress(Math.max(0, Math.min(100, request.progress())));
        }
        if (request.budget() != null) {
            task.setBudget(request.budget());
        }
        if (request.assigneeIds() != null) {
            Set<Long> ids = request.assigneeIds().stream().map(Long::valueOf).collect(Collectors.toSet());
            List<User> assignees = userRepository.findAllById(ids);
            task.getAssignees().clear();
            task.getAssignees().addAll(assignees);
            task.setAssignedTo(assignees.isEmpty() ? null : assignees.get(0));
        }
        if (request.values() != null) {
            applyCustomValues(task, request.values());
        }
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        recordChangedTaskFields(task, user, before, taskSnapshot(task));
        return toTaskDto(task,
                taskCustomValueRepository.findByTaskBoardIdAndTaskDeletedAtIsNull(boardId),
                taskUpdateRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(boardId),
                taskFileRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByUploadedAtAsc(boardId),
                taskActivityRepository.findTop100ByBoardIdAndVisibilityOrderByCreatedAtDesc(boardId, "user"));
    }

    @Transactional
    public void deleteTask(Authentication authentication, Long workspaceId, Long boardId, Long taskId) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        Task task = resolveTask(boardId, taskId);
        task.setDeletedAt(Instant.now());
        task.setDeletedBy(user);
        task.setPurgeAfter(Instant.now().plusSeconds(30L * 24 * 60 * 60));
        taskRepository.save(task);
        recordActivity(task.getBoard(), task, user, "task_deleted", "task", task.getTitle(), null, "user");
    }

    @Transactional
    public TaskDto restoreTask(Authentication authentication, Long workspaceId, Long boardId, Long taskId) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getBoard().getId().equals(boardId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        task.setDeletedAt(null);
        task.setDeletedBy(null);
        task.setPurgeAfter(null);
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        recordActivity(task.getBoard(), task, user, "task_restored", "task", null, task.getTitle(), "user");
        return toTaskDto(task,
                taskCustomValueRepository.findByTaskBoardIdAndTaskDeletedAtIsNull(boardId),
                taskUpdateRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(boardId),
                taskFileRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByUploadedAtAsc(boardId),
                taskActivityRepository.findTop100ByBoardIdAndVisibilityOrderByCreatedAtDesc(boardId, "user"));
    }

    @Transactional
    public ColumnDefinitionDto createColumn(Authentication authentication, Long workspaceId, Long boardId,
            ColumnUpsertRequest request) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setKey(uniqueColumnKey(boardId, request.label()));
        column.setLabel(request.label().trim());
        column.setType(request.type());
        column.setWidth(request.width());
        column.setVisible(request.visible() == null || request.visible());
        column.setPosition(request.order() != null ? request.order()
                : boardColumnRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId).size());
        if (request.options() != null) {
            int index = 0;
            for (SelectOptionDto option : request.options()) {
                column.addOption(option(option.id(), option.label(), option.color(), option.workflowMeaning(), column.getType(), index++));
            }
        }
        boardColumnRepository.save(column);
        recordActivity(board, null, user, "column_created", column.getKey(), null, column.getLabel(), "user");
        return toColumnDto(column);
    }

    @Transactional
    public List<ColumnDefinitionDto> replaceColumns(Authentication authentication, Long workspaceId, Long boardId,
            List<ColumnUpdateRequest> request) {
        User user = resolveUser(authentication);
        Board board = resolveEditableBoard(user, workspaceId, boardId);
        List<BoardColumn> existingColumns = boardColumnRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId);
        Map<String, BoardColumn> existingByKey = existingColumns.stream()
                .collect(Collectors.toMap(BoardColumn::getKey, Function.identity()));
        Set<String> requestedKeys = request.stream()
                .map(ColumnUpdateRequest::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        int index = 0;
        for (ColumnUpdateRequest input : request) {
            if (input.id() == null || input.id().isBlank()) {
                continue;
            }
            BoardColumn column = existingByKey.get(input.id());
            if (column == null) {
                column = new BoardColumn();
                column.setBoard(board);
                column.setKey(input.id());
                column.setSystemColumn(false);
                existingByKey.put(input.id(), column);
            }
            if (input.label() != null && !input.label().isBlank()) {
                column.setLabel(input.label().trim());
            }
            if (input.type() != null && !input.type().isBlank()) {
                column.setType(input.type());
            }
            column.setWidth(input.width());
            column.setVisible(input.visible() == null || input.visible());
            column.setPosition(input.order() != null ? input.order() : index);
            column.setUpdatedAt(Instant.now());
            applyColumnOptions(column, input.options(), user);
            boardColumnRepository.save(column);
            index++;
        }

        for (BoardColumn column : existingColumns) {
            if (!Boolean.TRUE.equals(column.getSystemColumn()) && !requestedKeys.contains(column.getKey())) {
                column.setDeletedAt(Instant.now());
                column.setDeletedBy(user);
                column.setPurgeAfter(Instant.now().plusSeconds(30L * 24 * 60 * 60));
                boardColumnRepository.save(column);
            }
        }
        recordActivity(board, null, user, "columns_updated", "columns", null, request, "user");
        return boardColumnRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId)
                .stream().map(this::toColumnDto).toList();
    }

    @Transactional
    public TaskUpdateDto createUpdate(Authentication authentication, Long workspaceId, Long boardId, Long taskId,
            CreateUpdateRequest request) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        Task task = resolveTask(boardId, taskId);
        if ((request.content() == null || request.content().isBlank())
                && (request.attachments() == null || request.attachments().isEmpty())) {
            throw new IllegalArgumentException("Update content or attachments are required");
        }

        TaskUpdate update = new TaskUpdate();
        update.setTask(task);
        update.setAuthor(user);
        update.setContent(request.content() != null ? request.content() : "");
        if (request.mentions() != null && !request.mentions().isEmpty()) {
            update.getMentions().addAll(userRepository.findAllById(request.mentions().stream().map(Long::valueOf).toList()));
        }
        taskUpdateRepository.save(update);

        if (request.attachments() != null) {
            for (FileAttachmentInputDto input : request.attachments()) {
                TaskFile file = new TaskFile();
                file.setTask(task);
                file.setUpdate(update);
                file.setFileName(input.name());
                file.setStorageUrl(input.url());
                file.setMimeType(input.type());
                file.setSizeBytes(input.size() != null ? input.size() : 0L);
                file.setUploadedBy(user);
                taskFileRepository.save(file);
                update.getAttachments().add(file);
            }
        }
        recordActivity(task.getBoard(), task, user, "update_created", "updates", null, update.getContent(), "user");
        return toUpdateDto(update, new ArrayList<>(update.getAttachments()));
    }

    @Transactional
    public TaskUpdateDto updateUpdate(Authentication authentication, Long workspaceId, Long boardId, Long taskId,
            Long updateId, UpdateUpdateRequest request) {
        User user = resolveUser(authentication);
        resolveEditableBoard(user, workspaceId, boardId);
        TaskUpdate update = taskUpdateRepository.findByIdAndTaskIdAndTaskBoardIdAndDeletedAtIsNull(updateId, taskId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Update not found"));
        if (!update.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the update author can edit this comment");
        }
        String nextContent = request.content() != null ? request.content().trim() : "";
        if (nextContent.isBlank() && update.getAttachments().isEmpty()) {
            throw new IllegalArgumentException("Update content or attachments are required");
        }
        String previousContent = update.getContent();
        update.setContent(nextContent);
        update.setUpdatedAt(Instant.now());
        update.getMentions().clear();
        if (request.mentions() != null && !request.mentions().isEmpty()) {
            update.getMentions().addAll(userRepository.findAllById(request.mentions().stream().map(Long::valueOf).toList()));
        }
        taskUpdateRepository.save(update);
        recordActivity(update.getTask().getBoard(), update.getTask(), user, "update_edited", "updates", previousContent, nextContent, "user");
        return toUpdateDto(update, new ArrayList<>(update.getAttachments()));
    }

    @Transactional
    public void moveTask(Authentication authentication, Long workspaceId, Long boardId, Long taskId,
            MoveTaskRequest request) {
        User user = resolveUser(authentication);
        Board sourceBoard = resolveEditableBoard(user, workspaceId, boardId);
        Board targetBoard = resolveEditableBoard(user, workspaceId, request.toBoardId());
        Task task = resolveTask(boardId, taskId);
        TaskGroup targetGroup = taskGroupRepository.findById(request.toGroupId())
                .filter(g -> g.getBoard().getId().equals(targetBoard.getId()) && g.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Target group not found"));
        Long sourceGroupId = task.getGroup() != null ? task.getGroup().getId() : null;
        String sourceGroupName = task.getGroup() != null ? task.getGroup().getName() : "No group";

        if (!sourceBoard.getId().equals(targetBoard.getId())) {
            discardIncompatibleCustomValues(task, targetBoard, user);
        }
        task.setBoard(targetBoard);
        task.setGroup(targetGroup);
        task.setPosition(0);
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        if (sourceGroupId != null && !sourceGroupId.equals(targetGroup.getId())) {
            normalizeTaskPositions(sourceGroupId, null, null);
        }
        normalizeTaskPositions(targetGroup.getId(), task, request.position());
        Map<String, Object> before = new LinkedHashMap<>();
        before.put("board", sourceBoard.getName());
        before.put("group", sourceGroupName);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("board", targetBoard.getName());
        after.put("group", targetGroup.getName());
        recordActivity(targetBoard, task, user, "task_moved",
                sourceBoard.getId().equals(targetBoard.getId()) ? "group" : "board",
                before, after, "user");
    }

    private TaskBoardPayloadDto toPayload(User user, Board board) {
        ensureDefaults(board, user);

        Long boardId = board.getId();
        List<BoardColumn> columns = boardColumnRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId);
        List<TaskGroup> groups = taskGroupRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId);
        List<Task> tasks = taskRepository.findByBoardIdAndDeletedAtIsNullOrderByGroupPositionAscPositionAscIdAsc(boardId);
        List<TaskCustomValue> values = taskCustomValueRepository.findByTaskBoardIdAndTaskDeletedAtIsNull(boardId);
        List<TaskUpdate> updates = taskUpdateRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByCreatedAtAsc(boardId);
        List<TaskFile> files = taskFileRepository.findByTaskBoardIdAndDeletedAtIsNullOrderByUploadedAtAsc(boardId);
        List<TaskActivity> activities = taskActivityRepository.findTop100ByBoardIdAndVisibilityOrderByCreatedAtDesc(boardId, "user");
        List<BoardView> views = boardViewRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(boardId);
        Map<String, UserSummaryDto> users = loadBoardUsers(board);

        Map<Long, List<Task>> tasksByGroup = tasks.stream()
                .filter(t -> t.getGroup() != null)
                .collect(Collectors.groupingBy(t -> t.getGroup().getId()));

        List<TaskGroupDto> groupDtos = groups.stream()
                .map(g -> toGroupDto(g, tasksByGroup.getOrDefault(g.getId(), List.of())))
                .toList();

        Map<String, TaskDto> taskDtos = tasks.stream()
                .collect(Collectors.toMap(t -> String.valueOf(t.getId()), t -> toTaskDto(t, values, updates, files, activities),
                        (a, b) -> a, LinkedHashMap::new));

        List<ColumnDefinitionDto> columnDtos = columns.stream().map(this::toColumnDto).toList();
        List<SelectOptionDto> statusOptions = findColumnOptions(columns, "col_status");
        List<SelectOptionDto> priorityOptions = findColumnOptions(columns, "col_priority");
        List<BoardSummaryDto> availableBoards = boardRepository
                .findByWorkspaceIdAndDeletedAtIsNullOrderByPositionAscCreatedAtAsc(board.getWorkspace().getId()).stream()
                .filter(b -> canReadBoard(user, b))
                .map(this::toBoardSummaryDto)
                .toList();

        return new TaskBoardPayloadDto(
                new BoardConfigDto(String.valueOf(board.getId()), board.getName(), columnDtos, statusOptions, priorityOptions),
                groupDtos,
                taskDtos,
                users,
                availableBoards,
                views.stream().map(this::toViewDto).toList());
    }

    private void ensureDefaults(Board board, User actor) {
        if (boardColumnRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(board.getId()).isEmpty()) {
            createSystemColumns(board);
        }
        if (taskGroupRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(board.getId()).isEmpty()) {
            TaskGroup group = new TaskGroup();
            group.setBoard(board);
            group.setName("New Group");
            group.setColor(board.getColor() != null ? board.getColor() : "#A3334D");
            group.setPosition(0);
            taskGroupRepository.save(group);
        }
        if (boardViewRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(board.getId()).isEmpty()) {
            boardViewRepository.save(view(board, "Main Table", "table", 0, true, actor));
            boardViewRepository.save(view(board, "Insights", "insights", 1, false, actor));
            boardViewRepository.save(view(board, "Calendar", "calendar", 2, false, actor));
        }
    }

    private void createSystemColumns(Board board) {
        BoardColumn name = column(board, "col_name", "Task", "text", 0, true);
        BoardColumn assignee = column(board, "col_assignee", "Assignee", "assignee", 1, true);
        BoardColumn status = column(board, "col_status", "Status", "status", 2, true);
        int idx = 0;
        for (SelectOptionDto option : DEFAULT_STATUS) {
            status.addOption(option(option.id(), option.label(), option.color(), option.workflowMeaning(), status.getType(), idx++));
        }
        BoardColumn priority = column(board, "col_priority", "Priority", "priority", 3, true);
        idx = 0;
        for (SelectOptionDto option : DEFAULT_PRIORITY) {
            priority.addOption(option(option.id(), option.label(), option.color(), option.workflowMeaning(), priority.getType(), idx++));
        }
        boardColumnRepository.saveAll(List.of(
                name,
                assignee,
                status,
                priority,
                column(board, "col_date", "Due Date", "date", 4, true),
                column(board, "col_progress", "Progress", "progress", 5, true),
                column(board, "col_budget", "Budget", "budget", 6, true),
                column(board, "col_files", "Files", "files", 7, true)));
    }

    private BoardColumn column(Board board, String key, String label, String type, int position, boolean system) {
        BoardColumn column = new BoardColumn();
        column.setBoard(board);
        column.setKey(key);
        column.setLabel(label);
        column.setType(type);
        column.setPosition(position);
        column.setSystemColumn(system);
        return column;
    }

    private BoardColumnOption option(String key, String label, String color, String workflowMeaning, String columnType, int position) {
        BoardColumnOption option = new BoardColumnOption();
        option.setKey(key);
        option.setLabel(label);
        option.setColor(color);
        option.setWorkflowMeaning(normalizeWorkflowMeaning(workflowMeaning, columnType));
        option.setPosition(position);
        return option;
    }

    private String normalizeWorkflowMeaning(String workflowMeaning, String columnType) {
        if (!supportsWorkflowMeaning(columnType)) {
            return "none";
        }
        if (workflowMeaning == null || workflowMeaning.isBlank()) {
            return "none";
        }
        return switch (workflowMeaning) {
            case "new", "in_progress", "done" -> workflowMeaning;
            default -> "none";
        };
    }

    private boolean supportsWorkflowMeaning(String columnType) {
        return "status".equals(columnType) || "singleSelect".equals(columnType) || "multiSelect".equals(columnType);
    }

    private void applyColumnOptions(BoardColumn column, List<SelectOptionDto> options, User user) {
        if (options == null) {
            return;
        }
        Map<String, BoardColumnOption> existingByKey = column.getOptions().stream()
                .collect(Collectors.toMap(BoardColumnOption::getKey, Function.identity(), (a, b) -> a));
        Set<String> requestedKeys = options.stream().map(SelectOptionDto::id).collect(Collectors.toSet());
        int index = 0;
        for (SelectOptionDto input : options) {
            if (input.id() == null || input.id().isBlank()) {
                continue;
            }
            BoardColumnOption option = existingByKey.get(input.id());
            if (option == null) {
                option = option(input.id(), input.label(), input.color(), input.workflowMeaning(), column.getType(), index);
                column.addOption(option);
            } else {
                option.setLabel(input.label());
                option.setColor(input.color());
                option.setWorkflowMeaning(normalizeWorkflowMeaning(input.workflowMeaning(), column.getType()));
                option.setPosition(index);
                option.setDeletedAt(null);
                option.setDeletedBy(null);
                option.setPurgeAfter(null);
            }
            index++;
        }
        for (BoardColumnOption option : column.getOptions()) {
            if (!requestedKeys.contains(option.getKey())) {
                option.setDeletedAt(Instant.now());
                option.setDeletedBy(user);
                option.setPurgeAfter(Instant.now().plusSeconds(30L * 24 * 60 * 60));
            }
        }
    }

    private BoardView view(Board board, String name, String type, int position, boolean isDefault, User actor) {
        BoardView view = new BoardView();
        view.setBoard(board);
        view.setName(name);
        view.setType(type);
        view.setPosition(position);
        view.setDefaultView(isDefault);
        view.setCreatedBy(actor);
        return view;
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private Board resolveAccessibleBoard(User user, Long workspaceId, Long boardId) {
        Board board = boardRepository.findActiveByWorkspaceIdAndId(workspaceId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        if (!canReadBoard(user, board)) {
            throw new ResourceNotFoundException("Board not found");
        }
        return board;
    }

    private Board resolveEditableBoard(User user, Long workspaceId, Long boardId) {
        Board board = resolveAccessibleBoard(user, workspaceId, boardId);
        if (isAdmin(user)) {
            return board;
        }
        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, user.getId())
                .filter(m -> m.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        if ("viewer".equals(member.getRoleInBoard())) {
            throw new IllegalArgumentException("User cannot edit this board");
        }
        return board;
    }

    private Board resolveBoardManager(User user, Long workspaceId, Long boardId) {
        Board board = resolveAccessibleBoard(user, workspaceId, boardId);
        assertCanManageBoard(user, boardId);
        return board;
    }

    private Board resolveBoardManagerIncludingDeleted(User user, Long workspaceId, Long boardId) {
        Board board = boardRepository.findAnyByWorkspaceIdAndId(workspaceId, boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        if (!canReadBoard(user, board)) {
            throw new ResourceNotFoundException("Board not found");
        }
        assertCanManageBoard(user, boardId);
        return board;
    }

    private void assertCanManageBoard(User user, Long boardId) {
        if (isAdmin(user)) {
            return;
        }
        if (!isTeamLead(user)) {
            throw new IllegalArgumentException("User cannot manage this board");
        }
        BoardMember member = boardMemberRepository.findByBoardIdAndUserId(boardId, user.getId())
                .filter(m -> m.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        if (!"owner".equals(member.getRoleInBoard()) && !"editor".equals(member.getRoleInBoard())) {
            throw new IllegalArgumentException("User cannot manage this board");
        }
    }

    private boolean canReadBoard(User user, Board board) {
        return isAdmin(user) || boardMemberRepository.existsByBoardIdAndUserIdAndDeletedAtIsNull(board.getId(), user.getId());
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
    }

    private boolean isTeamLead(User user) {
        return user.getRoles().stream().anyMatch(r -> "TEAM_LEAD".equals(r.getName()));
    }

    private Task resolveTask(Long boardId, Long taskId) {
        return taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null && t.getBoard().getId().equals(boardId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private Workspace resolveWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
    }

    private Map<String, UserSummaryDto> loadBoardUsers(Board board) {
        Workspace workspace = resolveWorkspace(board.getWorkspace().getId());
        return workspace.getMembers().stream()
                .map(m -> m.getUser())
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toMap(u -> String.valueOf(u.getId()), this::toUserDto, (a, b) -> a, LinkedHashMap::new));
    }

    private void applyCustomValues(Task task, Map<String, Object> values) {
        Map<String, BoardColumn> columns = boardColumnRepository
                .findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(task.getBoard().getId()).stream()
                .collect(Collectors.toMap(BoardColumn::getKey, Function.identity()));
        Map<String, TaskCustomValue> existing = task.getCustomValues().stream()
                .collect(Collectors.toMap(v -> v.getColumn().getKey(), Function.identity()));
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            BoardColumn column = columns.get(entry.getKey());
            if (column == null || column.getSystemColumn()) {
                continue;
            }
            TaskCustomValue value = existing.get(entry.getKey());
            if (value == null) {
                value = new TaskCustomValue();
                value.setTask(task);
                value.setColumn(column);
                task.getCustomValues().add(value);
            }
            value.setValue(entry.getValue());
            value.setUpdatedAt(Instant.now());
        }
    }

    private void discardIncompatibleCustomValues(Task task, Board targetBoard, User user) {
        Set<String> targetKeys = boardColumnRepository
                .findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(targetBoard.getId()).stream()
                .map(BoardColumn::getKey)
                .collect(Collectors.toSet());
        List<TaskCustomValue> discarded = task.getCustomValues().stream()
                .filter(value -> !targetKeys.contains(value.getColumn().getKey()))
                .toList();
        if (!discarded.isEmpty()) {
            Map<String, Object> oldValues = discarded.stream()
                    .collect(Collectors.toMap(v -> v.getColumn().getKey(), TaskCustomValue::getValue));
            task.getCustomValues().removeAll(discarded);
            recordActivity(targetBoard, task, user, "custom_values_discarded", "custom_values", oldValues, null, "internal");
        }
    }

    private void normalizeTaskPositions(Long groupId, Task insertedTask, Integer requestedPosition) {
        List<Task> orderedTasks = new ArrayList<>(taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(groupId));
        if (insertedTask != null) {
            orderedTasks.removeIf(t -> t.getId().equals(insertedTask.getId()));
            int position = requestedPosition == null ? orderedTasks.size()
                    : Math.max(0, Math.min(requestedPosition, orderedTasks.size()));
            orderedTasks.add(position, insertedTask);
        }
        for (int i = 0; i < orderedTasks.size(); i++) {
            orderedTasks.get(i).setPosition(i);
        }
        taskRepository.saveAll(orderedTasks);
    }

    private Map<String, BoardColumnOption> optionMap(Long boardId, String columnKey) {
        return boardColumnRepository.findByBoardIdAndKeyAndDeletedAtIsNull(boardId, columnKey)
                .map(column -> boardColumnOptionRepository.findByColumnIdAndDeletedAtIsNullOrderByPositionAscIdAsc(column.getId())
                        .stream().collect(Collectors.toMap(BoardColumnOption::getKey, Function.identity())))
                .orElse(Map.of());
    }

    private String uniqueColumnKey(Long boardId, String label) {
        String base = "col_" + label.toLowerCase().trim().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.equals("col_")) {
            base = "col_custom";
        }
        String key = base;
        int counter = 1;
        while (boardColumnRepository.findByBoardIdAndKeyAndDeletedAtIsNull(boardId, key).isPresent()) {
            key = base + "_" + counter++;
        }
        return key;
    }

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date; use yyyy-MM-dd", e);
        }
    }

    private Map<String, Object> taskSnapshot(Task task) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", task.getTitle());
        map.put("status", task.getStatus());
        map.put("priority", task.getPriority());
        map.put("dueDate", task.getDueDate() != null ? task.getDueDate().toString() : null);
        map.put("progress", task.getProgress());
        map.put("budget", task.getBudget());
        return map;
    }

    private void recordChangedTaskFields(Task task, User user, Map<String, Object> before, Map<String, Object> after) {
        after.forEach((field, newValue) -> {
            Object oldValue = before.get(field);
            if (!Objects.equals(oldValue, newValue)) {
                recordActivity(task.getBoard(), task, user, "task_updated", field, oldValue, newValue, "user");
            }
        });
    }

    private void recordActivity(Board board, Task task, User actor, String eventType, String fieldKey,
            Object oldValue, Object newValue, String visibility) {
        TaskActivity activity = new TaskActivity();
        activity.setBoard(board);
        activity.setTask(task);
        activity.setActor(actor);
        activity.setEventType(eventType);
        activity.setFieldKey(fieldKey);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);
        activity.setVisibility(visibility);
        taskActivityRepository.save(activity);
    }

    private BoardSummaryDto toBoardSummaryDto(Board board) {
        List<TaskGroupDto> groups = taskGroupRepository.findByBoardIdAndDeletedAtIsNullOrderByPositionAscIdAsc(board.getId())
                .stream()
                .map(g -> toGroupDto(g, taskRepository.findByGroupIdAndDeletedAtIsNullOrderByPositionAscIdAsc(g.getId())))
                .toList();
        return new BoardSummaryDto(String.valueOf(board.getId()), board.getName(), groups);
    }

    private TaskGroupDto toGroupDto(TaskGroup group, List<Task> tasks) {
        return new TaskGroupDto(
                String.valueOf(group.getId()),
                String.valueOf(group.getBoard().getId()),
                group.getName(),
                group.getColor(),
                group.getPosition(),
                tasks.stream().map(t -> String.valueOf(t.getId())).toList());
    }

    private ColumnDefinitionDto toColumnDto(BoardColumn column) {
        return new ColumnDefinitionDto(
                column.getKey(),
                column.getLabel(),
                column.getType(),
                column.getWidth(),
                Boolean.TRUE.equals(column.getVisible()),
                column.getPosition(),
                boardColumnOptionRepository.findByColumnIdAndDeletedAtIsNullOrderByPositionAscIdAsc(column.getId())
                        .stream().map(this::toOptionDto).toList(),
                Boolean.TRUE.equals(column.getSystemColumn()));
    }

    private SelectOptionDto toOptionDto(BoardColumnOption option) {
        return new SelectOptionDto(option.getKey(), option.getLabel(), option.getColor(), option.getWorkflowMeaning());
    }

    private List<SelectOptionDto> findColumnOptions(List<BoardColumn> columns, String key) {
        return columns.stream()
                .filter(c -> key.equals(c.getKey()))
                .findFirst()
                .map(c -> boardColumnOptionRepository.findByColumnIdAndDeletedAtIsNullOrderByPositionAscIdAsc(c.getId())
                        .stream().map(this::toOptionDto).toList())
                .orElse(List.of());
    }

    private TaskDto toTaskDto(Task task, List<TaskCustomValue> allValues, List<TaskUpdate> allUpdates, List<TaskFile> allFiles,
            List<TaskActivity> allActivities) {
        List<TaskCustomValue> values = allValues.stream().filter(v -> v.getTask().getId().equals(task.getId())).toList();
        List<TaskFile> files = allFiles.stream().filter(f -> f.getTask().getId().equals(task.getId())).toList();
        List<TaskUpdate> updates = allUpdates.stream().filter(u -> u.getTask().getId().equals(task.getId())).toList();
        List<TaskActivity> activities = allActivities.stream()
                .filter(a -> a.getTask() != null && a.getTask().getId().equals(task.getId()))
                .toList();
        Map<Long, List<TaskFile>> filesByUpdate = files.stream()
                .filter(f -> f.getUpdate() != null)
                .collect(Collectors.groupingBy(f -> f.getUpdate().getId()));
        Map<String, Object> customValues = values.stream()
                .collect(Collectors.toMap(v -> v.getColumn().getKey(), TaskCustomValue::getValue, (a, b) -> b, LinkedHashMap::new));
        List<String> assigneeIds = task.getAssignees().stream().map(u -> String.valueOf(u.getId())).toList();
        return new TaskDto(
                String.valueOf(task.getId()),
                task.getTitle(),
                task.getGroup() != null ? String.valueOf(task.getGroup().getId()) : "",
                String.valueOf(task.getBoard().getId()),
                assigneeIds.isEmpty() ? null : assigneeIds.get(0),
                assigneeIds,
                task.getStatus(),
                task.getPriority(),
                task.getDueDate() != null ? task.getDueDate().toString() : null,
                task.getProgress(),
                task.getBudget(),
                files.stream().map(this::toFileDto).toList(),
                updates.stream().map(u -> toUpdateDto(u, filesByUpdate.getOrDefault(u.getId(), List.of()))).toList(),
                activities.stream().map(this::toActivityDto).toList(),
                task.getCreatedAt().toString(),
                task.getUpdatedAt().toString(),
                customValues);
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

    private TaskUpdateDto toUpdateDto(TaskUpdate update, List<TaskFile> files) {
        return new TaskUpdateDto(
                String.valueOf(update.getId()),
                String.valueOf(update.getTask().getId()),
                String.valueOf(update.getAuthor().getId()),
                update.getContent(),
                update.getCreatedAt().toString(),
                update.getUpdatedAt() != null ? update.getUpdatedAt().toString() : null,
                files.stream().map(this::toFileDto).toList(),
                update.getMentions().stream().map(u -> String.valueOf(u.getId())).toList());
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

    private UserSummaryDto toUserDto(User user) {
        return new UserSummaryDto(
                String.valueOf(user.getId()),
                user.getName(),
                null,
                initials(user.getName()),
                user.getEmail());
    }

    private BoardViewDto toViewDto(BoardView view) {
        return new BoardViewDto(
                String.valueOf(view.getId()),
                view.getName(),
                view.getType(),
                view.getPosition(),
                Boolean.TRUE.equals(view.getDefaultView()),
                view.getConfig());
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
