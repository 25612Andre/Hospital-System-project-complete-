package com.example.hospitalmanagement.model;

import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntityType entityType;

    @Column(nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(nullable = false)
    private String performedBy; // Username of the user who performed the action

    @Column(nullable = false)
    private Long performedByUserId; // User ID who performed the action

    @Column(columnDefinition = "TEXT")
    private String reason; // Why the action was performed

    @Column(columnDefinition = "TEXT")
    private String oldValue; // JSON representation of old state (for updates/deletes)

    @Column(columnDefinition = "TEXT")
    private String newValue; // JSON representation of new state (for creates/updates)

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 45)
    private String ipAddress; // IP address from which the action was performed

    @Column(columnDefinition = "TEXT")
    private String additionalInfo; // Any additional contextual information
}
