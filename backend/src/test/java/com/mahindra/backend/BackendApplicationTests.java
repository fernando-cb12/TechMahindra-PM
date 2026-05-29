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
        HttpRequest loginRequest = HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"email\":\"admin1@gmail.com\",\"password\":\"role123\"}"))
                .build();

        HttpResponse<String> login = client.send(loginRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(login.statusCode()).isEqualTo(HttpStatus.OK.value());

        AuthResponse auth = objectMapper.readValue(login.body(), AuthResponse.class);
        HttpRequest boardRequest = HttpRequest.newBuilder(uri("/api/workspaces/1/boards/1"))
                .header("Authorization", "Bearer " + auth.accessToken())
                .GET()
                .build();

        HttpResponse<String> board = client.send(boardRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(board.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(board.body()).contains("\"boardName\":\"Planning\"");
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

}
