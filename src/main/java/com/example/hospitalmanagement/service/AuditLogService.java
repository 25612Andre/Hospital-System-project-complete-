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
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private static final Long SYSTEM_USER_ID = 0L;
    private static final String SYSTEM_USERNAME = "system";

    private final AuditLogRepository auditLogRepository;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;

    /**
     * Create an audit log entry
     */
    @Transactional
    public AuditLogDTO createAuditLog(CreateAuditLogRequest request, HttpServletRequest httpRequest) {
        ActorContext actor = resolveActor();

        AuditLog auditLog = new AuditLog();
        auditLog.setEntityType(request.getEntityType());
        auditLog.setEntityId(resolveEntityId(request.getEntityId(), actor.userId()));
        auditLog.setAction(request.getAction());
        auditLog.setPerformedBy(actor.username());
        auditLog.setPerformedByUserId(actor.userId());
        auditLog.setReason(request.getReason());
        auditLog.setOldValue(request.getOldValue());
        auditLog.setNewValue(request.getNewValue());
        auditLog.setTimestamp(LocalDateTime.now());
        auditLog.setIpAddress(getClientIpAddress(httpRequest));
        auditLog.setAdditionalInfo(request.getAdditionalInfo());

        auditLog = auditLogRepository.save(auditLog);
        log.info("Audit log created: {} {} on {} #{} by {}", 
            request.getAction(), request.getEntityType(), request.getEntityType(), auditLog.getEntityId(), actor.username());
        
        return convertToDTO(auditLog);
    }

    /**
     * Simplified method to log an action
     */
    @Transactional
    public void logAction(EntityType entityType, Long entityId, AuditAction action, 
                         String reason, Object oldValue, Object newValue) {
        ActorContext actor = resolveActor();
        logActionAsUser(entityType, entityId, action, reason, oldValue, newValue, actor.username(), actor.userId());
    }

    @Transactional
    public void logActionAsUser(EntityType entityType, Long entityId, AuditAction action,
                                String reason, Object oldValue, Object newValue,
                                String performedBy, Long performedByUserId) {
        try {
            String oldValueJson = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newValueJson = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            AuditLog auditLog = new AuditLog();
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(resolveEntityId(entityId, performedByUserId));
            auditLog.setAction(action);
            auditLog.setPerformedBy(normalizeUsername(performedBy));
            auditLog.setPerformedByUserId(normalizeUserId(performedByUserId));
            auditLog.setReason(reason);
            auditLog.setOldValue(oldValueJson);
            auditLog.setNewValue(newValueJson);
            auditLog.setTimestamp(LocalDateTime.now());
            auditLog.setIpAddress(resolveCurrentIpAddress());

            auditLogRepository.save(auditLog);
            log.debug("Audit log created: {} {} on {} #{}", action, entityType, entityType, auditLog.getEntityId());
        } catch (JsonProcessingException e) {
            log.error("Error serializing audit log values", e);
        } catch (Exception e) {
            log.error("Error creating audit log", e);
        }
    }

    /**
     * Get all audit logs with pagination
     */
    public Page<AuditLogDTO> getAllAuditLogs(@NonNull Pageable pageable) {
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
            @NonNull Pageable pageable) {
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
    public Page<AuditLogDTO> getAuditLogsByUser(Long userId, @NonNull Pageable pageable) {
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

    private String resolveCurrentIpAddress() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return null;
        }
        return getClientIpAddress(attributes.getRequest());
    }

    private ActorContext resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : SYSTEM_USERNAME;
        String normalizedUsername = normalizeUsername(username);
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(normalizedUsername).orElse(null);
        if (user != null) {
            return new ActorContext(user.getUsername(), user.getId());
        }
        return new ActorContext(normalizedUsername, SYSTEM_USER_ID);
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank() || "anonymousUser".equalsIgnoreCase(username)) {
            return SYSTEM_USERNAME;
        }
        return username;
    }

    private Long normalizeUserId(Long userId) {
        return userId != null ? userId : SYSTEM_USER_ID;
    }

    private Long resolveEntityId(Long entityId, Long actorUserId) {
        if (entityId != null) {
            return entityId;
        }
        return normalizeUserId(actorUserId);
    }

    private record ActorContext(String username, Long userId) {}
}
