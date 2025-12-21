package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.LocationDTO;
import com.example.hospitalmanagement.dto.LocationRequest;
import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.repository.LocationRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Location service following pharmacy-management pattern.
 * Uses JPA Specifications for dynamic column-based filtering.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class LocationService {

    private final LocationRepository repository;

    // ==================== CRUD Operations ====================

    public LocationDTO create(LocationRequest request) {
        validate(request, true);
        Location parent = resolveParent(request.getParentId());

        Location location = Objects.requireNonNull(Location.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .type(request.getType())
                .parent(parent)
                .build());

        Location saved = repository.save(location);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public LocationDTO get(@NonNull Long id) {
        Location loc = Objects.requireNonNull(repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found with ID: " + id)));
        return toDto(loc);
    }

    public LocationDTO update(@NonNull Long id, LocationRequest request) {
        validate(request, false);
        Location location = Objects.requireNonNull(repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found with ID: " + id)));

        Location parent = resolveParent(request.getParentId());
        location.setCode(request.getCode().trim());
        location.setName(request.getName().trim());
        location.setType(request.getType());
        location.setParent(parent);

        return toDto(repository.save(location));
    }

    public void delete(@NonNull Long id) {
        Location location = Objects.requireNonNull(repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found with ID: " + id)));
        repository.delete(location);
    }

    // ==================== Specification-based Filtering ====================

    private static class LocationSpecifications {
        public static Specification<Location> hasType(LocationType type) {
            return (root, query, cb) -> cb.equal(root.get("type"), type);
        }

        public static Specification<Location> hasParentId(Long parentId) {
            return (root, query, cb) -> cb.equal(root.get("parent").get("id"), parentId);
        }

        public static Specification<Location> nameContains(String term) {
            return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + term.toLowerCase() + "%");
        }

        public static Specification<Location> codeContains(String term) {
            return (root, query, cb) -> cb.like(cb.lower(root.get("code")), "%" + term.toLowerCase() + "%");
        }

        public static Specification<Location> matchesQuery(String term) {
            return (root, query, cb) -> {
                String like = "%" + term.toLowerCase() + "%";
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.like(cb.lower(root.get("name")), like));
                predicates.add(cb.like(cb.lower(root.get("code")), like));
                predicates.add(cb.like(cb.lower(root.get("type").as(String.class)), like));
                try {
                    Long id = Long.parseLong(term);
                    predicates.add(cb.equal(root.get("id"), id));
                    predicates.add(cb.equal(root.get("parent").get("id"), id));
                } catch (NumberFormatException ex) {
                    // ignore non-numeric
                }
                return cb.or(predicates.toArray(new Predicate[0]));
            };
        }
    }

    /**
     * List locations with optional filters for every column (type, parentId, name, code, general query).
     * This is the main filtering method following pharmacy-management pattern.
     */
    @Transactional(readOnly = true)
    public Page<LocationDTO> list(@NonNull Pageable pageable, LocationType type, Long parentId, String name, String code, String q) {
        String trimmedName = name != null && !name.isBlank() ? name.trim() : null;
        String trimmedCode = code != null && !code.isBlank() ? code.trim() : null;
        String qTerm = q != null && !q.isBlank() ? q.trim() : null;

        Specification<Location> spec = Specification.where(null);
        if (qTerm != null) {
            spec = spec.and(LocationSpecifications.matchesQuery(qTerm));
        }
        if (trimmedName != null) {
            spec = spec.and(LocationSpecifications.nameContains(trimmedName));
        }
        if (trimmedCode != null) {
            spec = spec.and(LocationSpecifications.codeContains(trimmedCode));
        }
        if (type != null) {
            spec = spec.and(LocationSpecifications.hasType(type));
        }
        if (parentId != null) {
            spec = spec.and(LocationSpecifications.hasParentId(parentId));
        }

        return repository.findAll(spec, pageable).map(this::toDto);
    }

    // ==================== Simple List Methods ====================

    @Transactional(readOnly = true)
    public List<LocationDTO> getAll() {
        return repository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LocationDTO> getByType(@NonNull LocationType type) {
        return repository.findByType(type).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LocationDTO> getChildren(@NonNull Long parentId) {
        return repository.findByParentId(parentId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Page<LocationDTO> getPage(Pageable pageable) {
        return repository.findAll(pageable).map(this::toDto);
    }

    // ==================== Location Entity Methods (for other services) ====================

    /**
     * Get a Location entity by ID (not DTO).
     */
    @Transactional(readOnly = true)
    public Location getLocationById(@NonNull Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found with ID: " + id));
    }

    /**
     * Find location by type and code, or throw exception.
     */
    @Transactional(readOnly = true)
    public Location requireByTypeAndCode(@NonNull LocationType type, @NonNull String code) {
        return repository.findByTypeAndCodeIgnoreCase(type, code)
                .orElseThrow(() -> new RuntimeException(type + " with code " + code + " not found"));
    }

    /**
     * Find location by type and name, or throw exception.
     */
    @Transactional(readOnly = true)
    public Location requireByTypeAndName(@NonNull LocationType type, @NonNull String name) {
        return repository.findByTypeAndNameIgnoreCase(type, name)
                .orElseThrow(() -> new RuntimeException(type + " " + name + " not found"));
    }

    /**
     * Get all descendant IDs of a location (including itself).
     */
    @Transactional(readOnly = true)
    public List<Long> collectDescendantIds(@NonNull Location root) {
        List<Long> result = new java.util.ArrayList<>();
        java.util.Deque<Location> stack = new java.util.ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            Location current = stack.pop();
            result.add(current.getId());
            repository.findByParentId(current.getId()).forEach(stack::push);
        }
        return result;
    }

    // ==================== Helper Methods ====================

    private Location resolveParent(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return repository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent location not found with ID: " + parentId));
    }

    private LocationDTO toDto(Location loc) {
        Long parentId = Optional.ofNullable(loc.getParent()).map(Location::getId).orElse(null);
        String parentName = Optional.ofNullable(loc.getParent()).map(Location::getName).orElse(null);
        return LocationDTO.builder()
                .id(loc.getId())
                .code(loc.getCode())
                .name(loc.getName())
                .type(loc.getType())
                .parentId(parentId)
                .parentName(parentName)
                .path(buildPath(loc))
                .build();
    }

    /**
     * Build the full path for a location (e.g., "Kigali > Gasabo > Kimironko").
     */
    public String buildPath(Location loc) {
        List<String> parts = new ArrayList<>();
        Location cursor = loc;
        while (cursor != null) {
            parts.add(0, cursor.getName());
            cursor = cursor.getParent();
        }
        return String.join(" > ", parts);
    }

    private void validate(LocationRequest request, boolean creating) {
        if (request == null) {
            throw new IllegalArgumentException("Location request cannot be null");
        }
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Code is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Type is required");
        }
        if (creating && repository.existsByCode(request.getCode().trim())) {
            throw new IllegalArgumentException("Location code already exists: " + request.getCode());
        }
    }
}
