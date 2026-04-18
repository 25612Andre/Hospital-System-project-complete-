package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.dto.LocationDTO;
import com.example.hospitalmanagement.dto.LocationRequest;
import com.example.hospitalmanagement.dto.ResponseMessageDTO;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.service.LocationImportService;
import com.example.hospitalmanagement.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Location controller following pharmacy-management pattern.
 * Provides endpoints for CRUD, column-based filtering, and data import.
 */
@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;
    private final LocationImportService locationImportService;

    // ==================== CRUD Endpoints ====================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LocationDTO create(@Valid @RequestBody LocationRequest request) {
        return locationService.create(request);
    }

    @GetMapping("/{id}")
    public LocationDTO get(@PathVariable @NonNull Long id) {
        return locationService.get(id);
    }

    @PutMapping("/{id}")
    public LocationDTO update(@PathVariable @NonNull Long id, @Valid @RequestBody LocationRequest request) {
        return locationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NonNull Long id) {
        locationService.delete(id);
    }

    // ==================== Filtering Endpoints ====================

    /**
     * Main filtering endpoint - filter by any column (type, parentId, name, code, general query).
     * Example: /api/locations?type=DEPARTEMENT&name=Gasabo&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<LocationDTO>> list(
            @NonNull @PageableDefault(size = 20, sort = "name") Pageable pageable,
            @RequestParam(required = false) LocationType type,
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(locationService.list(pageable, type, parentId, name, code, q));
    }

    // ==================== Simple List Endpoints ====================

    @GetMapping("/all")
    public ResponseEntity<List<LocationDTO>> getAll() {
        return ResponseEntity.ok(locationService.getAll());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<LocationDTO>> byType(@PathVariable @NonNull LocationType type) {
        return ResponseEntity.ok(locationService.getByType(type));
    }

    @GetMapping("/parent/{id}")
    public ResponseEntity<List<LocationDTO>> children(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(locationService.getChildren(id));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<LocationDTO>> page(@NonNull @PageableDefault(sort = "name") Pageable pageable) {
        return ResponseEntity.ok(locationService.getPage(pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<java.util.Map<LocationType, Long>> stats() {
        return ResponseEntity.ok(locationService.getTypeStats());
    }

    // ==================== Import Endpoints ====================

     /**
     * Clear all existing locations and import fresh administrative data from locations.json.
     * WARNING: This unlinks all patients/users from their locations!
     */
    @PostMapping("/clear-and-import")
    public ResponseEntity<ResponseMessageDTO> clearAndImport() {
        LocationImportService.ImportResult result = locationImportService.clearAndImport();
        String message = "Cleared existing locations and imported " + result.processedRows() + " rows; total locations: " + result.totalLocations();
        return ResponseEntity.ok(ResponseMessageDTO.builder()
                .message(message)
                .success(true)
                .build());
    }

    /**
     * Clear all existing locations.
     */
    @PostMapping("/clear")
    public ResponseEntity<ResponseMessageDTO> clear() {
        locationImportService.clearAll();
        return ResponseEntity.ok(ResponseMessageDTO.builder()
                .message("All locations cleared")
                .success(true)
                .build());
    }

    /**
     * Import locations from JSON (only if table is empty or force=true).
     */
    @PostMapping("/import")
    public ResponseEntity<ResponseMessageDTO> importFromJson(@RequestParam(defaultValue = "false") boolean force) {
        LocationImportService.ImportResult result = locationImportService.importFromJson(force);
        String message;
        boolean success = !result.skipped();
        if (result.skipped()) {
            message = "Locations already present, import skipped.";
        } else {
            message = "Imported " + result.processedRows() + " rows; total locations: " + result.totalLocations();
        }
        return ResponseEntity.ok(ResponseMessageDTO.builder()
                .message(message)
                .success(success)
                .build());
    }
}
