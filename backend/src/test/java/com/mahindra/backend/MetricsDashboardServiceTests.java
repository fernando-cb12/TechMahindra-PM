package com.mahindra.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.metrics.MetricDashboardDto;
import com.mahindra.backend.dto.metrics.MetricDashboardRequest;
import com.mahindra.backend.exception.ResourceNotFoundException;
import com.mahindra.backend.service.MetricsDashboardService;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class MetricsDashboardServiceTests {

    @Autowired
    private MetricsDashboardService metricsDashboardService;

    @Test
    void createUpdateDuplicateAndDeleteDashboard() {
        Authentication lead = auth("lead1@gmail.com");
        MetricDashboardDto created = metricsDashboardService.create(lead, request("Metrics A", false, List.of("w1")));

        assertThat(created.name()).isEqualTo("Metrics A");
        assertThat(created.visibility()).isEqualTo("private");
        assertThat(metricsDashboardService.list(lead)).extracting(MetricDashboardDto::id).contains(created.id());

        MetricDashboardDto updated = metricsDashboardService.update(lead, Long.valueOf(created.id()),
                request("Metrics Renamed", false, List.of("w2")));

        assertThat(updated.name()).isEqualTo("Metrics Renamed");
        assertThat(((List<?>) updated.config().get("widgets")).stream().map(String::valueOf).toList()).contains("w2");

        MetricDashboardDto duplicate = metricsDashboardService.duplicate(lead, Long.valueOf(created.id()));

        assertThat(duplicate.id()).isNotEqualTo(created.id());
        assertThat(duplicate.name()).contains("Copy");
        assertThat(duplicate.isDefault()).isFalse();
        assertThat(duplicate.visibility()).isEqualTo("private");
        assertThat(((List<?>) duplicate.config().get("widgets")).stream().map(String::valueOf).toList()).contains("w2");

        metricsDashboardService.delete(lead, Long.valueOf(created.id()));

        assertThat(metricsDashboardService.list(lead)).extracting(MetricDashboardDto::id).doesNotContain(created.id());
        assertThatThrownBy(() -> metricsDashboardService.get(lead, Long.valueOf(created.id())))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void settingDefaultClearsPreviousDefaultForSameUser() {
        Authentication lead = auth("lead1@gmail.com");
        MetricDashboardDto first = metricsDashboardService.create(lead, request("Default A", true, List.of("a")));
        MetricDashboardDto second = metricsDashboardService.create(lead, request("Default B", true, List.of("b")));

        List<MetricDashboardDto> dashboards = metricsDashboardService.list(lead);

        assertThat(dashboards.stream().filter(MetricDashboardDto::isDefault).map(MetricDashboardDto::id).toList())
                .containsExactly(second.id());
        assertThat(metricsDashboardService.get(lead, Long.valueOf(first.id())).isDefault()).isFalse();
        assertThat(metricsDashboardService.get(lead, Long.valueOf(second.id())).isDefault()).isTrue();
    }

    @Test
    void dashboardOwnedByOtherUserIsNotAccessible() {
        Authentication lead = auth("lead1@gmail.com");
        Authentication developer = auth("developer1@gmail.com");
        MetricDashboardDto created = metricsDashboardService.create(lead, request("Lead Private", false, List.of("private")));

        assertThatThrownBy(() -> metricsDashboardService.get(developer, Long.valueOf(created.id())))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> metricsDashboardService.update(developer, Long.valueOf(created.id()),
                request("Nope", false, List.of("x"))))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> metricsDashboardService.delete(developer, Long.valueOf(created.id())))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private MetricDashboardRequest request(String name, boolean isDefault, List<String> widgets) {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("filters", Map.of("workspaceIds", List.of("1")));
        config.put("widgets", widgets);
        return new MetricDashboardRequest(name, "global", null, isDefault, "private", config);
    }

    private Authentication auth(String email) {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(email, null);
        authentication.setAuthenticated(true);
        return authentication;
    }
}
