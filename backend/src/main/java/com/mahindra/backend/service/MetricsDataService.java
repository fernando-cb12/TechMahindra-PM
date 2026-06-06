package com.mahindra.backend.service;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.WorkspaceCardDto;
import com.mahindra.backend.dto.metrics.MetricCatalogDto;
import com.mahindra.backend.dto.metrics.MetricCustomFieldDto;
import com.mahindra.backend.dto.metrics.MetricDefinitionDto;
import com.mahindra.backend.dto.metrics.MetricDimensionDto;
import com.mahindra.backend.dto.metrics.MetricFieldMappingRequest;
import com.mahindra.backend.dto.metrics.MetricQueryRequest;
import com.mahindra.backend.dto.metrics.MetricQueryResponse;
import com.mahindra.backend.dto.metrics.MetricSemanticFieldDto;
import com.mahindra.backend.dto.metrics.MetricUserDto;
import com.mahindra.backend.entity.BoardColumn;
import com.mahindra.backend.repository.BoardColumnRepository;

@Service
public class MetricsDataService {

    private static final Set<String> MEASURABLE_CUSTOM_TYPES = Set.of("number", "currency", "percentage", "time", "progress", "budget");
    private static final Set<String> DIMENSION_CUSTOM_TYPES = Set.of("singleSelect", "multiSelect", "person", "checkbox");
    private static final Set<String> FILTER_CUSTOM_TYPES = Set.of("singleSelect", "multiSelect", "person", "checkbox", "date", "timeline", "number", "currency", "percentage", "time");
    private static final Set<String> TEMPORAL_COUNT_METRICS = Set.of("completed_tasks", "overdue_tasks", "due_soon_tasks", "stale_tasks");
    private static final Set<String> SEMANTIC_KEYS = Set.of("budget", "progress", "due_date", "priority", "effort");
    private static final Map<String, Set<String>> SEMANTIC_COMPATIBLE_TYPES = Map.of(
            "budget", Set.of("number", "currency", "budget"),
            "progress", Set.of("number", "percentage", "progress"),
            "due_date", Set.of("date", "timeline"),
            "priority", Set.of("priority", "singleSelect"),
            "effort", Set.of("number", "time"));
    private static final String SEMANTIC_FIELD_SELECTS = """
                         case
                             when progress_mapping.source_type = 'custom_field' and nullif(progress_value.value #>> '{}', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' then nullif(progress_value.value #>> '{}', '')::numeric
                             when progress_mapping.source_type = 'core_field' and progress_mapping.source_key = 'progress' then t.progress::numeric
                             else t.progress::numeric
                         end as metric_progress,
                         case
                             when budget_mapping.source_type = 'custom_field' and nullif(budget_value.value #>> '{}', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' then nullif(budget_value.value #>> '{}', '')::numeric
                             when budget_mapping.source_type = 'core_field' and budget_mapping.source_key = 'budget' then t.budget
                             else t.budget
                         end as metric_budget,
                         case
                             when due_date_mapping.source_type = 'custom_field' and nullif(due_date_value.value #>> '{}', '') ~ '^\\d{4}-\\d{2}-\\d{2}' then (nullif(due_date_value.value #>> '{}', ''))::date
                             when due_date_mapping.source_type = 'core_field' and due_date_mapping.source_key = 'due_date' then t.due_date::date
                             else t.due_date::date
                         end as due_date,
                         case
                             when priority_mapping.source_type = 'custom_field' and nullif(priority_value.value #>> '{}', '') is not null then nullif(priority_value.value #>> '{}', '')
                             when priority_mapping.source_type = 'core_field' and priority_mapping.source_key = 'priority' then t.priority
                             else t.priority
                         end as priority,
                         case
                             when effort_mapping.source_type = 'custom_field' and nullif(effort_value.value #>> '{}', '') ~ '^-?[0-9]+(\\.[0-9]+)?$' then nullif(effort_value.value #>> '{}', '')::numeric
                             else null
                         end as metric_effort,
            """;
    private static final String SEMANTIC_FIELD_JOINS = """
                  left join board_metric_field_mappings progress_mapping on progress_mapping.board_id = t.board_id
                    and progress_mapping.semantic_key = 'progress'
                  left join board_columns progress_column on progress_column.board_id = t.board_id
                    and progress_column.key = progress_mapping.source_key
                    and progress_column.deleted_at is null
                    and progress_mapping.source_type = 'custom_field'
                  left join task_custom_values progress_value on progress_value.task_id = t.id
                    and progress_value.column_id = progress_column.id
                  left join board_metric_field_mappings budget_mapping on budget_mapping.board_id = t.board_id
                    and budget_mapping.semantic_key = 'budget'
                  left join board_columns budget_column on budget_column.board_id = t.board_id
                    and budget_column.key = budget_mapping.source_key
                    and budget_column.deleted_at is null
                    and budget_mapping.source_type = 'custom_field'
                  left join task_custom_values budget_value on budget_value.task_id = t.id
                    and budget_value.column_id = budget_column.id
                  left join board_metric_field_mappings due_date_mapping on due_date_mapping.board_id = t.board_id
                    and due_date_mapping.semantic_key = 'due_date'
                  left join board_columns due_date_column on due_date_column.board_id = t.board_id
                    and due_date_column.key = due_date_mapping.source_key
                    and due_date_column.deleted_at is null
                    and due_date_mapping.source_type = 'custom_field'
                  left join task_custom_values due_date_value on due_date_value.task_id = t.id
                    and due_date_value.column_id = due_date_column.id
                  left join board_metric_field_mappings priority_mapping on priority_mapping.board_id = t.board_id
                    and priority_mapping.semantic_key = 'priority'
                  left join board_columns priority_column on priority_column.board_id = t.board_id
                    and priority_column.key = priority_mapping.source_key
                    and priority_column.deleted_at is null
                    and priority_mapping.source_type = 'custom_field'
                  left join task_custom_values priority_value on priority_value.task_id = t.id
                    and priority_value.column_id = priority_column.id
                  left join board_metric_field_mappings effort_mapping on effort_mapping.board_id = t.board_id
                    and effort_mapping.semantic_key = 'effort'
                  left join board_columns effort_column on effort_column.board_id = t.board_id
                    and effort_column.key = effort_mapping.source_key
                    and effort_column.deleted_at is null
                    and effort_mapping.source_type = 'custom_field'
                  left join task_custom_values effort_value on effort_value.task_id = t.id
                    and effort_value.column_id = effort_column.id
            """;

    private final JdbcTemplate jdbcTemplate;
    private final WorkspaceService workspaceService;
    private final BoardColumnRepository boardColumnRepository;

    public MetricsDataService(JdbcTemplate jdbcTemplate,
            WorkspaceService workspaceService,
            BoardColumnRepository boardColumnRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.workspaceService = workspaceService;
        this.boardColumnRepository = boardColumnRepository;
    }

    @Transactional(readOnly = true)
    public MetricCatalogDto catalog(Authentication authentication) {
        return catalog(authentication, List.of(), List.of());
    }

