package com.mahindra.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mahindra.backend.dto.ai.AiImportProcessRequest;
import com.mahindra.backend.dto.ai.AiWorkspaceApproveRequest;
import com.mahindra.backend.dto.ai.AiWorkspaceApproveResponse;
import com.mahindra.backend.dto.ai.AiWorkspaceDraftDto;
import com.mahindra.backend.dto.ai.DraftBoardDto;
import com.mahindra.backend.dto.ai.DraftGroupDto;
import com.mahindra.backend.dto.ai.DraftTaskDto;
import com.mahindra.backend.dto.ai.DraftWorkspaceDto;
import com.mahindra.backend.entity.Board;
import com.mahindra.backend.entity.BoardMember;
import com.mahindra.backend.entity.Task;
import com.mahindra.backend.entity.TaskGroup;
import com.mahindra.backend.entity.User;
import com.mahindra.backend.entity.UserStatus;
import com.mahindra.backend.entity.Workspace;
import com.mahindra.backend.entity.WorkspaceMember;
import com.mahindra.backend.repository.BoardMemberRepository;
import com.mahindra.backend.repository.BoardRepository;
import com.mahindra.backend.repository.TaskGroupRepository;
import com.mahindra.backend.repository.TaskRepository;
import com.mahindra.backend.repository.UserRepository;
import com.mahindra.backend.repository.WorkspaceRepository;

@Service
public class AiWorkspaceImportService {

    private static final int MAX_TEXT_CHARS = 60_000;
    private static final int MIN_BOARDS = 2;
    private static final int MAX_BOARDS = 4;
    private static final int MIN_GROUPS_PER_BOARD = 3;
    private static final int MAX_GROUPS_PER_BOARD = 5;
    private static final int MIN_TASKS_PER_GROUP = 3;
    private static final int MAX_TASKS_PER_GROUP = 12;
    private static final Set<String> ALLOWED_STATUS = Set.of("todo", "in_progress", "review", "done", "blocked");
    private static final Set<String> ALLOWED_PRIORITY = Set.of("low", "medium", "high", "critical");

    private final FileUploadService fileUploadService;
    private final WorkspaceRepository workspaceRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Map<String, AiWorkspaceDraftDto> drafts = new ConcurrentHashMap<>();

    private final String azureEndpoint;
    private final String azureApiKey;
    private final String azureDeployment;
    private final String azureApiVersion;

    public AiWorkspaceImportService(
            FileUploadService fileUploadService,
            WorkspaceRepository workspaceRepository,
            BoardRepository boardRepository,
            BoardMemberRepository boardMemberRepository,
            TaskGroupRepository taskGroupRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            @Value("${azure.openai.endpoint:}") String azureEndpoint,
            @Value("${azure.openai.api-key:}") String azureApiKey,
            @Value("${azure.openai.deployment:}") String azureDeployment,
            @Value("${azure.openai.api-version:2024-08-01-preview}") String azureApiVersion) {
        this.fileUploadService = fileUploadService;
        this.workspaceRepository = workspaceRepository;
        this.boardRepository = boardRepository;
        this.boardMemberRepository = boardMemberRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.azureEndpoint = trimTrailingSlash(azureEndpoint);
        this.azureApiKey = azureApiKey;
        this.azureDeployment = azureDeployment;
        this.azureApiVersion = azureApiVersion;
    }

    public AiWorkspaceDraftDto process(Authentication authentication, AiImportProcessRequest request) {
        resolveUser(authentication);
        byte[] pdf = fileUploadService.downloadAiImport(request.key());
        String text = extractText(pdf);
        if (text.length() < 80) {
            throw new IllegalArgumentException("Could not extract enough text from the PDF");
        }
        AiWorkspaceDraftDto generated = generateDraft(text, request.fileName());
        AiWorkspaceDraftDto normalized = normalizeDraft(generated, request.fileName());
        drafts.put(normalized.id(), normalized);
        return normalized;
    }

    public AiWorkspaceDraftDto getDraft(String draftId) {
        AiWorkspaceDraftDto draft = drafts.get(draftId);
        if (draft == null) {
            throw new IllegalArgumentException("AI draft not found");
        }
        return draft;
    }

    public void discard(String draftId) {
        drafts.remove(draftId);
    }

