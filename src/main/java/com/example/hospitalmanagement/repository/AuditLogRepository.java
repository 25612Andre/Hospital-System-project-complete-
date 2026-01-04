package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.AuditLog;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Find all audit logs for a specific entity
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(EntityType entityType, Long entityId);

    // Find all audit logs by a specific user
    Page<AuditLog> findByPerformedByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);

    // Find all audit logs for a specific action
    Page<AuditLog> findByActionOrderByTimestampDesc(AuditAction action, Pageable pageable);

    // Find all audit logs for a specific entity type
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(EntityType entityType, Pageable pageable);

    // Find audit logs within a date range
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // Find all audit logs (paginated)
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    // Complex search query
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(CAST(:entityType AS string) IS NULL OR a.entityType = :entityType) AND " +
           "(CAST(:action AS string) IS NULL OR a.action = :action) AND " +
           "(CAST(:userId AS long) IS NULL OR a.performedByUserId = :userId) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR a.timestamp >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR a.timestamp <= :endDate) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> searchAuditLogs(
        @Param("entityType") EntityType entityType,
        @Param("action") AuditAction action,
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    // Count logs by action
    @Query("SELECT a.action, COUNT(a) FROM AuditLog a GROUP BY a.action")
    List<Object[]> countByAction();

    // Count logs by entity type
    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a GROUP BY a.entityType")
    List<Object[]> countByEntityType();

    // Recent activity (last 24 hours)
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp >= :since ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentActivity(@Param("since") LocalDateTime since);
}
