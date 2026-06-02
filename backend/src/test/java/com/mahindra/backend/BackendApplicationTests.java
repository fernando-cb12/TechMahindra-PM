package com.mahindra.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    private AuthResponse login(HttpClient client, String email) throws Exception {
        HttpRequest loginRequest = HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"" + email + "\",\"password\":\"role123\"}"))
                .build();

        HttpResponse<String> login = client.send(loginRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(login.statusCode()).isEqualTo(HttpStatus.OK.value());
        return objectMapper.readValue(login.body(), AuthResponse.class);
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

}
