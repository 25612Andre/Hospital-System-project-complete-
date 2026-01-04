package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.dto.AuditLogDTO;
import com.example.hospitalmanagement.dto.CreateAuditLogRequest;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import com.example.hospitalmanagement.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Create a new audit log entry
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuditLogDTO> createAuditLog(
            @RequestBody CreateAuditLogRequest request,
            HttpServletRequest httpRequest) {
        AuditLogDTO auditLog = auditLogService.createAuditLog(request, httpRequest);
        return ResponseEntity.ok(auditLog);
    }

    /**
     * Get all audit logs with pagination
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogDTO> auditLogs = auditLogService.getAllAuditLogs(pageable);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Search audit logs with filters
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> searchAuditLogs(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogDTO> auditLogs = auditLogService.searchAuditLogs(
            entityType, action, userId, startDate, endDate, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get audit logs for a specific entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogsForEntity(
            @PathVariable EntityType entityType,
            @PathVariable Long entityId) {
        List<AuditLogDTO> auditLogs = auditLogService.getAuditLogsForEntity(entityType, entityId);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get audit logs by user
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getAuditLogsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogDTO> auditLogs = auditLogService.getAuditLogsByUser(userId, pageable);
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get recent activity (last 24 hours)
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogDTO>> getRecentActivity() {
        List<AuditLogDTO> auditLogs = auditLogService.getRecentActivity();
        return ResponseEntity.ok(auditLogs);
    }

    /**
     * Get audit log statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = auditLogService.getStatistics();
        return ResponseEntity.ok(stats);
    }
}
