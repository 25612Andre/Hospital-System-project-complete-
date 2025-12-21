package com.example.hospitalmanagement.config;

import com.example.hospitalmanagement.service.LocationImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(0)
@Profile("!test")
@ConditionalOnProperty(name = "app.location.import-on-startup", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class LocationJsonImporter implements CommandLineRunner {

    private final LocationImportService locationImportService;

    @Override
    public void run(String... args) {
        try {
            locationImportService.importFromJson(false);
        } catch (Exception ex) {
            log.error("Failed to import locations from JSON", ex);
        }
    }
}
