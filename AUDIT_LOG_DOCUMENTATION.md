# Audit Log & Notifications System

## Overview

The Hospital Management System now includes a comprehensive audit logging and notifications system that tracks all critical operations performed by users. This system records who performed what actions, when they were performed, and why.

## Features

### 1. **Comprehensive Tracking**
The system tracks the following operations:
- **CREATE**: New records created (users, appointments, bills, patients, doctors)
- **UPDATE**: Modifications to existing records
- **DELETE**: Record deletions
- **APPROVE**: Appointment approvals by doctors
- **REJECT**: Appointment rejections
- **LOGIN/LOGOUT**: User authentication events

### 2. **Entity Types Tracked**
- User Accounts
- Appointments
- Bills
- Patients
- Doctors
- Departments
- Locations

### 3. **Audit Information Captured**
For each action, the system records:
- **Entity Type**: What kind of record was affected
- **Entity ID**: The specific record ID
- **Action**: What operation was performed
- **Performed By**: Username of the person who performed the action
- **Performed By User ID**: User ID for reference
- **Reason**: Why the action was performed (when applicable)
- **Old Value**: JSON representation of the record before changes (for updates/deletes)
- **New Value**: JSON representation of the record after changes (for creates/updates)
- **Timestamp**: When the action occurred
- **IP Address**: From which IP address the action was performed
- **Additional Info**: Any extra contextual information

## Backend Implementation

### Database Schema

The audit logs are stored in the `audit_logs` table with the following structure:

```sql
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    performed_by_user_id BIGINT NOT NULL,
    reason TEXT,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    additional_info TEXT,
    -- Indexes for efficient querying
    INDEX idx_entity_type_id (entity_type, entity_id),
    INDEX idx_performed_by (performed_by_user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
);
```

### API Endpoints

All endpoints are under `/api/audit-logs` and require ADMIN or MANAGER role:

#### Get All Audit Logs (Paginated)
```
GET /api/audit-logs?page=0&size=20
```

#### Search with Filters
```
GET /api/audit-logs/search?entityType=APPOINTMENT&action=DELETE&startDate=2025-01-01T00:00:00&endDate=2025-12-31T23:59:59
```

Query Parameters:
- `entityType`: Filter by entity type (USER_ACCOUNT, APPOINTMENT, BILL, etc.)
- `action`: Filter by action (CREATE, UPDATE, DELETE, etc.)
- `userId`: Filter by user who performed the action
- `startDate`: Filter by start date (ISO 8601 format)
- `endDate`: Filter by end date (ISO 8601 format)
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)

#### Get Audit Logs for Specific Entity
```
GET /api/audit-logs/entity/{entityType}/{entityId}
```

Example: `GET /api/audit-logs/entity/APPOINTMENT/123`

#### Get Audit Logs by User
```
GET /api/audit-logs/user/{userId}?page=0&size=20
```

#### Get Recent Activity (Last 24 Hours)
```
GET /api/audit-logs/recent
```

#### Get Statistics
```
GET /api/audit-logs/statistics
```

Returns:
```json
{
  "byAction": {
    "CREATE": 150,
    "UPDATE": 89,
    "DELETE": 12
  },
  "byEntityType": {
    "APPOINTMENT": 120,
    "USER_ACCOUNT": 45,
    "BILL": 86
  },
  "totalLogs": 251,
  "last24Hours": 34
}
```

### Service Integration

To add audit logging to a service, inject `AuditLogService` and call `logAction`:

```java
@Service
@RequiredArgsConstructor
public class YourService {
    private final AuditLogService auditLogService;
    
    @Transactional
    public YourEntity update(Long id, UpdateRequest request) {
        YourEntity existing = getById(id);
        YourEntity oldState = // create copy of existing
        
        // Perform update
        existing.setSomeField(request.getSomeField());
        YourEntity updated = repository.save(existing);
        
        // Log the action
        auditLogService.logAction(
            EntityType.YOUR_ENTITY,
            updated.getId(),
            AuditAction.UPDATE,
            "Reason for the update",
            oldState,
            updated
        );
        
        return updated;
    }
}
```

## Frontend Implementation

### Accessing the Audit Report

1. **Login as Admin**: Only users with ADMIN role can access the audit logs
2. **Navigate to "Audit Logs"**: Click on "Audit Logs" in the sidebar menu
3. **View the Report**: The page displays:
   - Statistics cards showing total logs, recent activity, creates, and deletes
   - Filter controls for entity type, action, and date range
   - Detailed table with all audit log entries

### Features of the Audit Report Page

#### Statistics Dashboard
- **Total Logs**: Total number of audit entries
- **Last 24 Hours**: Recent activity count
- **Creates**: Number of creation operations
- **Deletes**: Number of deletion operations

