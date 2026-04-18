package com.example.hospitalmanagement.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.repository.LocationRepository;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds Rwanda administrative hierarchy into a single self-referencing Location table.
 * Reads src/main/resources/data/location/locations.json and builds
 * PROVINCE -> DEPARTEMENT -> COMMUNE -> QUARTIER -> VILLAGE records with parent links.
 * 
 * Following pharmacy-management pattern exactly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.location.import-on-startup", havingValue = "true")
public class LocationSeeder {

    private final LocationRepository locationRepo;

    private final ObjectMapper mapper = new ObjectMapper()
            .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

    @PostConstruct
    @Transactional
    public void seed() {
        try {
            if (locationRepo.count() > 0) {
                log.info("Locations already exist. Skipping self-referencing seeding.");
                return;
            }

            log.info("Loading Rwanda location data (self-referencing Location)...");
            InputStream stream = new ClassPathResource("data/location/locations.json").getInputStream();

            List<LocationRecord> records = mapper.readValue(stream, new TypeReference<>() {});

            if (records == null || records.isEmpty()) {
                log.warn("No location data found in JSON file.");
                return;
            }

            Map<String, Location> provinces = new LinkedHashMap<>();
            Map<String, Location> departements = new LinkedHashMap<>();
            Map<String, Location> communes = new LinkedHashMap<>();
            Map<String, Location> quartiers = new LinkedHashMap<>();
            List<Location> villages = new ArrayList<>();

            int total = records.size();
            int skipped = 0;

            for (LocationRecord r : records) {
                String pCode = padLeft(normalizeDigits(r.provinceCode()), 2);
                String dCode = padLeft(normalizeDigits(r.districtCode()), 3);
                String sCode = padLeft(normalizeDigits(r.sectorCode()), 6);
                String cCode = padLeft(normalizeDigits(r.cellCode()), 8);
                String vCode = padLeft(normalizeDigits(r.villageCode()), 9);

                if (pCode == null || dCode == null || sCode == null || cCode == null || vCode == null) {
                    skipped++;
                    continue;
                }

                Location province = provinces.computeIfAbsent(pCode,
                        k -> Location.builder()
                                .code(pCode)
                                .name(safe(r.provinceName()))
                                .type(LocationType.PROVINCE)
                                .build());

                Location departement = departements.computeIfAbsent(dCode,
                        k -> Location.builder()
                                .code(dCode)
                                .name(safe(r.districtName()))
                                .type(LocationType.DEPARTEMENT)
                                .parent(province)
                                .build());
                                
                Location commune = communes.computeIfAbsent(sCode,
                        k -> Location.builder()
                                .code(sCode)
                                .name(safe(r.sectorName()))
                                .type(LocationType.COMMUNE)
                                .parent(departement)
                                .build());
                                
                Location quartier = quartiers.computeIfAbsent(cCode,
                        k -> Location.builder()
                                .code(cCode)
                                .name(safe(r.cellName()))
                                .type(LocationType.QUARTIER)
                                .parent(commune)
                                .build());

                villages.add(Location.builder()
                        .code(vCode)
                        .name(safe(r.villageName()))
                        .type(LocationType.VILLAGE)
                        .parent(quartier)
                        .build());
            }

            locationRepo.saveAll(new ArrayList<>(provinces.values()));
            locationRepo.saveAll(new ArrayList<>(departements.values()));
            locationRepo.saveAll(new ArrayList<>(communes.values()));
            locationRepo.saveAll(new ArrayList<>(quartiers.values()));
            locationRepo.saveAll(new ArrayList<>(villages));
            
            log.info("Seeded locations (self-referencing). Raw rows: {} | Skipped: {} | Provinces: {} | Departements: {} | Communes: {} | Quartiers: {} | Villages: {}",
                    total, skipped, provinces.size(), departements.size(), communes.size(), quartiers.size(), villages.size());

        } catch (Exception e) {
            log.error("Failed to seed Rwanda locations", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record LocationRecord(
            Object provinceCode,
            String provinceName,
            Object districtCode,
            String districtName,
            Object sectorCode,
            String sectorName,
            Object cellCode,
            String cellName,
            Object villageCode,
            String villageName
    ) {}

    private static String normalizeDigits(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return Long.toString(n.longValue());
        String s = o.toString().trim();
        if (s.matches("^\\d+\\.0+$")) s = s.substring(0, s.indexOf('.'));
        s = s.replaceAll("\\D", "");
        return s.isEmpty() ? null : s;
    }

    private static String padLeft(String v, int length) {
        if (v == null) return null;
        if (v.length() >= length) return v;
        return "0".repeat(length - v.length()) + v;
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }
}