    @Transactional
    public AiWorkspaceApproveResponse approve(Authentication authentication, AiWorkspaceApproveRequest request) {
        User creator = resolveUser(authentication);
        AiWorkspaceDraftDto draft = normalizeDraft(request.draft(), request.draft().sourceFileName());

        LinkedHashSet<Long> memberIds = new LinkedHashSet<>(request.memberUserIds() != null ? request.memberUserIds() : List.of());
        memberIds.add(creator.getId());
        List<User> members = new ArrayList<>();
        for (Long id : memberIds) {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + id));
            if (user.getStatus() != UserStatus.active) {
                throw new IllegalArgumentException("User " + id + " is not active");
            }
            members.add(user);
        }

        Workspace workspace = new Workspace();
        workspace.setName(draft.workspace().title());
        workspace.setDescription(draft.workspace().description());
        workspace.setStatus(toPersistedStatus(request.status()));
        workspace.setCreatedBy(creator);
        workspace.setBudgetLabel(trimToNull(draft.workspace().budgetLabel()));
        workspace.setCardDueDate(parseFutureDateOrNull(draft.workspace().dueDate()));

        for (User user : members) {
            WorkspaceMember member = new WorkspaceMember();
            member.setUser(user);
            member.setRoleInWorkspace(user.getId().equals(creator.getId()) ? "owner" : "collaborator");
            workspace.addMember(member);
        }
        workspaceRepository.saveAndFlush(workspace);

        Board firstBoard = null;
        int boardIndex = 0;
        for (DraftBoardDto boardDraft : draft.boards()) {
            Board board = new Board();
            board.setWorkspace(workspace);
            board.setName(boardDraft.name());
            board.setDescription(boardDraft.description());
            board.setColor("#5F0229");
            board.setCreatedBy(creator);
            board.setPosition(boardIndex++);
            boardRepository.saveAndFlush(board);
            if (firstBoard == null) {
                firstBoard = board;
            }

            for (WorkspaceMember workspaceMember : workspace.getMembers()) {
                BoardMember boardMember = new BoardMember();
                boardMember.setBoard(board);
                boardMember.setUser(workspaceMember.getUser());
                boardMember.setAssignedBy(creator);
                boardMember.setRoleInBoard(workspaceMember.getUser().getId().equals(creator.getId()) ? "owner" : "editor");
                boardMemberRepository.save(boardMember);
            }

            int groupIndex = 0;
            for (DraftGroupDto groupDraft : boardDraft.groups()) {
                TaskGroup group = new TaskGroup();
                group.setBoard(board);
                group.setName(groupDraft.name());
                group.setColor("#A3334D");
                group.setPosition(groupIndex++);
                taskGroupRepository.saveAndFlush(group);

                int taskIndex = 0;
                for (DraftTaskDto taskDraft : groupDraft.tasks()) {
                    Task task = new Task();
                    task.setBoard(board);
                    task.setGroup(group);
                    task.setTitle(taskDraft.name());
                    task.setDescription(trimToNull(taskDraft.description()));
                    task.setCreatedBy(creator);
                    task.setStatus(taskDraft.status());
                    task.setPriority(taskDraft.priority());
                    task.setDueDate(parseDateOrNull(taskDraft.dueDate()));
                    task.setCompletedAt("done".equals(taskDraft.status()) ? Instant.now() : null);
                    task.setPosition(taskIndex++);
                    taskRepository.save(task);
                }
            }
        }

        if (draft.id() != null) {
            drafts.remove(draft.id());
        }
        return new AiWorkspaceApproveResponse(
                String.valueOf(workspace.getId()),
                firstBoard != null ? String.valueOf(firstBoard.getId()) : null);
    }

    private String extractText(byte[] pdf) {
        try (PDDocument document = Loader.loadPDF(pdf)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document).replaceAll("[ \\t\\x0B\\f\\r]+", " ").trim();
            return text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text;
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read PDF text", e);
        }
    }

    private AiWorkspaceDraftDto generateDraft(String text, String fileName) {
        validateAzureConfig();
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("messages", List.of(
                    Map.of("role", "system", "content", """
                            You convert project requirements into rich draft workspace taskboards.
                            Create 2 to 3 taskboards, each representing a major workstream such as Product, Engineering, Design, QA, Launch, Operations, or Documentation.
                            Every taskboard must contain 3 to 5 task groups. Use lifecycle-oriented groups such as Discovery, Planning, Implementation, Validation, Release, or Adoption.
                            Every task group must contain at least 3 concrete tasks.
                            Tasks must be actionable work items written as imperative or outcome-focused phrases.
                            Prefer specific tasks grounded in the PDF over generic placeholders.
                            Avoid duplicate boards, duplicate groups, and duplicate tasks.
                            Return concise but useful descriptions when the source gives enough context.
                            Use empty strings or nulls when the source does not provide a value.
                            Do not invent private personal data or assignees.
                            """),
                    Map.of("role", "user", "content", """
                            Create a workspace draft from this PDF text.
                            Target structure:
                            - 2 or 3 taskboards total.
                            - 3 to 5 task groups per taskboard.
                            - At least 3 tasks per group.
                            - Use the board/group/task names to make the generated plan easy to scan.

                            PDF text:

                            """ + text)));
            body.put("temperature", 0.2);
            body.put("max_tokens", 5000);
            if (usesFoundryV1Api()) {
                body.put("model", azureDeployment);
            }
            body.put("response_format", Map.of(
                    "type", "json_schema",
                    "json_schema", Map.of(
                            "name", "workspace_taskboards",
                            "strict", true,
                            "schema", responseSchema())));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(chatCompletionsUrl()))
                    .header("Content-Type", "application/json")
                    .header("api-key", azureApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Azure OpenAI request failed: " + response.body());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText();
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Azure OpenAI returned an empty draft");
            }
            AiWorkspaceDraftDto partial = objectMapper.readValue(content, AiWorkspaceDraftDto.class);
            return new AiWorkspaceDraftDto(null, partial.workspace(), partial.boards(), fileName);
        } catch (IOException e) {
            throw new IllegalStateException("Could not parse Azure OpenAI draft", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Azure OpenAI request interrupted", e);
        }
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> nullableString = Map.of("anyOf", List.of(Map.of("type", "string"), Map.of("type", "null")));
        Map<String, Object> task = object(Map.of(
                "name", Map.of("type", "string"),
                "description", nullableString,
                "priority", Map.of("type", "string", "enum", List.of("low", "medium", "high", "critical")),
                "status", Map.of("type", "string", "enum", List.of("todo", "in_progress", "review", "done", "blocked")),
                "dueDate", nullableString), List.of("name", "description", "priority", "status", "dueDate"));
        Map<String, Object> group = object(Map.of(
                "name", Map.of("type", "string"),
                "tasks", Map.of(
                        "type", "array",
                        "minItems", MIN_TASKS_PER_GROUP,
                        "maxItems", MAX_TASKS_PER_GROUP,
                        "items", task)), List.of("name", "tasks"));
        Map<String, Object> board = object(Map.of(
                "name", Map.of("type", "string"),
                "description", nullableString,
                "groups", Map.of(
                        "type", "array",
                        "minItems", MIN_GROUPS_PER_BOARD,
                        "maxItems", MAX_GROUPS_PER_BOARD,
                        "items", group)), List.of("name", "description", "groups"));
        Map<String, Object> workspace = object(Map.of(
                "title", Map.of("type", "string"),
                "description", nullableString,
                "dueDate", nullableString,
                "budgetLabel", nullableString), List.of("title", "description", "dueDate", "budgetLabel"));
        return object(Map.of(
                "id", nullableString,
                "sourceFileName", nullableString,
                "workspace", workspace,
                "boards", Map.of(
                        "type", "array",
                        "minItems", MIN_BOARDS,
                        "maxItems", MAX_BOARDS,
                        "items", board)), List.of("id", "sourceFileName", "workspace", "boards"));
    }

    private Map<String, Object> object(Map<String, Object> properties, List<String> required) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("properties", properties);
        schema.put("required", required);
        return schema;
    }

    private AiWorkspaceDraftDto normalizeDraft(AiWorkspaceDraftDto draft, String sourceFileName) {
        if (draft == null || draft.workspace() == null) {
            throw new IllegalArgumentException("AI draft is missing workspace data");
        }
        DraftWorkspaceDto workspace = new DraftWorkspaceDto(
                limit(required(draft.workspace().title(), "Workspace title"), 120),
                limit(defaultString(draft.workspace().description()), 2000),
                normalizeDate(draft.workspace().dueDate()),
                limit(defaultString(draft.workspace().budgetLabel()), 80));

        List<DraftBoardDto> boards = new ArrayList<>();
        List<DraftBoardDto> rawBoards = draft.boards() != null ? draft.boards() : List.of();
        for (DraftBoardDto rawBoard : rawBoards.stream().limit(MAX_BOARDS).toList()) {
            String boardName = limit(defaultString(rawBoard.name()), 120);
            if (boardName.isBlank()) {
                continue;
            }
            List<DraftGroupDto> groups = new ArrayList<>();
            List<DraftGroupDto> rawGroups = rawBoard.groups() != null ? rawBoard.groups() : List.of();
            for (DraftGroupDto rawGroup : rawGroups.stream().limit(MAX_GROUPS_PER_BOARD).toList()) {
                String groupName = limit(defaultString(rawGroup.name()), 120);
                if (groupName.isBlank()) {
                    continue;
                }
                List<DraftTaskDto> tasks = new ArrayList<>();
                List<DraftTaskDto> rawTasks = rawGroup.tasks() != null ? rawGroup.tasks() : List.of();
                for (DraftTaskDto rawTask : rawTasks.stream().limit(MAX_TASKS_PER_GROUP).toList()) {
                    String taskName = limit(defaultString(rawTask.name()), 180);
                    if (taskName.isBlank()) {
                        continue;
                    }
                    String status = ALLOWED_STATUS.contains(defaultString(rawTask.status())) ? rawTask.status() : "todo";
                    String priority = ALLOWED_PRIORITY.contains(defaultString(rawTask.priority())) ? rawTask.priority() : "medium";
                    tasks.add(new DraftTaskDto(
                            taskName,
                            limit(defaultString(rawTask.description()), 1200),
                            priority,
                            status,
                            normalizeDate(rawTask.dueDate())));
                }
                if (tasks.size() < MIN_TASKS_PER_GROUP) {
                    continue;
                }
                groups.add(new DraftGroupDto(groupName, tasks));
            }
            if (groups.size() < MIN_GROUPS_PER_BOARD) {
                continue;
            }
            boards.add(new DraftBoardDto(boardName, limit(defaultString(rawBoard.description()), 1200), groups));
        }
        if (boards.size() < MIN_BOARDS) {
            throw new IllegalArgumentException(
                    "AI draft was too sparse; expected at least 2 boards, 3 groups per board, and 3 tasks per group");
        }
        return new AiWorkspaceDraftDto(
                draft.id() != null && !draft.id().isBlank() ? draft.id() : UUID.randomUUID().toString(),
                workspace,
                boards,
                sourceFileName);
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private void validateAzureConfig() {
        if (azureEndpoint == null || azureEndpoint.isBlank()) {
            throw new IllegalStateException("AZURE_OPENAI_ENDPOINT is not configured");
        }
        if (azureApiKey == null || azureApiKey.isBlank()) {
            throw new IllegalStateException("AZURE_OPENAI_API_KEY is not configured");
        }
        if (azureDeployment == null || azureDeployment.isBlank()) {
            throw new IllegalStateException("AZURE_OPENAI_DEPLOYMENT is not configured");
        }
    }

    private String chatCompletionsUrl() {
        if (usesFoundryV1Api()) {
            String base = azureEndpoint.endsWith("/openai/v1")
                    ? azureEndpoint
                    : azureEndpoint + "/openai/v1";
            return base + "/chat/completions";
        }
        return "%s/openai/deployments/%s/chat/completions?api-version=%s".formatted(
                azureEndpoint,
                URLEncoder.encode(azureDeployment, StandardCharsets.UTF_8),
                URLEncoder.encode(azureApiVersion, StandardCharsets.UTF_8));
    }

    private boolean usesFoundryV1Api() {
        return azureEndpoint.endsWith("/openai/v1") || azureEndpoint.contains(".services.ai.azure.com");
    }

    private LocalDate parseDateOrNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private LocalDate parseFutureDateOrNull(String raw) {
        LocalDate parsed = parseDateOrNull(raw);
        return parsed != null && parsed.isAfter(LocalDate.now()) ? parsed : null;
    }

    private String normalizeDate(String raw) {
        LocalDate parsed = parseDateOrNull(raw);
        return parsed != null ? parsed.toString() : null;
    }

    private String toPersistedStatus(String ui) {
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

    private String required(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        return value.trim();
    }

    private String defaultString(String value) {
        return value == null ? "" : value.trim();
    }

    private String limit(String value, int maxLength) {
        String normalized = value == null ? "" : value.trim();
        return normalized.length() > maxLength ? normalized.substring(0, maxLength) : normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("/+$", "");
    }
}
