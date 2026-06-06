package com.mahindra.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import com.mahindra.backend.dto.metrics.MetricPresetOverrideDto;
import com.mahindra.backend.dto.metrics.MetricPresetOverrideRequest;
import com.mahindra.backend.service.MetricsPresetOverrideService;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class MetricsPresetOverrideServiceTests {

    @Autowired
    private MetricsPresetOverrideService metricsPresetOverrideService;

    @Test
    void upsertListAndDeletePresetOverrideForCurrentUser() {
        Authentication lead = auth("lead1@gmail.com");
        MetricPresetOverrideDto created = metricsPresetOverrideService.upsert(lead, "delivery",
                new MetricPresetOverrideRequest(Map.of("widgets", List.of(Map.of("id", "w1")))));

        assertThat(created.presetId()).isEqualTo("delivery");
        assertThat(((List<?>) created.config().get("widgets"))).hasSize(1);
        assertThat(metricsPresetOverrideService.list(lead)).extracting(MetricPresetOverrideDto::presetId)
                .contains("delivery");

        MetricPresetOverrideDto updated = metricsPresetOverrideService.upsert(lead, "delivery",
                new MetricPresetOverrideRequest(Map.of("widgets", List.of(Map.of("id", "w2"), Map.of("id", "w3")))));

        assertThat(((List<?>) updated.config().get("widgets"))).hasSize(2);

        metricsPresetOverrideService.delete(lead, "delivery");

        assertThat(metricsPresetOverrideService.list(lead)).extracting(MetricPresetOverrideDto::presetId)
                .doesNotContain("delivery");
    }

    @Test
    void presetOverridesAreScopedByUser() {
        Authentication lead = auth("lead1@gmail.com");
        Authentication developer = auth("developer1@gmail.com");

        metricsPresetOverrideService.upsert(lead, "delivery",
                new MetricPresetOverrideRequest(Map.of("widgets", List.of(Map.of("id", "lead-widget")))));

        assertThat(metricsPresetOverrideService.list(developer)).extracting(MetricPresetOverrideDto::presetId)
                .doesNotContain("delivery");
    }

    @Test
    void invalidPresetIdThrows() {
        assertThatThrownBy(() -> metricsPresetOverrideService.upsert(auth("lead1@gmail.com"), "../delivery",
                new MetricPresetOverrideRequest(Map.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid preset id");
    }

    private Authentication auth(String email) {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(email, null);
        authentication.setAuthenticated(true);
        return authentication;
    }
}
