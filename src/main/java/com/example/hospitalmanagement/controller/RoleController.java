package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Map<String, Object>> roles = Arrays.stream(Role.values())
                .map(role -> Map.<String, Object>of("id", role.ordinal() + 1, "name", role.name()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Map<String, Object>>> getPage(@NonNull Pageable pageable) {
        List<Map<String, Object>> allRoles = Arrays.stream(Role.values())
                .map(role -> Map.<String, Object>of("id", role.ordinal() + 1, "name", role.name()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allRoles.size());
        
        List<Map<String, Object>> pageContent = List.of();
        if (start <= allRoles.size()) {
            pageContent = allRoles.subList(start, end);
        }

        return ResponseEntity.ok(new PageImpl<>(pageContent, pageable, allRoles.size()));
    }
}
