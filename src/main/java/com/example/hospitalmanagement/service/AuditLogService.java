package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.AuditLogDTO;
import com.example.hospitalmanagement.dto.CreateAuditLogRequest;
import com.example.hospitalmanagement.model.AuditLog;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import com.example.hospitalmanagement.repository.AuditLogRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    /**
     * Create an audit log entry
     */
    @Transactional
    public AuditLogDTO createAuditLog(CreateAuditLogRequest request, HttpServletRequest httpRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "system";
        
        UserAccount user = userAccountRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));

        AuditLog auditLog = AuditLog.builder()
            .entityType(request.getEntityType())
            .entityId(request.getEntityId())
            .action(request.getAction())
            .performedBy(username)
            .performedByUserId(user.getId())
            .reason(request.getReason())
            .oldValue(request.getOldValue())
            .newValue(request.getNewValue())
            .timestamp(LocalDateTime.now())
            .ipAddress(getClientIpAddress(httpRequest))
            .additionalInfo(request.getAdditionalInfo())
            .build();

        auditLog = auditLogRepository.save(auditLog);
        log.info("Audit log created: {} {} on {} #{} by {}", 
            request.getAction(), request.getEntityType(), request.getEntityType(), request.getEntityId(), username);
        
        return convertToDTO(auditLog);
    }

    /**
     * Simplified method to log an action
     */
    @Transactional
    public void logAction(EntityType entityType, Long entityId, AuditAction action, 
                         String reason, Object oldValue, Object newValue) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "system";
            
            UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
            if (user == null) {
                log.warn("Cannot create audit log: user not found");
                return;
            }

            String oldValueJson = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newValueJson = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(username)
                .performedByUserId(user.getId())
                .reason(reason)
                .oldValue(oldValueJson)
                .newValue(newValueJson)
                .timestamp(LocalDateTime.now())
                .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} {} on {} #{}", action, entityType, entityType, entityId);
        } catch (JsonProcessingException e) {
            log.error("Error serializing audit log values", e);
        } catch (Exception e) {
            log.error("Error creating audit log", e);
        }
    }

    /**
     * Get all audit logs with pagination
     */
    public Page<AuditLogDTO> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
            .map(this::convertToDTO);
    }

    /**
     * Search audit logs with filters
     */
    public Page<AuditLogDTO> searchAuditLogs(
            EntityType entityType,
            AuditAction action,
            Long userId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        return auditLogRepository.searchAuditLogs(entityType, action, userId, startDate, endDate, pageable)
            .map(this::convertToDTO);
    }

    /**
     * Get audit logs for a specific entity
     */
    public List<AuditLogDTO> getAuditLogsForEntity(EntityType entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get audit logs by user
     */
    public Page<AuditLogDTO> getAuditLogsByUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByPerformedByUserIdOrderByTimestampDesc(userId, pageable)
            .map(this::convertToDTO);
    }

    /**
     * Get recent activity (last 24 hours)
     */
    public List<AuditLogDTO> getRecentActivity() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return auditLogRepository.findRecentActivity(since)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Count by action
        Map<String, Long> actionCounts = new HashMap<>();
        auditLogRepository.countByAction().forEach(row -> {
            actionCounts.put(row[0].toString(), (Long) row[1]);
        });
        stats.put("byAction", actionCounts);

        // Count by entity type
        Map<String, Long> entityCounts = new HashMap<>();
        auditLogRepository.countByEntityType().forEach(row -> {
            entityCounts.put(row[0].toString(), (Long) row[1]);
        });
        stats.put("byEntityType", entityCounts);

        // Total count
        stats.put("totalLogs", auditLogRepository.count());

        // Recent activity count
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        stats.put("last24Hours", auditLogRepository.findRecentActivity(since).size());

        return stats;
    }

    /**
     * Convert entity to DTO
     */
    private AuditLogDTO convertToDTO(AuditLog auditLog) {
        return AuditLogDTO.builder()
            .id(auditLog.getId())
            .entityType(auditLog.getEntityType())
            .entityId(auditLog.getEntityId())
            .action(auditLog.getAction())
            .performedBy(auditLog.getPerformedBy())
            .performedByUserId(auditLog.getPerformedByUserId())
            .reason(auditLog.getReason())
            .oldValue(auditLog.getOldValue())
            .newValue(auditLog.getNewValue())
            .timestamp(auditLog.getTimestamp())
            .ipAddress(auditLog.getIpAddress())
            .additionalInfo(auditLog.getAdditionalInfo())
            .build();
    }

    /**
     * Get client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
