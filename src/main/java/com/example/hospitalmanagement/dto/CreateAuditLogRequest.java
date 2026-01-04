package com.example.hospitalmanagement.dto;

import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAuditLogRequest {
    private EntityType entityType;
    private Long entityId;
    private AuditAction action;
    private String reason;
    private String oldValue;
    private String newValue;
    private String additionalInfo;
}
