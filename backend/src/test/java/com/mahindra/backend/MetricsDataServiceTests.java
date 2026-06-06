package com.mahindra.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.metrics.MetricCatalogDto;
import com.mahindra.backend.dto.metrics.MetricDefinitionDto;
import com.mahindra.backend.dto.metrics.MetricFieldMappingRequest;
import com.mahindra.backend.dto.metrics.MetricQueryRequest;
import com.mahindra.backend.dto.metrics.MetricQueryResponse;
import com.mahindra.backend.dto.metrics.MetricSemanticFieldDto;
import com.mahindra.backend.service.MetricsDataService;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class MetricsDataServiceTests {

    @Autowired
    private MetricsDataService metricsDataService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void catalogReturnsMetricsForLead() {
        MetricCatalogDto catalog = metricsDataService.catalog(auth("lead1@gmail.com"));

        assertThat(catalog.metrics()).extracting(MetricDefinitionDto::id)
                .contains("task_count", "completion_rate", "created_vs_completed");
        assertThat(catalog.dimensions()).extracting("id")
                .contains("none", "board", "workspace", "workflow");
        assertThat(catalog.assignees()).isNotEmpty();
        MetricDefinitionDto completedTasks = catalog.metrics().stream()
                .filter(metric -> metric.id().equals("completed_tasks"))
                .findFirst()
                .orElseThrow();
        assertThat(completedTasks.compatibleVisualizations()).contains("line", "timeline");
    }

    @Test
    void queryCompletionRateReturnsKpiAndDrilldown() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("completion_rate", "none", List.of("1"), List.of(), null, null, false, null));

        assertThat(response.metric()).isEqualTo("completion_rate");
        assertThat(response.data()).containsKeys("kpi", "drilldown");
        assertThat(((Map<?, ?>) response.data().get("kpi")).containsKey("value")).isTrue();
    }

    @Test
    void queryComparisonReturnsPreviousPeriodPayload() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("completion_rate", "none", List.of("1"), List.of(), "2026-01-01", "2026-12-31", true, null));

        assertThat(response.data()).containsKey("comparison");
        Map<?, ?> comparison = (Map<?, ?>) response.data().get("comparison");
        assertThat(comparison.containsKey("current")).isTrue();
        assertThat(comparison.containsKey("previous")).isTrue();
        assertThat(comparison.containsKey("absoluteDelta")).isTrue();
        assertThat(comparison.containsKey("percentDelta")).isTrue();
        assertThat(comparison.containsKey("isPositive")).isTrue();
    }

    @Test
    void segmentedDrilldownFiltersByBoardLabel() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("task_count", "board", List.of("1"), List.of(), null, null, false, "Delivery"));

        List<?> drilldown = (List<?>) response.data().get("drilldown");

        assertThat(drilldown).isNotEmpty();
        assertThat(drilldown)
                .allSatisfy(row -> assertThat(String.valueOf(((Map<?, ?>) row).get("boardName"))).isEqualTo("Delivery"));
    }

    @Test
    void queryUnassignedTasksCountsOnlyOpenTasksWithoutAssignees() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("unassigned_tasks", "none", List.of(), List.of(), null, null, false, null));

        Map<?, ?> kpi = (Map<?, ?>) response.data().get("kpi");
        List<?> drilldown = (List<?>) response.data().get("drilldown");

        assertThat(((Number) kpi.get("value")).doubleValue()).isGreaterThan(0);
        assertThat(drilldown).isNotEmpty();
        assertThat(drilldown)
                .allSatisfy(row -> assertThat(String.valueOf(((Map<?, ?>) row).get("assignees"))).isEqualTo("Unassigned"));
    }

    @Test
    void temporalMetricsReturnLineSeries() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("completed_tasks", "board", List.of("1"), List.of(), null, null, false, null));

        assertThat(response.data()).containsKey("line");
        Map<?, ?> line = (Map<?, ?>) response.data().get("line");
        assertThat((List<?>) line.get("points")).isNotEmpty();
        assertThat((List<?>) line.get("points"))
                .allSatisfy(point -> {
                    Map<?, ?> row = (Map<?, ?>) point;
                    assertThat(row.containsKey("x")).isTrue();
                    assertThat(row.keySet().stream().filter(key -> !"x".equals(String.valueOf(key))).count()).isGreaterThan(0);
                });
    }

    @Test
    void temporalMetricsWithoutDimensionReturnLineSeries() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("overdue_tasks", "none", List.of(), List.of(), null, null, false, null));

        assertThat(response.data()).containsKey("line");
        Map<?, ?> line = (Map<?, ?>) response.data().get("line");
        assertThat(line.containsKey("points")).isTrue();
    }

    @Test
    void totalBudgetUsesSemanticCustomFieldMappingWhenCoreBudgetIsEmpty() {
        Long boardId = jdbcTemplate.queryForObject("""
                select b.id
                from boards b
                join workspaces w on w.id = b.workspace_id
                where w.name = 'Payments modernization rollout'
                  and b.name = 'Planning'
                """, Long.class);
        Long coreBudgetRows = jdbcTemplate.queryForObject("""
                select count(*)
                from task t
                where t.board_id = ?
                  and t.description like 'Metrics demo task%%'
                  and t.budget is not null
                """, Long.class, boardId);

        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("total_budget", "none", List.of(), List.of(String.valueOf(boardId)), null, null, false, null));

        Map<?, ?> kpi = (Map<?, ?>) response.data().get("kpi");
        assertThat(coreBudgetRows).isZero();
        assertThat(((Number) kpi.get("value")).doubleValue()).isGreaterThan(0);
    }

    @Test
    void catalogWarnsWhenBudgetCannotBeResolvedForScopedBoard() {
        Long workspaceId = jdbcTemplate.queryForObject("""
                select id from workspaces where name = 'Customer wayfinding and mobile ticketing'
                """, Long.class);
        Long creatorId = jdbcTemplate.queryForObject("select id from users where email = 'admin1@gmail.com'", Long.class);
        Long boardId = jdbcTemplate.queryForObject("""
                insert into boards (workspace_id, name, description, color, created_by)
                values (?, 'No Budget Metrics Test', 'Board intentionally missing budget data', '#5F0229', ?)
                returning id
                """, Long.class, workspaceId, creatorId);
        jdbcTemplate.update("""
                insert into task (board_id, title, description, status, priority, points_value, created_by, progress)
                values (?, 'Task without budget', 'Semantic budget warning test', 'todo', 'medium', 10, ?, 25)
                """, boardId, creatorId);

        MetricCatalogDto catalog = metricsDataService.catalog(auth("lead1@gmail.com"),
                List.of(String.valueOf(workspaceId)), List.of(String.valueOf(boardId)));

        assertThat(catalog.warnings())
                .anySatisfy(warning -> assertThat(warning).contains("Budget field missing", "No Budget Metrics Test"));
    }

    @Test
    void catalogReturnsStructuredSemanticFields() {
        MetricCatalogDto catalog = metricsDataService.catalog(auth("lead1@gmail.com"));

        assertThat(catalog.semanticFields()).isNotEmpty();
        assertThat(catalog.semanticFields())
                .anySatisfy(field -> assertThat(field.semanticKey()).isEqualTo("budget"));
        assertThat(catalog.semanticFields()).extracting(MetricSemanticFieldDto::semanticKey)
                .contains("budget", "progress", "due_date", "priority", "effort");
    }

    @Test
    void queryTotalEffortUsesSemanticEffortFallback() {
        MetricQueryResponse response = metricsDataService.query(auth("lead1@gmail.com"),
                request("total_effort", "none", List.of(), List.of(), null, null, false, null));

        Map<?, ?> kpi = (Map<?, ?>) response.data().get("kpi");
        assertThat(((Number) kpi.get("value")).doubleValue()).isGreaterThan(0);
    }

    @Test
    void updateFieldMappingPersistsCompatibleCustomColumn() {
        Long boardId = jdbcTemplate.queryForObject("""
                select b.id
                from boards b
                join workspaces w on w.id = b.workspace_id
                where w.name = 'Payments modernization rollout'
                  and b.name = 'Planning'
                """, Long.class);
        String columnKey = jdbcTemplate.queryForObject("""
                select key
                from board_columns
                where board_id = ?
                  and key = 'col_expected_cost'
                  and deleted_at is null
                """, String.class, boardId);

        MetricSemanticFieldDto result = metricsDataService.updateFieldMapping(auth("lead1@gmail.com"),
                boardId,
                "budget",
                new MetricFieldMappingRequest("custom_field", columnKey));

        assertThat(result.sourceType()).isEqualTo("custom_field");
        assertThat(result.sourceKey()).isEqualTo(columnKey);
        assertThat(result.missing()).isFalse();
    }

    @Test
    void updateFieldMappingRejectsIncompatibleCustomColumn() {
        Long boardId = jdbcTemplate.queryForObject("select id from boards order by id limit 1", Long.class);
        String statusKey = jdbcTemplate.queryForObject("""
                select key
                from board_columns
                where board_id = ?
                  and type = 'status'
                  and deleted_at is null
                limit 1
                """, String.class, boardId);

        assertThatThrownBy(() -> metricsDataService.updateFieldMapping(auth("lead1@gmail.com"),
                boardId,
                "budget",
                new MetricFieldMappingRequest("custom_field", statusKey)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not compatible");
    }

    @Test
    void queryFiltersOutInaccessibleWorkspaceScope() {
        MetricQueryResponse response = metricsDataService.query(auth("developer1@gmail.com"),
                request("task_count", "none", List.of("999999"), List.of(), null, null, false, null));

        Map<?, ?> kpi = (Map<?, ?>) response.data().get("kpi");

        assertThat(((Number) kpi.get("value")).doubleValue()).isZero();
        assertThat((List<?>) response.data().get("drilldown")).isEmpty();
    }

    @Test
    void invalidMetricThrows() {
        assertThatThrownBy(() -> metricsDataService.query(auth("lead1@gmail.com"),
                request("not_a_metric", "none", List.of("1"), List.of(), null, null, false, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported metric");
    }

    private MetricQueryRequest request(String metric,
            String dimension,
            List<String> workspaceIds,
            List<String> boardIds,
            String dateFrom,
            String dateTo,
            boolean includeComparison,
            String segmentLabel) {
        return new MetricQueryRequest(
                metric,
                dimension,
                workspaceIds,
                boardIds,
                dateFrom,
                dateTo,
                Map.of(),
                null,
                null,
                includeComparison,
                "previous_period",
                segmentLabel);
    }

    private Authentication auth(String email) {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(email, null);
        authentication.setAuthenticated(true);
        return authentication;
    }
}
