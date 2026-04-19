import httpClient from "./httpClient";
import type { PagedResult } from "./personApi";

export const EntityType = {
    USER_ACCOUNT: "USER_ACCOUNT",
    APPOINTMENT: "APPOINTMENT",
    BILL: "BILL",
    PATIENT: "PATIENT",
    DOCTOR: "DOCTOR",
    DEPARTMENT: "DEPARTMENT",
    LOCATION: "LOCATION",
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

export const AuditAction = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    APPROVE: "APPROVE",
    REJECT: "REJECT",
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    PAYMENT: "PAYMENT",
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export interface AuditLog {
    id: number;
    entityType: EntityType;
    entityId: number;
    action: AuditAction;
    performedBy: string;
    performedByUserId: number;
    reason?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
    ipAddress?: string;
    additionalInfo?: string;
}

export interface CreateAuditLogRequest {
    entityType: EntityType;
    entityId: number;
    action: AuditAction;
    reason?: string;
    oldValue?: string;
    newValue?: string;
    additionalInfo?: string;
}

export interface AuditLogSearchParams {
    entityType?: EntityType;
    action?: AuditAction;
    userId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
}

export interface AuditLogStatistics {
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    totalLogs: number;
    last24Hours: number;
}

export const auditLogApi = {
    /**
     * Get all audit logs with pagination
     */
    listPage: async (params?: { page?: number; size?: number }) => {
        const { data } = await httpClient.get<PagedResult<AuditLog>>("/audit-logs", {
            params,
        });
        return data;
    },

    /**
     * Search audit logs with filters
     */
    search: async (params: AuditLogSearchParams) => {
        const { data } = await httpClient.get<PagedResult<AuditLog>>("/audit-logs/search", {
            params,
        });
        return data;
    },

    /**
     * Get audit logs for a specific entity
     */
    getForEntity: async (entityType: EntityType, entityId: number) => {
        const { data } = await httpClient.get<AuditLog[]>(
            `/audit-logs/entity/${entityType}/${entityId}`
        );
        return data;
    },

    /**
     * Get audit logs by user
     */
    getByUser: async (userId: number, params?: { page?: number; size?: number }) => {
        const { data } = await httpClient.get<PagedResult<AuditLog>>(
            `/audit-logs/user/${userId}`,
            { params }
        );
        return data;
    },

    /**
     * Get recent activity (last 24 hours)
     */
    getRecent: async () => {
        const { data } = await httpClient.get<AuditLog[]>("/audit-logs/recent");
        return data;
    },

    /**
     * Get audit log statistics
     */
    getStatistics: async () => {
        const { data } = await httpClient.get<AuditLogStatistics>("/audit-logs/statistics");
        return data;
    },

    /**
     * Create a new audit log entry
     */
    create: async (payload: CreateAuditLogRequest) => {
        const { data } = await httpClient.post<AuditLog>("/audit-logs", payload);
        return data;
    },
};
