package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.LocationJsonRow;
import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationImportService {

    private final LocationRepository locationRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final LocationService locationService;

    @Value("file:target/classes/data/location/locations.json")
    private Resource locationsJson;

    @Transactional
    public ImportResult importFromJson(boolean force) {
        verifyResourceAvailable();
        long existing = locationRepository.count();
        if (!force && existing > 0) {
            log.info("Locations already present ({} rows); skipping import", existing);
            return new ImportResult(0, existing, true);
        }
        try (InputStream inputStream = locationsJson.getInputStream()) {
            List<LocationJsonRow> rows = objectMapper.readValue(inputStream, new TypeReference<>() {});
            Map<String, Location> cache = new HashMap<>();
            rows.forEach(row -> upsertHierarchy(row, cache));
            long total = locationRepository.count();
            locationService.clearPathCache();
            log.info("Imported {} location rows resulting in {} unique nodes", rows.size(), total);
            return new ImportResult(rows.size(), total, false);
        } catch (Exception ex) {
            log.error("Failed to import locations", ex);
            throw new IllegalStateException("Unable to import locations from JSON", ex);
        }
    }

    /**
     * Clear all existing locations (unlinking patients/users first) and import fresh data from locations.json.
     */
    @Transactional
    public ImportResult clearAndImport() {
        verifyResourceAvailable();
        log.info("Clearing all existing locations...");
        
        // 1. Unlink patients from locations using direct SQL (faster and avoids validation issues)
        jdbcTemplate.execute("UPDATE patients SET location_id = NULL");
        log.info("Unlinked all patients from locations");
        
        // 2. Unlink user accounts from locations using direct SQL
        jdbcTemplate.execute("UPDATE user_accounts SET location_id = NULL");
        log.info("Unlinked all users from locations");
        
        // 3. Delete all locations (break parent links first, then delete)
        jdbcTemplate.execute("UPDATE locations SET parent_id = NULL");
        jdbcTemplate.execute("DELETE FROM locations");
        log.info("Deleted all existing locations");
        
        // 4. Import fresh data
        try (InputStream inputStream = locationsJson.getInputStream()) {
            List<LocationJsonRow> rows = objectMapper.readValue(inputStream, new TypeReference<>() {});
            Map<String, Location> cache = new HashMap<>();
            rows.forEach(row -> upsertHierarchy(row, cache));
            long total = locationRepository.count();
            locationService.clearPathCache();
            log.info("Imported {} location rows resulting in {} unique nodes", rows.size(), total);
            return new ImportResult(rows.size(), total, false);
        } catch (Exception ex) {
            log.error("Failed to import locations", ex);
            throw new IllegalStateException("Unable to import locations from JSON", ex);
        }
    }

    private void verifyResourceAvailable() {
        if (locationsJson == null || !locationsJson.exists()) {
            throw new IllegalStateException("locations.json resource missing - cannot import locations");
        }
    }

    private void upsertHierarchy(LocationJsonRow row, Map<String, Location> cache) {
        Location province = ensureLocation(LocationType.PROVINCE, row.getProvinceCodeStr(), row.getProvinceName(), null, cache);
        Location district = ensureLocation(LocationType.DISTRICT, row.getDistrictCodeStr(), row.getDistrictName(), province, cache);
        Location sector = ensureLocation(LocationType.SECTOR, row.getSectorCodeStr(), row.getSectorName(), district, cache);
        Location cell = ensureLocation(LocationType.CELL, row.getCellCodeStr(), row.getCellName(), sector, cache);
        ensureLocation(LocationType.VILLAGE, row.getVillageCodeStr(), row.getVillageName(), cell, cache);
    }

    private Location ensureLocation(
            LocationType type,
            String rawCode,
            String name,
            Location parent,
            Map<String, Location> cache
    ) {
        final String normalizedCode = normalizeCode(rawCode, name, type);
        final String cacheKey = type.name() + ":" + normalizedCode.toLowerCase(Locale.ROOT);
        if (cache.containsKey(cacheKey)) {
            Location location = cache.get(cacheKey);
            attachParentIfMissing(location, parent);
            return location;
        }
        Location location = locationRepository.findByCodeIgnoreCase(normalizedCode)
                .filter(existing -> existing.getType() == type)
                .orElseGet(() -> {
                    Location created = new Location();
                    created.setCode(normalizedCode);
                    created.setName(capitalize(name));
                    created.setType(type);
                    created.setParent(parent);
                    return locationRepository.save(created);
                });
        attachParentIfMissing(location, parent);
        cache.put(cacheKey, location);
        return location;
    }

    private void attachParentIfMissing(Location location, Location parent) {
        if (parent != null && !Objects.equals(location.getParent(), parent)) {
            location.setParent(parent);
            locationRepository.save(location);
        }
    }

    private String normalizeCode(String rawCode, String name, LocationType type) {
        if (rawCode != null && !rawCode.isBlank()) {
            return rawCode.trim();
        }
        return (type.name() + "_" + name).toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
    }

    private String capitalize(String name) {
        if (name == null || name.isBlank()) {
            return "UNKNOWN";
        }
        String trimmed = name.trim();
        return trimmed.substring(0, 1).toUpperCase(Locale.ROOT) + trimmed.substring(1).toLowerCase(Locale.ROOT);
    }

    public record ImportResult(long processedRows, long totalLocations, boolean skipped) {
    }
}
