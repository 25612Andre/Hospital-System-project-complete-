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

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    @Scheduled(fixedDelayString = "${app.keepalive.interval-ms:780000}")
    public void pingBackend() {
        if (!keepAliveEnabled) {
            return;
        }

        String targetUrl = keepAliveUrl;
        if ((targetUrl == null || targetUrl.isBlank())
                && renderExternalUrl != null
                && !renderExternalUrl.isBlank()) {
            targetUrl = renderExternalUrl.endsWith("/")
                    ? renderExternalUrl + "actuator/health"
                    : renderExternalUrl + "/actuator/health";
        }
        if (targetUrl == null || targetUrl.isBlank()) {
            return;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
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