    @Transactional(readOnly = true)
    public MetricCatalogDto catalog(Authentication authentication, List<String> requestedWorkspaceIds, List<String> requestedBoardIds) {
        List<Long> workspaceIds = resolveWorkspaceScope(authentication, requestedWorkspaceIds);
        List<Long> boardIds = parseIds(requestedBoardIds);
        List<MetricCustomFieldDto> customFields = new ArrayList<>();
        if (!workspaceIds.isEmpty()) {
            List<BoardColumn> columns = boardColumnRepository.findAll().stream()
                    .filter(column -> column.getDeletedAt() == null)
                    .filter(column -> !Boolean.TRUE.equals(column.getSystemColumn()))
                    .filter(column -> workspaceIds.contains(column.getBoard().getWorkspace().getId()))
                    .filter(column -> boardIds.isEmpty() || boardIds.contains(column.getBoard().getId()))
                    .toList();
            for (BoardColumn column : columns) {
                String type = column.getType();
                customFields.add(new MetricCustomFieldDto(
                        String.valueOf(column.getBoard().getWorkspace().getId()),
                        column.getBoard().getWorkspace().getName(),
                        String.valueOf(column.getBoard().getId()),
                        column.getBoard().getName(),
                        column.getKey(),
                        column.getLabel(),
                        type,
                        MEASURABLE_CUSTOM_TYPES.contains(type),
                        DIMENSION_CUSTOM_TYPES.contains(type),
                        FILTER_CUSTOM_TYPES.contains(type)));
            }
        }

        List<MetricSemanticFieldDto> semanticFields = semanticFields(workspaceIds, boardIds);
        List<String> warnings = new ArrayList<>(workflowWarnings(workspaceIds, boardIds));
        warnings.addAll(semanticFieldWarnings(workspaceIds, boardIds));
        return new MetricCatalogDto(metricDefinitions(), dimensionDefinitions(), customFields, assignees(workspaceIds), warnings, semanticFields);
    }

    @Transactional
    public MetricSemanticFieldDto updateFieldMapping(Authentication authentication, Long boardId, String semanticKey,
            MetricFieldMappingRequest request) {
        validateSemanticKey(semanticKey);
        if (request == null || request.sourceType() == null || request.sourceKey() == null
                || request.sourceType().isBlank() || request.sourceKey().isBlank()) {
            throw new IllegalArgumentException("Field mapping source is required");
        }
        assertCanEditBoardMapping(authentication, boardId);
        String sourceType = request.sourceType();
        String sourceKey = request.sourceKey();
        if ("core_field".equals(sourceType)) {
            if (!semanticKey.equals(sourceKey)) {
                throw new IllegalArgumentException("Core field mapping must match the semantic field");
            }
        } else if ("custom_field".equals(sourceType)) {
            validateCompatibleCustomField(boardId, semanticKey, sourceKey);
        } else {
            throw new IllegalArgumentException("Unsupported mapping source type");
        }

        jdbcTemplate.update("""
                insert into board_metric_field_mappings (board_id, semantic_key, source_type, source_key)
                values (?, ?, ?, ?)
                on conflict (board_id, semantic_key)
                do update set source_type = excluded.source_type,
                              source_key = excluded.source_key,
                              updated_at = now()
                """, boardId, semanticKey, sourceType, sourceKey);
        return semanticFieldStatus(boardId, semanticKey);
    }

    @Transactional
    public void deleteFieldMapping(Authentication authentication, Long boardId, String semanticKey) {
        validateSemanticKey(semanticKey);
        assertCanEditBoardMapping(authentication, boardId);
        jdbcTemplate.update("""
                delete from board_metric_field_mappings
                where board_id = ?
                  and semantic_key = ?
                """, boardId, semanticKey);
    }

    private List<MetricSemanticFieldDto> semanticFields(List<Long> workspaceIds, List<Long> boardIds) {
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        List<Object> params = new ArrayList<>(workspaceIds);
        String boardClause = "";
        if (!boardIds.isEmpty()) {
            boardClause = " and " + inClause("b.id", boardIds, params);
        }
        String sql = """
                select b.id as board_id,
                       b.name as board_name,
                       w.id as workspace_id,
                       w.name as workspace_name
                from boards b
                join workspaces w on w.id = b.workspace_id
                where b.deleted_at is null
                  and b.archived_at is null
                  and w.deleted_at is null
                  and %s
                  %s
                order by w.name asc, b.name asc
                """.formatted(inClause("b.workspace_id", workspaceIds, new ArrayList<>()), boardClause);
        List<BoardScopeRow> boards = jdbcTemplate.query(sql, (rs, rowNum) -> new BoardScopeRow(
                rs.getLong("board_id"),
                rs.getString("board_name"),
                rs.getLong("workspace_id"),
                rs.getString("workspace_name")), params.toArray());
        List<MetricSemanticFieldDto> fields = new ArrayList<>();
        for (BoardScopeRow board : boards) {
            fields.add(semanticFieldStatus(board.boardId(), "budget"));
            fields.add(semanticFieldStatus(board.boardId(), "progress"));
            fields.add(semanticFieldStatus(board.boardId(), "due_date"));
            fields.add(semanticFieldStatus(board.boardId(), "priority"));
            fields.add(semanticFieldStatus(board.boardId(), "effort"));
        }
        return fields;
    }

    private MetricSemanticFieldDto semanticFieldStatus(Long boardId, String semanticKey) {
        validateSemanticKey(semanticKey);
        Map<String, Object> board = jdbcTemplate.queryForMap("""
                select b.id as board_id,
                       b.name as board_name,
                       w.id as workspace_id,
                       w.name as workspace_name
                from boards b
                join workspaces w on w.id = b.workspace_id
                where b.id = ?
                  and b.deleted_at is null
                  and b.archived_at is null
                  and w.deleted_at is null
                """, boardId);
        Map<String, Object> mapping = jdbcTemplate.queryForList("""
                select m.source_type,
                       m.source_key,
                       coalesce(c.label, initcap(replace(m.source_key, '_', ' '))) as source_label
                from board_metric_field_mappings m
                left join board_columns c on c.board_id = m.board_id
                  and c.key = m.source_key
                  and c.deleted_at is null
                  and m.source_type = 'custom_field'
                where m.board_id = ?
                  and m.semantic_key = ?
                """, boardId, semanticKey).stream().findFirst().orElse(Map.of(
                "source_type", "core_field",
                "source_key", semanticKey,
                "source_label", semanticLabel(semanticKey)));
        return new MetricSemanticFieldDto(
                semanticKey,
                semanticLabel(semanticKey),
                String.valueOf(board.get("board_id")),
                String.valueOf(board.get("board_name")),
                String.valueOf(board.get("workspace_id")),
                String.valueOf(board.get("workspace_name")),
                semanticValueCount(boardId, semanticKey, String.valueOf(mapping.get("source_type")), String.valueOf(mapping.get("source_key"))) == 0
                        && taskCount(boardId) > 0,
                String.valueOf(mapping.get("source_type")),
                String.valueOf(mapping.get("source_key")),
                String.valueOf(mapping.get("source_label")));
    }

