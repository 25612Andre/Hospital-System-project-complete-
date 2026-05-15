package com.example.hospitalmanagement.config;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RenderKeepAliveScheduler {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.keepalive.enabled:false}")
    private boolean keepAliveEnabled;

    @Value("${app.keepalive.url:}")
    private String keepAliveUrl;

    @Scheduled(fixedDelayString = "${app.keepalive.interval-ms:780000}")
    public void pingBackend() {
        if (!keepAliveEnabled || keepAliveUrl == null || keepAliveUrl.isBlank()) {
            return;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keepAliveUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 400) {
                log.warn("Keepalive ping failed with status {}", response.statusCode());
            }
        } catch (Exception ex) {
            log.warn("Keepalive ping failed: {}", ex.getMessage());
        }
    }
}