#### Advanced Filtering
- Filter by **Entity Type** (Appointments, Users, Bills, etc.)
- Filter by **Action** (Create, Update, Delete, etc.)
- Filter by **Date Range** (Start and End dates)
- **Clear Filters** button to reset all filters
- **Refresh** button to reload data

#### Audit Log Table
Displays the following columns:
- **Timestamp**: When the action occurred
- **Action**: Type of operation (color-coded badges)
- **Entity**: What type of record and its ID
- **Performed By**: User who performed the action (with avatar)
- **Reason**: Why the action was performed
- **IP Address**: Source IP address

#### Color Coding
- **Green**: CREATE operations
- **Blue**: UPDATE operations
- **Red**: DELETE operations
- **Emerald**: APPROVE operations
- **Orange**: REJECT operations
- **Purple**: LOGIN operations
- **Gray**: LOGOUT operations

## Use Cases

### 1. Track Deleted Records
**Scenario**: An appointment was deleted and you need to know who deleted it and why.

**Solution**:
1. Go to Audit Logs page
2. Filter by Entity Type: "APPOINTMENT"
3. Filter by Action: "DELETE"
4. Review the results to see who deleted which appointments and their reasons

### 2. Monitor User Changes
**Scenario**: You want to see all changes made by a specific user.

**Solution**:
1. Use the API endpoint: `GET /api/audit-logs/user/{userId}`
2. Or filter the audit logs page and look for the specific username

### 3. Compliance Reporting
**Scenario**: Generate a report of all changes in a specific time period.

**Solution**:
1. Go to Audit Logs page
2. Set Start Date and End Date filters
3. Export or review the filtered results

### 4. Investigate Appointment Status Changes
**Scenario**: Track when an appointment was approved or rejected.

**Solution**:
1. Filter by Entity Type: "APPOINTMENT"
2. Filter by Action: "APPROVE" or "REJECT"
3. Review the reason field for why the action was taken

## Security Considerations

1. **Access Control**: Only ADMIN users can view audit logs
2. **Immutable Records**: Audit logs cannot be modified or deleted through the API
3. **Automatic Logging**: All critical operations are automatically logged
4. **IP Tracking**: Source IP addresses are recorded for security analysis
5. **User Context**: The system automatically captures the authenticated user's information

## Best Practices

### When to Provide a Reason
Always provide meaningful reasons when:
- Deleting records
- Rejecting appointments
- Making significant updates
- Changing user roles or permissions

### Example Reasons
- ✅ "Patient requested cancellation via phone"
- ✅ "Doctor unavailable due to emergency"
- ✅ "Duplicate entry - keeping record #456"
- ✅ "Updated per patient's email request"
- ❌ "Update" (too vague)
- ❌ "Delete" (not informative)

## Future Enhancements

Potential improvements to consider:
1. **Email Notifications**: Send alerts for critical actions
2. **Audit Log Export**: Export to CSV/PDF for compliance
3. **Real-time Dashboard**: Live updates of system activity
4. **Anomaly Detection**: Alert on suspicious patterns
5. **Retention Policies**: Automatic archival of old logs
6. **User Activity Reports**: Detailed per-user activity summaries

## Troubleshooting

### Audit Logs Not Appearing
1. Ensure the database migration `V9__create_audit_logs.sql` has run
2. Check that `AuditLogService` is properly injected in services
3. Verify the user performing actions is authenticated

### Performance Issues
1. Use the indexed fields (entity_type, performed_by_user_id, timestamp) in queries
2. Implement pagination for large result sets
3. Consider archiving old audit logs

### Missing Audit Entries
1. Ensure `logAction()` is called after successful operations
2. Check for exceptions in the audit logging code
3. Verify transaction boundaries are correct

## API Examples

### cURL Examples

#### Get all audit logs
```bash
curl -X GET "http://localhost:8080/api/audit-logs?page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search for deleted appointments
```bash
curl -X GET "http://localhost:8080/api/audit-logs/search?entityType=APPOINTMENT&action=DELETE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get statistics
```bash
curl -X GET "http://localhost:8080/api/audit-logs/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/TypeScript Examples

```typescript
import { auditLogApi, EntityType, AuditAction } from './api/auditLogApi';

// Get all audit logs
const logs = await auditLogApi.listPage({ page: 0, size: 20 });

// Search for specific actions
const deletedAppointments = await auditLogApi.search({
  entityType: EntityType.APPOINTMENT,
  action: AuditAction.DELETE,
  startDate: '2025-01-01T00:00:00',
  endDate: '2025-12-31T23:59:59'
});

// Get statistics
const stats = await auditLogApi.getStatistics();
console.log(`Total logs: ${stats.totalLogs}`);
console.log(`Last 24 hours: ${stats.last24Hours}`);
```

## Conclusion

The audit logging system provides comprehensive tracking and accountability for all critical operations in the Hospital Management System. It ensures compliance, enables investigation of issues, and provides transparency in system usage.

For questions or issues, please contact the development team.