    private long taskCount(Long boardId) {
        Long count = jdbcTemplate.queryForObject("""
                select count(*)
                from task t
                where t.board_id = ?
                  and t.deleted_at is null
                """, Long.class, boardId);
        return count == null ? 0L : count;
    }

    private long semanticValueCount(Long boardId, String semanticKey, String sourceType, String sourceKey) {
        Long count;
        if ("custom_field".equals(sourceType)) {
            String valueCondition = switch (semanticKey) {
                case "due_date" -> "nullif(v.value #>> '{}', '') ~ '^\\d{4}-\\d{2}-\\d{2}'";
                case "priority" -> "nullif(v.value #>> '{}', '') is not null";
                default -> "nullif(v.value #>> '{}', '') ~ '^-?[0-9]+(\\.[0-9]+)?$'";
            };
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    join board_columns c on c.board_id = t.board_id
                      and c.key = ?
                      and c.deleted_at is null
                    join task_custom_values v on v.task_id = t.id
                      and v.column_id = c.id
                    where t.board_id = ?
                      and t.deleted_at is null
                      and %s
                    """.formatted(valueCondition), Long.class, sourceKey, boardId);
        } else if ("progress".equals(semanticKey)) {
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    where t.board_id = ?
                      and t.deleted_at is null
                      and t.progress is not null
                    """, Long.class, boardId);
        } else if ("budget".equals(semanticKey)) {
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    where t.board_id = ?
                      and t.deleted_at is null
                      and t.budget is not null
                    """, Long.class, boardId);
        } else if ("due_date".equals(semanticKey)) {
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    where t.board_id = ?
                      and t.deleted_at is null
                      and t.due_date is not null
                    """, Long.class, boardId);
        } else if ("priority".equals(semanticKey)) {
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    where t.board_id = ?
                      and t.deleted_at is null
                      and t.priority is not null
                    """, Long.class, boardId);
        } else {
            count = jdbcTemplate.queryForObject("""
                    select count(*)
                    from task t
                    where t.board_id = ?
                      and t.deleted_at is null
                      and t.points_value is not null
                    """, Long.class, boardId);
        }
        return count == null ? 0L : count;
    }

    private void validateSemanticKey(String semanticKey) {
        if (!SEMANTIC_KEYS.contains(semanticKey)) {
            throw new IllegalArgumentException("Unsupported semantic field");
        }
    }

    private void validateCompatibleCustomField(Long boardId, String semanticKey, String sourceKey) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                select type
                from board_columns
                where board_id = ?
                  and key = ?
                  and deleted_at is null
                """, boardId, sourceKey);
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Column not found");
        }
        String type = String.valueOf(rows.get(0).get("type"));
        if (!SEMANTIC_COMPATIBLE_TYPES.getOrDefault(semanticKey, Set.of()).contains(type)) {
            throw new IllegalArgumentException("Column type is not compatible with " + semanticLabel(semanticKey));
        }
    }

    private void assertCanEditBoardMapping(Authentication authentication, Long boardId) {
        Long userId = jdbcTemplate.queryForObject("select id from users where email = ?", Long.class, authentication.getName());
        Long count = jdbcTemplate.queryForObject("""
                select count(*)
                from boards b
                join workspaces w on w.id = b.workspace_id
                where b.id = ?
                  and b.deleted_at is null
                  and b.archived_at is null
                  and w.deleted_at is null
                  and (
                    exists (
                      select 1
                      from user_role ur
                      join role r on r.id = ur.role_id
                      where ur.user_id = ?
                        and r.name = 'ADMIN'
                    )
                    or exists (
                      select 1
                      from board_member bm
                      where bm.board_id = b.id
                        and bm.user_id = ?
                        and bm.deleted_at is null
                        and bm.role_in_board in ('owner', 'editor')
                    )
                  )
                """, Long.class, boardId, userId, userId);
        if (count == null || count == 0) {
            throw new IllegalArgumentException("User cannot manage this board");
        }
    }

    private String semanticLabel(String semanticKey) {
        return switch (semanticKey) {
            case "budget" -> "Budget";
            case "progress" -> "Progress";
            case "due_date" -> "Due Date";
            case "priority" -> "Priority";
            case "effort" -> "Effort";
            default -> semanticKey;
        };
    }

    @Transactional(readOnly = true)
    public MetricQueryResponse query(Authentication authentication, MetricQueryRequest request) {
        if (request == null || request.metric() == null || request.metric().isBlank()) {
            throw new IllegalArgumentException("Metric is required");
        }
        List<Long> workspaceIds = resolveWorkspaceScope(authentication, request.workspaceIds());
        List<Long> boardIds = parseIds(request.boardIds());
        String dimension = request.dimension() == null || request.dimension().isBlank() ? "none" : request.dimension();
        String metric = request.metric();

        if ("custom_field".equals(metric)) {
            return customFieldMetric(metric, dimension, workspaceIds, boardIds, request);
        }

        return switch (metric) {
            case "created_vs_completed" -> createdVsCompleted(metric, dimension, workspaceIds, boardIds, request);
            case "completion_rate" -> scalar(metric, dimension, workspaceIds, boardIds, request, "completion_rate");
            case "average_progress" -> scalar(metric, dimension, workspaceIds, boardIds, request, "average_progress");
            case "total_budget" -> scalar(metric, dimension, workspaceIds, boardIds, request, "total_budget");
            case "total_effort" -> scalar(metric, dimension, workspaceIds, boardIds, request, "total_effort");
            case "average_effort" -> scalar(metric, dimension, workspaceIds, boardIds, request, "average_effort");
            case "average_lead_time" -> scalar(metric, dimension, workspaceIds, boardIds, request, "average_lead_time");
            case "median_lead_time" -> scalar(metric, dimension, workspaceIds, boardIds, request, "median_lead_time");
            case "average_cycle_time" -> scalar(metric, dimension, workspaceIds, boardIds, request, "average_cycle_time");
            case "median_cycle_time" -> scalar(metric, dimension, workspaceIds, boardIds, request, "median_cycle_time");
            case "p90_cycle_time" -> scalar(metric, dimension, workspaceIds, boardIds, request, "p90_cycle_time");
            default -> countMetric(metric, dimension, workspaceIds, boardIds, request);
        };
    }

    private MetricQueryResponse countMetric(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request) {
        String metricCondition = switch (metric) {
            case "task_count" -> "true";
            case "open_tasks" -> "workflow <> 'done'";
            case "completed_tasks" -> "workflow = 'done'";
            case "overdue_tasks" -> "workflow <> 'done' and due_date < current_date";
            case "due_soon_tasks" -> "workflow <> 'done' and due_date >= current_date and due_date <= current_date + interval '7 days'";
            case "stale_tasks" -> "workflow <> 'done' and updated_at < now() - interval '7 days'";
            case "unassigned_tasks" -> "workflow <> 'done' and assignee_count = 0";
            default -> throw new IllegalArgumentException("Unsupported metric: " + metric);
        };
        return aggregate(metric, dimension, workspaceIds, boardIds, request, "count(*)", metricCondition);
    }

    private MetricQueryResponse customFieldMetric(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request) {
        String key = request.customFieldKey();
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Custom field key is required");
        }
        String aggregation = request.aggregation() == null || request.aggregation().isBlank() ? "count" : request.aggregation();
        if (!"count".equals(aggregation) && !customFieldCanMeasure(key, workspaceIds)) {
            throw new IllegalArgumentException("Selected custom field cannot be used as a numeric measure");
        }
        String expression = switch (aggregation) {
            case "count" -> "count(*)";
            case "sum" -> "coalesce(sum(nullif(custom_value #>> '{}', '')::numeric), 0)";
            case "avg" -> "coalesce(round(avg(nullif(custom_value #>> '{}', '')::numeric), 1), 0)";
            default -> throw new IllegalArgumentException("Unsupported custom aggregation: " + aggregation);
        };
        String effectiveDimension = "none".equals(dimension) ? "custom_field" : dimension;
        return aggregate(metric, effectiveDimension, workspaceIds, boardIds, request, expression, "custom_value is not null");
    }

    private boolean customFieldCanMeasure(String key, List<Long> workspaceIds) {
        if (workspaceIds.isEmpty()) {
            return false;
        }
        CustomFieldColumnSelector selector = customFieldColumnSelector(key);
        List<Object> params = new ArrayList<>(selector.params());
        params.addAll(workspaceIds);
        String sql = """
                select count(*) from board_columns c
                join boards b on b.id = c.board_id
                where %s
                  and c.deleted_at is null
                  and %s
                  and c.type in ('number', 'currency', 'percentage', 'time', 'progress', 'budget')
                """.formatted(selector.aliasedWhere(),
                inClause("b.workspace_id", workspaceIds, new ArrayList<>()));
        Long count = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return count != null && count > 0;
    }

    private MetricQueryResponse scalar(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request, String scalarType) {
        String expression = switch (scalarType) {
            case "completion_rate" -> "coalesce(round(100.0 * sum(case when workflow = 'done' then 1 else 0 end) / nullif(count(*), 0), 1), 0)";
            case "average_progress" -> "coalesce(round(avg(metric_progress), 1), 0)";
            case "total_budget" -> "coalesce(sum(metric_budget), 0)";
            case "total_effort" -> "coalesce(sum(metric_effort), 0)";
            case "average_effort" -> "coalesce(round(avg(metric_effort), 1), 0)";
            case "average_lead_time" -> "coalesce(round(avg(extract(epoch from (completed_at - created_at)) / 86400.0) filter (where completed_at is not null), 1), 0)";
            case "median_lead_time" -> "coalesce(round((percentile_cont(0.5) within group (order by extract(epoch from (completed_at - created_at)) / 86400.0) filter (where completed_at is not null))::numeric, 1), 0)";
            case "average_cycle_time" -> "coalesce(round(avg(extract(epoch from (completed_at - first_started_at)) / 86400.0) filter (where completed_at is not null and first_started_at is not null), 1), 0)";
            case "median_cycle_time" -> "coalesce(round((percentile_cont(0.5) within group (order by extract(epoch from (completed_at - first_started_at)) / 86400.0) filter (where completed_at is not null and first_started_at is not null))::numeric, 1), 0)";
            case "p90_cycle_time" -> "coalesce(round((percentile_cont(0.9) within group (order by extract(epoch from (completed_at - first_started_at)) / 86400.0) filter (where completed_at is not null and first_started_at is not null))::numeric, 1), 0)";
            default -> throw new IllegalArgumentException("Unsupported scalar metric: " + metric);
        };
        return aggregate(metric, dimension, workspaceIds, boardIds, request, expression, "true");
    }

    private MetricQueryResponse aggregate(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request, String expression, String metricCondition) {
        DimensionSql dimensionSql = dimensionSql(dimension);
        QueryParts scope = scopeWhere(workspaceIds, boardIds, request);
        CustomFieldColumnSelector customFieldSelector = customFieldColumnSelector(request.customFieldKey());
        String sql = """
                with task_scope as (
                  select t.id as task_id,
                         t.title,
                         t.board_id,
                         b.name as board_name,
                         w.id as workspace_id,
                         w.name as workspace_name,
                         t.status,
                         t.progress,
                         t.budget,
                         %s
                         t.created_at,
                         t.updated_at,
                         t.first_started_at,
                         t.completed_at,
                         (select count(*) from task_assignees ta where ta.task_id = t.id) as assignee_count,
                         cv.value as custom_value,
                         coalesce(nullif(so.workflow_meaning, 'none'),
                                  case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end) as workflow
                  from task t
                  join boards b on b.id = t.board_id
                  join workspaces w on w.id = b.workspace_id
                  left join board_column_options so on so.id = t.status_option_id
                  %s
                  left join task_custom_values cv on cv.task_id = t.id
                    and cv.column_id in (select id from board_columns where %s and deleted_at is null)
                  where t.deleted_at is null
                    and b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                )
                select %s as label, %s as value
                from task_scope
                where %s
                %s
                order by value desc, label asc
                """.formatted(SEMANTIC_FIELD_SELECTS, SEMANTIC_FIELD_JOINS, customFieldSelector.where(), scope.where(), dimensionSql.select(), expression, metricCondition, dimensionSql.groupBy());
        List<Object> params = new ArrayList<>(customFieldSelector.params());
        params.addAll(scope.params());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        List<Map<String, Object>> drilldownRows = drilldownRows(scope, request, metricCondition, dimension);
        Map<String, Object> data = new LinkedHashMap<>();
        if ("none".equals(dimension)) {
            Object value = rows.isEmpty() ? 0 : rows.get(0).get("value");
            data.put("kpi", Map.of("value", numericValue(value), "unit", metric));
            if (shouldIncludeComparison(request)) {
                data.put("comparison", comparison(metric, workspaceIds, boardIds, request, expression, metricCondition, numericValue(value)));
            }
        } else {
            data.put("bar", Map.of(
                    "labels", rows.stream().map(row -> String.valueOf(row.get("label"))).toList(),
                    "values", rows.stream().map(row -> numericValue(row.get("value"))).toList()));
            data.put("table", Map.of("columns", List.of("Label", "Value"), "rows", rows));
        }
        if (TEMPORAL_COUNT_METRICS.contains(metric)) {
            data.put("line", Map.of("points", temporalCountPoints(metric, dimension, workspaceIds, boardIds, request)));
        }
        data.put("drilldown", drilldownRows);
        return new MetricQueryResponse(metric, dimension, data, List.of());
    }

    private Map<String, Object> comparison(String metric, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request, String expression, String metricCondition, Number currentValue) {
        DateRange currentRange = effectiveDateRange(request);
        long days = Math.max(1L, currentRange.to().toEpochDay() - currentRange.from().toEpochDay() + 1L);
        LocalDate previousTo = currentRange.from().minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(days - 1L);
        MetricQueryRequest previousRequest = new MetricQueryRequest(
                request.metric(),
                request.dimension(),
                request.workspaceIds(),
                request.boardIds(),
                previousFrom.toString(),
                previousTo.toString(),
                request.filters(),
                request.customFieldKey(),
                request.aggregation(),
                false,
                request.comparisonMode(),
                null);
        Number previousValue = queryScalarAggregate(workspaceIds, boardIds, previousRequest, expression, metricCondition);
        double current = currentValue.doubleValue();
        double previous = previousValue.doubleValue();
        double absoluteDelta = Math.round((current - previous) * 10.0) / 10.0;
        double percentDelta = previous == 0.0 ? 0.0 : Math.round(((current - previous) / previous) * 1000.0) / 10.0;
        String direction = absoluteDelta > 0 ? "up" : absoluteDelta < 0 ? "down" : "flat";
        boolean lowerIsBetter = Set.of("open_tasks", "overdue_tasks", "due_soon_tasks", "stale_tasks",
                "average_lead_time", "median_lead_time", "average_cycle_time", "median_cycle_time", "p90_cycle_time")
                .contains(metric);
        boolean neutral = Set.of("task_count", "total_budget", "total_effort", "average_effort").contains(metric);
        boolean positive = neutral || absoluteDelta == 0.0 || (lowerIsBetter ? absoluteDelta < 0 : absoluteDelta > 0);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("current", current);
        result.put("previous", previous);
        result.put("absoluteDelta", absoluteDelta);
        result.put("percentDelta", percentDelta);
        result.put("direction", direction);
        result.put("isPositive", positive);
        result.put("hasPrevious", previous != 0.0);
        result.put("periodLabel", "vs previous period");
        result.put("currentFrom", currentRange.from().toString());
        result.put("currentTo", currentRange.to().toString());
        result.put("previousFrom", previousFrom.toString());
        result.put("previousTo", previousTo.toString());
        return result;
    }

    private Number queryScalarAggregate(List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request, String expression, String metricCondition) {
        QueryParts scope = scopeWhere(workspaceIds, boardIds, request);
        CustomFieldColumnSelector customFieldSelector = customFieldColumnSelector(request.customFieldKey());
        String sql = """
                with task_scope as (
                  select t.id as task_id,
                         t.title,
                         t.board_id,
                         b.name as board_name,
                         w.id as workspace_id,
                         w.name as workspace_name,
                         t.status,
                         t.progress,
                         t.budget,
                         %s
                         t.created_at,
                         t.updated_at,
                         t.first_started_at,
                         t.completed_at,
                         (select count(*) from task_assignees ta where ta.task_id = t.id) as assignee_count,
                         cv.value as custom_value,
                         coalesce(nullif(so.workflow_meaning, 'none'),
                                  case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end) as workflow
                  from task t
                  join boards b on b.id = t.board_id
                  join workspaces w on w.id = b.workspace_id
                  left join board_column_options so on so.id = t.status_option_id
                  %s
                  left join task_custom_values cv on cv.task_id = t.id
                    and cv.column_id in (select id from board_columns where %s and deleted_at is null)
                  where t.deleted_at is null
                    and b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                )
                select %s as value
                from task_scope
                where %s
                """.formatted(SEMANTIC_FIELD_SELECTS, SEMANTIC_FIELD_JOINS, customFieldSelector.where(), scope.where(), expression, metricCondition);
        List<Object> params = new ArrayList<>(customFieldSelector.params());
        params.addAll(scope.params());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        return rows.isEmpty() ? 0 : numericValue(rows.get(0).get("value"));
    }

    private boolean shouldIncludeComparison(MetricQueryRequest request) {
        return Boolean.TRUE.equals(request.includeComparison())
                && (request.comparisonMode() == null || request.comparisonMode().isBlank()
                        || "previous_period".equals(request.comparisonMode()));
    }

    private DateRange effectiveDateRange(MetricQueryRequest request) {
        LocalDate to = parseDate(request.dateTo());
        LocalDate from = parseDate(request.dateFrom());
        LocalDate effectiveTo = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(29);
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new IllegalArgumentException("Metrics dateFrom must be before dateTo");
        }
        return new DateRange(effectiveFrom, effectiveTo);
    }

    private List<Map<String, Object>> drilldownRows(QueryParts scope, MetricQueryRequest request, String metricCondition, String dimension) {
        QueryParts segment = segmentWhere(dimension, request.segmentLabel());
        CustomFieldColumnSelector customFieldSelector = customFieldColumnSelector(request.customFieldKey());
        String sql = """
                with task_scope as (
                  select t.id as task_id,
                         t.title,
                         t.board_id,
                         b.name as board_name,
                         w.id as workspace_id,
                         w.name as workspace_name,
                           t.status,
                           t.updated_at,
                           t.progress,
                          t.budget,
                          %s
                          (select count(*) from task_assignees ta where ta.task_id = t.id) as assignee_count,
                          cv.value as custom_value,
                          (select string_agg(u.name, ', ' order by u.name)
                           from task_assignees ta
                           join users u on u.id = ta.user_id
                           where ta.task_id = t.id) as assignees,
                          coalesce(nullif(so.workflow_meaning, 'none'),
                                   case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end) as workflow
                  from task t
                  join boards b on b.id = t.board_id
                  join workspaces w on w.id = b.workspace_id
                  left join board_column_options so on so.id = t.status_option_id
                  %s
                  left join task_custom_values cv on cv.task_id = t.id
                    and cv.column_id in (select id from board_columns where %s and deleted_at is null)
                  where t.deleted_at is null
                    and b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                )
                select task_id as "taskId",
                       title,
                       workspace_id as "workspaceId",
                       workspace_name as "workspaceName",
                       board_id as "boardId",
                       board_name as "boardName",
                       status,
                       workflow,
                       priority,
                       coalesce(assignees, 'Unassigned') as assignees,
                       due_date as "dueDate",
                       updated_at as "updatedAt",
                       metric_progress as progress,
                       metric_budget as budget,
                       custom_value #>> '{}' as "customValue"
                from task_scope
                where %s
                  and %s
                order by due_date nulls last, updated_at desc
                limit 100
                """.formatted(SEMANTIC_FIELD_SELECTS, SEMANTIC_FIELD_JOINS, customFieldSelector.where(), scope.where(), metricCondition, segment.where());
        List<Object> params = new ArrayList<>(customFieldSelector.params());
        params.addAll(scope.params());
        params.addAll(segment.params());
        return jdbcTemplate.queryForList(sql, params.toArray());
    }

    private QueryParts segmentWhere(String dimension, String segmentLabel) {
        if (segmentLabel == null || segmentLabel.isBlank() || "none".equals(dimension)) {
            return new QueryParts("true", List.of());
        }
        String label = segmentLabel.trim();
        return switch (dimension) {
            case "workflow" -> new QueryParts("workflow = ?", List.<Object>of(label));
            case "status" -> new QueryParts("status = ?", List.<Object>of(label));
            case "priority" -> new QueryParts("priority = ?", List.<Object>of(label));
            case "board" -> new QueryParts("board_name = ?", List.<Object>of(label));
            case "workspace" -> new QueryParts("workspace_name = ?", List.<Object>of(label));
            case "custom_field" -> new QueryParts("coalesce(custom_value #>> '{}', 'Empty') = ?", List.<Object>of(label));
            default -> new QueryParts("true", List.of());
        };
    }

    private MetricQueryResponse createdVsCompleted(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request) {
        QueryParts scope = scopeWhere(workspaceIds, boardIds, request);
        String sql = """
                with task_scope as (
                  select t.created_at::date as created_day,
                         t.completed_at::date as completed_day
                  from task t
                  join boards b on b.id = t.board_id
                  join workspaces w on w.id = b.workspace_id
                  where t.deleted_at is null
                    and b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                ),
                created as (
                  select created_day as day, count(*) as created
                  from task_scope
                  group by created_day
                ),
                completed as (
                  select completed_day as day, count(*) as completed
                  from task_scope
                  where completed_day is not null
                  group by completed_day
                )
                select coalesce(c.day, d.day) as day,
                       coalesce(c.created, 0) as created,
                       coalesce(d.completed, 0) as completed
                from created c
                full join completed d on d.day = c.day
                order by day asc
                """.formatted(scope.where());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, scope.params().toArray());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("line", Map.of(
                "points", rows.stream().map(row -> Map.of(
                        "x", String.valueOf(row.get("day")),
                        "created", numericValue(row.get("created")),
                        "completed", numericValue(row.get("completed")))).toList()));
        data.put("table", Map.of("columns", List.of("day", "created", "completed"), "rows", rows));
        return new MetricQueryResponse(metric, dimension, data, List.of());
    }

    private List<Map<String, Object>> temporalCountPoints(String metric, String dimension, List<Long> workspaceIds, List<Long> boardIds,
            MetricQueryRequest request) {
        String eventDateExpression = temporalEventDateExpression(metric);
        String metricCondition = temporalMetricCondition(metric);
        DimensionSql dimensionSql = dimensionSql(dimension);
        QueryParts scope = scopeWhere(workspaceIds, boardIds, request, eventDateExpression);
        String labelGroupBy = "none".equals(dimension) ? "" : ", " + dimensionSql.select();
        String sql = """
                with task_scope as (
                  select %s::date as event_day,
                         b.name as board_name,
                         w.name as workspace_name,
                         t.status,
                         %s
                         t.updated_at,
                         t.completed_at,
                         coalesce(nullif(so.workflow_meaning, 'none'),
                                  case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end) as workflow
                  from task t
                  join boards b on b.id = t.board_id
                  join workspaces w on w.id = b.workspace_id
                  left join board_column_options so on so.id = t.status_option_id
                  %s
                  where t.deleted_at is null
                    and b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                )
                select event_day as day, %s as label, count(*) as value
                from task_scope
                where event_day is not null
                  and %s
                group by event_day%s
                order by event_day asc, value desc
                """.formatted(eventDateExpression, SEMANTIC_FIELD_SELECTS, SEMANTIC_FIELD_JOINS, scope.where(), dimensionSql.select(), metricCondition, labelGroupBy);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, scope.params().toArray());
        if ("none".equals(dimension)) {
            return rows.stream()
                    .map(row -> {
                        Map<String, Object> point = new LinkedHashMap<>();
                        point.put("x", String.valueOf(row.get("day")));
                        point.put("value", numericValue(row.get("value")));
                        return point;
                    })
                    .toList();
        }

        List<String> topSeries = rows.stream()
                .collect(Collectors.groupingBy(row -> String.valueOf(row.get("label")), Collectors.summingDouble(row -> numericValue(row.get("value")).doubleValue())))
                .entrySet()
                .stream()
                .sorted((left, right) -> Double.compare(right.getValue(), left.getValue()))
                .limit(8)
                .map(Map.Entry::getKey)
                .toList();
        Map<String, Map<String, Object>> pointsByDay = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String label = String.valueOf(row.get("label"));
            if (!topSeries.contains(label)) {
                continue;
            }
            String day = String.valueOf(row.get("day"));
            Map<String, Object> point = pointsByDay.computeIfAbsent(day, key -> {
                Map<String, Object> next = new LinkedHashMap<>();
                next.put("x", key);
                return next;
            });
            point.put(label, numericValue(row.get("value")));
        }
        pointsByDay.values().forEach(point -> topSeries.forEach(label -> point.putIfAbsent(label, 0)));
        return new ArrayList<>(pointsByDay.values());
    }

    private String temporalEventDateExpression(String metric) {
        return switch (metric) {
            case "completed_tasks" -> "t.completed_at";
            case "overdue_tasks", "due_soon_tasks" -> "t.due_date";
            case "stale_tasks" -> "t.updated_at";
            default -> throw new IllegalArgumentException("Unsupported temporal metric: " + metric);
        };
    }

    private String temporalMetricCondition(String metric) {
        return switch (metric) {
            case "completed_tasks" -> "workflow = 'done' and completed_at is not null";
            case "overdue_tasks" -> "workflow <> 'done' and due_date < current_date";
            case "due_soon_tasks" -> "workflow <> 'done' and due_date >= current_date and due_date <= current_date + interval '7 days'";
            case "stale_tasks" -> "workflow <> 'done' and updated_at < now() - interval '7 days'";
            default -> throw new IllegalArgumentException("Unsupported temporal metric: " + metric);
        };
    }

    private QueryParts scopeWhere(List<Long> workspaceIds, List<Long> boardIds, MetricQueryRequest request) {
        return scopeWhere(workspaceIds, boardIds, request, "t.created_at");
    }

    private QueryParts scopeWhere(List<Long> workspaceIds, List<Long> boardIds, MetricQueryRequest request, String dateColumnExpression) {
        List<String> clauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        if (workspaceIds.isEmpty()) {
            clauses.add("false");
        } else {
            clauses.add(inClause("w.id", workspaceIds, params));
        }
        if (!boardIds.isEmpty()) {
            clauses.add(inClause("b.id", boardIds, params));
        }
        DateRange defaultComparisonRange = shouldIncludeComparison(request) ? effectiveDateRange(request) : null;
        LocalDate from = parseDate(request.dateFrom());
        if (from == null && defaultComparisonRange != null) {
            from = defaultComparisonRange.from();
        }
        if (from != null) {
            clauses.add("(" + dateColumnExpression + ")::timestamp >= ?");
            params.add(Timestamp.from(from.atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        LocalDate to = parseDate(request.dateTo());
        if (to == null && defaultComparisonRange != null) {
            to = defaultComparisonRange.to();
        }
        if (to != null) {
            clauses.add("(" + dateColumnExpression + ")::timestamp < ?");
            params.add(Timestamp.from(to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        Map<String, Object> filters = request.filters();
        if (filters != null) {
            Object workflow = filters.get("workflow");
            if (workflow instanceof String value && !value.isBlank()) {
                clauses.add("""
                        coalesce(nullif((select o.workflow_meaning from board_column_options o where o.id = t.status_option_id), 'none'),
                                 case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end) = ?
                        """);
                params.add(value);
            }
            Object priority = filters.get("priority");
            if (priority instanceof String value && !value.isBlank()) {
                clauses.add("t.priority = ?");
                params.add(value);
            }
            Object assigneeId = filters.get("assigneeId");
            if (assigneeId instanceof String value && !value.isBlank()) {
                clauses.add("exists (select 1 from task_assignees ta where ta.task_id = t.id and ta.user_id = ?)");
                params.add(Long.valueOf(value));
            }
            Object dueDateState = filters.get("dueDateState");
            if (dueDateState instanceof String value && !value.isBlank()) {
                switch (value) {
                    case "overdue" -> clauses.add("t.due_date < current_date");
                    case "due_soon" -> clauses.add("t.due_date >= current_date and t.due_date <= current_date + interval '7 days'");
                    case "no_date" -> clauses.add("t.due_date is null");
                    default -> throw new IllegalArgumentException("Invalid due date filter");
                }
            }
        }
        return new QueryParts(String.join(" and ", clauses), params);
    }

    private DimensionSql dimensionSql(String dimension) {
        return switch (dimension) {
            case "none" -> new DimensionSql("'Total'", "");
            case "workflow" -> new DimensionSql("workflow", "group by workflow");
            case "status" -> new DimensionSql("status", "group by status");
            case "priority" -> new DimensionSql("priority", "group by priority");
            case "board" -> new DimensionSql("board_name", "group by board_name");
            case "workspace" -> new DimensionSql("workspace_name", "group by workspace_name");
            case "custom_field" -> new DimensionSql("coalesce(custom_value #>> '{}', 'Empty')", "group by coalesce(custom_value #>> '{}', 'Empty')");
            default -> throw new IllegalArgumentException("Unsupported dimension: " + dimension);
        };
    }

    private List<Long> resolveWorkspaceScope(Authentication authentication, List<String> requestedIds) {
        List<Long> accessible = accessibleWorkspaceIds(authentication);
        List<Long> requested = parseIds(requestedIds);
        if (requested.isEmpty()) {
            return accessible;
        }
        return requested.stream().filter(accessible::contains).toList();
    }

    private List<Long> accessibleWorkspaceIds(Authentication authentication) {
        return workspaceService.listForCurrentUser(authentication).stream()
                .map(WorkspaceCardDto::id)
                .map(Long::valueOf)
                .toList();
    }

    private List<Long> parseIds(List<String> ids) {
        if (ids == null) {
            return List.of();
        }
        return ids.stream()
                .filter(id -> id != null && !id.isBlank())
                .map(Long::valueOf)
                .toList();
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid metrics date; use yyyy-MM-dd", e);
        }
    }

    private Number numericValue(Object value) {
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return number;
        }
        return 0;
    }

    private List<MetricDefinitionDto> metricDefinitions() {
        List<String> dimensions = List.of("none", "workflow", "status", "priority", "board", "workspace");
        List<String> charts = List.of("kpi", "bar", "table");
        List<String> temporalCharts = List.of("kpi", "bar", "line", "timeline", "table");
        return List.of(
                new MetricDefinitionDto("task_count", "Task Count", "Total tasks in scope.", dimensions, charts),
                new MetricDefinitionDto("open_tasks", "Open Tasks", "Tasks not mapped to done.", dimensions, charts),
                new MetricDefinitionDto("completed_tasks", "Completed Tasks", "Tasks mapped to done.", dimensions, temporalCharts),
                new MetricDefinitionDto("overdue_tasks", "Overdue Tasks", "Open tasks past due date.", dimensions, temporalCharts),
                new MetricDefinitionDto("due_soon_tasks", "Due Soon Tasks", "Open tasks due within 7 days.", dimensions, temporalCharts),
                new MetricDefinitionDto("stale_tasks", "Stale Tasks", "Open tasks not updated in 7 days.", dimensions, temporalCharts),
                new MetricDefinitionDto("unassigned_tasks", "Unassigned Tasks", "Open tasks without assignees.", dimensions, charts),
                new MetricDefinitionDto("completion_rate", "Completion Rate", "Completed tasks as percentage of total.", dimensions, charts),
                new MetricDefinitionDto("average_progress", "Average Progress", "Average task progress.", dimensions, charts),
                new MetricDefinitionDto("total_budget", "Total Budget", "Total task budget.", dimensions, charts),
                new MetricDefinitionDto("total_effort", "Total Effort", "Total mapped task effort.", dimensions, charts),
                new MetricDefinitionDto("average_effort", "Average Effort", "Average mapped task effort.", dimensions, charts),
                new MetricDefinitionDto("average_lead_time", "Average Lead Time", "Average days from creation to completion.", dimensions, charts),
                new MetricDefinitionDto("median_lead_time", "Median Lead Time", "Median days from creation to completion.", dimensions, charts),
                new MetricDefinitionDto("average_cycle_time", "Average Cycle Time", "Average days from first in-progress to completion.", dimensions, charts),
                new MetricDefinitionDto("median_cycle_time", "Median Cycle Time", "Median days from first in-progress to completion.", dimensions, charts),
                new MetricDefinitionDto("p90_cycle_time", "P90 Cycle Time", "90th percentile cycle time in days.", dimensions, charts),
                new MetricDefinitionDto("custom_field", "Custom Field", "Aggregate or group by a custom board column.", List.of("none", "custom_field", "workflow", "status", "priority", "board", "workspace"), charts),
                new MetricDefinitionDto("created_vs_completed", "Created vs Completed", "Task inflow and completion over time.", List.of("none"), List.of("line", "timeline", "table")));
    }

    private List<MetricDimensionDto> dimensionDefinitions() {
        return List.of(
                new MetricDimensionDto("none", "None", "scalar"),
                new MetricDimensionDto("workflow", "Workflow", "category"),
                new MetricDimensionDto("status", "Status", "category"),
                new MetricDimensionDto("priority", "Priority", "category"),
                new MetricDimensionDto("board", "Board", "category"),
                new MetricDimensionDto("workspace", "Workspace", "category"),
                new MetricDimensionDto("custom_field", "Custom Field", "category"));
    }

    private List<String> workflowWarnings(List<Long> workspaceIds, List<Long> boardIds) {
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        List<Object> params = new ArrayList<>(workspaceIds);
        String boardClause = "";
        if (!boardIds.isEmpty()) {
            boardClause = " and " + inClause("b.id", boardIds, params);
        }
        String sql = """
                select workflow, count(*) as task_count
                from (
                    select case
                             when t.status_option_id is not null then coalesce(nullif(so.workflow_meaning, 'none'), 'unclassified')
                             else case t.status when 'todo' then 'new' when 'new' then 'new' when 'in_progress' then 'in_progress' when 'done' then 'done' else 'unclassified' end
                           end as workflow
                    from task t
                    join boards b on b.id = t.board_id
                    join workspaces w on w.id = b.workspace_id
                    left join board_column_options so on so.id = t.status_option_id
                    where t.deleted_at is null
                      and b.deleted_at is null
                      and b.archived_at is null
                      and w.deleted_at is null
                      and %s
                      %s
                ) task_scope
                group by workflow
                """.formatted(inClause("b.workspace_id", workspaceIds, new ArrayList<>()), boardClause);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        long totalTasks = rows.stream()
                .map(row -> numericValue(row.get("task_count")).longValue())
                .reduce(0L, Long::sum);
        if (totalTasks == 0) {
            return List.of();
        }
        Set<String> workflowsWithTasks = rows.stream()
                .filter(row -> numericValue(row.get("task_count")).longValue() > 0)
                .map(row -> String.valueOf(row.get("workflow")))
                .collect(Collectors.toSet());
        List<String> missing = List.of("new", "in_progress", "done").stream()
                .filter(workflow -> !workflowsWithTasks.contains(workflow))
                .map(this::workflowLabel)
                .toList();
        if (!missing.isEmpty()) {
            return List.of("No tasks currently map to " + String.join(", ", missing)
                    + ". Flow metrics work best when the visible scope has tasks across New, In progress, and Done.");
        }
        return List.of();
    }

    private List<String> semanticFieldWarnings(List<Long> workspaceIds, List<Long> boardIds) {
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        List<String> warnings = new ArrayList<>();
        semanticFieldWarning("budget", "Budget", "metric_budget", workspaceIds, boardIds).ifPresent(warnings::add);
        semanticFieldWarning("progress", "Progress", "metric_progress", workspaceIds, boardIds).ifPresent(warnings::add);
        semanticFieldWarning("due_date", "Due Date", "due_date", workspaceIds, boardIds).ifPresent(warnings::add);
        semanticFieldWarning("priority", "Priority", "priority", workspaceIds, boardIds).ifPresent(warnings::add);
        semanticFieldWarning("effort", "Effort", "metric_effort", workspaceIds, boardIds).ifPresent(warnings::add);
        return warnings;
    }

    private java.util.Optional<String> semanticFieldWarning(String semanticKey, String label, String metricColumn,
            List<Long> workspaceIds, List<Long> boardIds) {
        List<Object> params = new ArrayList<>(workspaceIds);
        String boardClause = "";
        if (!boardIds.isEmpty()) {
            boardClause = " and " + inClause("b.id", boardIds, params);
        }
        String sql = """
                with board_scope as (
                  select b.id as board_id,
                         w.name as workspace_name,
                         b.name as board_name,
                         count(task_scope.task_id) as task_count,
                         count(task_scope.%s) as value_count
                  from boards b
                  join workspaces w on w.id = b.workspace_id
                  left join (
                    select t.id as task_id,
                           t.board_id,
                           %s
                           t.created_at
                    from task t
                    %s
                    where t.deleted_at is null
                  ) task_scope on task_scope.board_id = b.id
                  where b.deleted_at is null
                    and b.archived_at is null
                    and w.deleted_at is null
                    and %s
                    %s
                  group by b.id, w.name, b.name
                )
                select workspace_name, board_name
                from board_scope
                where task_count > 0
                  and value_count = 0
                order by workspace_name asc, board_name asc
                """.formatted(metricColumn, SEMANTIC_FIELD_SELECTS, SEMANTIC_FIELD_JOINS, inClause("b.workspace_id", workspaceIds, new ArrayList<>()), boardClause);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params.toArray());
        if (rows.isEmpty()) {
            return java.util.Optional.empty();
        }
        List<String> boards = rows.stream()
                .limit(4)
                .map(row -> row.get("workspace_name") + " / " + row.get("board_name"))
                .toList();
        String suffix = rows.size() > boards.size() ? " and " + (rows.size() - boards.size()) + " more" : "";
        return java.util.Optional.of(label + " field missing in " + rows.size() + " board"
                + (rows.size() == 1 ? "" : "s") + ": " + String.join(", ", boards) + suffix + ".");
    }

    private String workflowLabel(String workflow) {
        return switch (workflow) {
            case "new" -> "New";
            case "in_progress" -> "In progress";
            case "done" -> "Done";
            default -> workflow;
        };
    }

    private List<MetricUserDto> assignees(List<Long> workspaceIds) {
        if (workspaceIds.isEmpty()) {
            return List.of();
        }
        List<Object> params = new ArrayList<>(workspaceIds);
        String sql = """
                select distinct u.id, u.name, u.email
                from users u
                join workspace_member wm on wm.user_id = u.id
                join workspaces w on w.id = wm.workspace_id
                where w.deleted_at is null
                  and %s
                order by u.name asc
                """.formatted(inClause("w.id", workspaceIds, new ArrayList<>()));
        return jdbcTemplate.query(sql, (rs, rowNum) -> new MetricUserDto(
                String.valueOf(rs.getLong("id")),
                rs.getString("name"),
                rs.getString("email")), params.toArray());
    }

    private CustomFieldColumnSelector customFieldColumnSelector(String customFieldKey) {
        if (customFieldKey == null || customFieldKey.isBlank()) {
            return new CustomFieldColumnSelector("key = ?", "c.key = ?", List.of(""));
        }
        if (!customFieldKey.startsWith("group:")) {
            return new CustomFieldColumnSelector("key = ?", "c.key = ?", List.of(customFieldKey));
        }
        String[] parts = customFieldKey.split(":", 4);
        if (parts.length == 3) {
            String type = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
            String label = URLDecoder.decode(parts[2], StandardCharsets.UTF_8);
            return new CustomFieldColumnSelector(
                    "lower(label) = lower(?) and type = ?",
                    "lower(c.label) = lower(?) and c.type = ?",
                    List.of(label, type));
        }
        if (parts.length != 4) {
            throw new IllegalArgumentException("Invalid custom field group key");
        }
        String workspaceId = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
        String type = URLDecoder.decode(parts[2], StandardCharsets.UTF_8);
        String label = URLDecoder.decode(parts[3], StandardCharsets.UTF_8);
        if ("unknown".equals(workspaceId)) {
            return new CustomFieldColumnSelector(
                    "lower(label) = lower(?) and type = ?",
                    "lower(c.label) = lower(?) and c.type = ?",
                    List.of(label, type));
        }
        Long parsedWorkspaceId = Long.parseLong(workspaceId);
        return new CustomFieldColumnSelector(
                "board_id in (select id from boards where workspace_id = ?) and lower(label) = lower(?) and type = ?",
                "c.board_id in (select id from boards where workspace_id = ?) and lower(c.label) = lower(?) and c.type = ?",
                List.of(parsedWorkspaceId, label, type));
    }

    private String inClause(String column, List<Long> ids, List<Object> params) {
        params.addAll(ids);
        return column + " in (" + String.join(",", ids.stream().map(id -> "?").toList()) + ")";
    }

    private record QueryParts(String where, List<Object> params) {
    }

    private record DimensionSql(String select, String groupBy) {
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }

    private record CustomFieldColumnSelector(String where, String aliasedWhere, List<Object> params) {
    }

    private record BoardScopeRow(Long boardId, String boardName, Long workspaceId, String workspaceName) {
    }
}
