package com.mahindra.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class EmailNotificationTemplateTest {

    @Test
    void brandedEmailEscapesHtmlAndIncludesCtaInBothBodies() {
        var email = EmailNotificationTemplate.branded(
                "You were added to <Workspace>",
                "Ana & Bo added you to \"Launch\".",
                "/workspaces/42",
                Map.of("Workspace", "<Launch & Learn>"));

        assertThat(email.html()).contains("You were added to &lt;Workspace&gt;");
        assertThat(email.html()).contains("&lt;Launch &amp; Learn&gt;");
        assertThat(email.html()).contains("href=\"/workspaces/42\"");
        assertThat(email.text()).contains("You were added to <Workspace>");
        assertThat(email.text()).contains("Open in CollabX: /workspaces/42");
    }
}
