package com.mahindra.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.mahindra.backend.dto.AuthResponse;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendApplicationTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @LocalServerPort
    private int port;

    @Test
    void contextLoads() {
    }

    @Test
    void adminCanLoadSeededTaskBoard() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse auth = login(client, "admin1@gmail.com");
        HttpRequest boardRequest = HttpRequest.newBuilder(uri("/api/workspaces/1/boards/1"))
                .header("Authorization", "Bearer " + auth.accessToken())
                .GET()
                .build();

        HttpResponse<String> board = client.send(boardRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(board.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(board.body()).contains("\"boardName\":\"Planning\"");
    }

    @Test
    void taskCompletionAwardsCareerAndRewardPoints() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse lead = login(client, "lead1@gmail.com");

        HttpRequest completeTask = HttpRequest.newBuilder(uri("/api/workspaces/1/boards/3/tasks/2"))
                .header("Authorization", "Bearer " + lead.accessToken())
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("{\"status\":\"done\"}"))
                .build();

        HttpResponse<String> completed = client.send(completeTask, HttpResponse.BodyHandlers.ofString());

        assertThat(completed.statusCode()).isEqualTo(HttpStatus.OK.value());

        AuthResponse developer = login(client, "developer2@gmail.com");
        HttpRequest careerRequest = HttpRequest.newBuilder(uri("/api/career/me"))
                .header("Authorization", "Bearer " + developer.accessToken())
                .GET()
                .build();
        HttpResponse<String> career = client.send(careerRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(career.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(career.body()).contains("\"currentXp\":25");

        HttpRequest rewardsRequest = HttpRequest.newBuilder(uri("/api/rewards/me"))
                .header("Authorization", "Bearer " + developer.accessToken())
                .GET()
                .build();
        HttpResponse<String> rewards = client.send(rewardsRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(rewards.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(rewards.body()).contains("\"balance\":25");

        HttpRequest redeemRequest = HttpRequest.newBuilder(uri("/api/rewards/1/redeem"))
                .header("Authorization", "Bearer " + developer.accessToken())
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        HttpResponse<String> redemption = client.send(redeemRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(redemption.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(redemption.body()).contains("Insufficient rewards balance");
    }

    @Test
    void workspaceCreationNotifiesInvitedMembersOnly() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse admin = login(client, "admin1@gmail.com");
        String title = "Notify Create " + UUID.randomUUID();

        HttpResponse<String> created = client.send(HttpRequest.newBuilder(uri("/api/workspaces"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"title":"%s","description":"Notification test","memberUserIds":[3],"status":"IN_PROGRESS"}
                        """.formatted(title)))
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(created.statusCode()).isEqualTo(HttpStatus.CREATED.value());

        AuthResponse developer = login(client, "developer1@gmail.com");
        HttpResponse<String> notifications = client.send(HttpRequest.newBuilder(uri("/api/notifications"))
                .header("Authorization", "Bearer " + developer.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(notifications.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(notifications.body()).contains("workspace.member_added");
        assertThat(notifications.body()).contains(title);

        HttpResponse<String> adminNotifications = client.send(HttpRequest.newBuilder(uri("/api/notifications"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(adminNotifications.body()).doesNotContain("You were added to " + title);
    }

    @Test
    void directWorkspaceMemberAddNotifiesOnlyNewMembers() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse admin = login(client, "admin1@gmail.com");
        String title = "Notify Add " + UUID.randomUUID();
        JsonNode workspace = createWorkspace(client, admin, title, "[2]");

        HttpResponse<String> added = client.send(HttpRequest.newBuilder(uri("/api/workspaces/" + workspace.get("id").asText() + "/members"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"userIds\":[4,2]}"))
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(added.statusCode()).isEqualTo(HttpStatus.OK.value());

        AuthResponse newMember = login(client, "developer2@gmail.com");
        HttpResponse<String> notifications = client.send(HttpRequest.newBuilder(uri("/api/notifications"))
                .header("Authorization", "Bearer " + newMember.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(notifications.body()).contains("workspace.member_added");
        assertThat(notifications.body()).contains(title);
    }

    @Test
    void boardInviteNotifiesWhenItAddsWorkspaceAccess() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse admin = login(client, "admin1@gmail.com");
        String title = "Notify Board " + UUID.randomUUID();
        JsonNode workspace = createWorkspace(client, admin, title, "[2]");

        HttpResponse<String> boardsResponse = client.send(HttpRequest.newBuilder(uri("/api/workspaces/" + workspace.get("id").asText() + "/boards"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(boardsResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        String boardId = objectMapper.readTree(boardsResponse.body()).get(0).get("id").asText();

        HttpResponse<String> invited = client.send(HttpRequest.newBuilder(uri("/api/workspaces/" + workspace.get("id").asText() + "/boards/" + boardId + "/members"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"userIds\":[3]}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(invited.statusCode()).isEqualTo(HttpStatus.OK.value());

        AuthResponse developer = login(client, "developer1@gmail.com");
        HttpResponse<String> notifications = client.send(HttpRequest.newBuilder(uri("/api/notifications"))
                .header("Authorization", "Bearer " + developer.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(notifications.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(notifications.body()).contains("workspace.member_added");
        assertThat(notifications.body()).contains(title);
    }


    @Test
    void projectUpdatePreferenceSuppressesWorkspaceAddedNotification() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        AuthResponse admin = login(client, "admin1@gmail.com");
        String email = "notify_pref_" + UUID.randomUUID() + "@example.com";
        String title = "Notify Suppressed " + UUID.randomUUID();

        HttpResponse<String> userResponse = client.send(HttpRequest.newBuilder(uri("/api/users"))
                .header("Authorization", "Bearer " + admin.accessToken())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"name":"Notification Preference","email":"%s","password":"role12345","status":"active","roles":["DEVELOPER"]}
                        """.formatted(email)))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(userResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        long userId = objectMapper.readTree(userResponse.body()).get("id").asLong();

        AuthResponse invited = login(client, email, "role12345");
        HttpResponse<String> preferences = client.send(HttpRequest.newBuilder(uri("/api/users/me"))
                .header("Authorization", "Bearer " + invited.accessToken())
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString("""
                        {"notifications":{"issuesAssigned":true,"mentions":true,"projectUpdates":false,"dailySummary":true}}
                        """))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(preferences.statusCode()).isEqualTo(HttpStatus.OK.value());

        createWorkspace(client, admin, title, "[" + userId + "]");

        HttpResponse<String> notifications = client.send(HttpRequest.newBuilder(uri("/api/notifications"))
                .header("Authorization", "Bearer " + invited.accessToken())
                .GET()
                .build(), HttpResponse.BodyHandlers.ofString());

        assertThat(notifications.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(notifications.body()).doesNotContain(title);
    }

    private AuthResponse login(HttpClient client, String email) throws Exception {
        return login(client, email, "role123");
    }

    private AuthResponse login(HttpClient client, String email, String password) throws Exception {
        HttpRequest loginRequest = HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .build();

        HttpResponse<String> login = client.send(loginRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(login.statusCode()).isEqualTo(HttpStatus.OK.value());
        return objectMapper.readValue(login.body(), AuthResponse.class);
    }

    private JsonNode createWorkspace(HttpClient client, AuthResponse auth, String title, String memberUserIds) throws Exception {
        HttpResponse<String> created = client.send(HttpRequest.newBuilder(uri("/api/workspaces"))
                .header("Authorization", "Bearer " + auth.accessToken())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                        {"title":"%s","description":"Notification test","memberUserIds":%s,"status":"IN_PROGRESS"}
                        """.formatted(title, memberUserIds)))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(created.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        return objectMapper.readTree(created.body());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

}
