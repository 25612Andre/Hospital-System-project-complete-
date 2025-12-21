package com.example.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DashboardSummaryDTO {
    long totalPatients;
    long totalDoctors;
    long totalDepartments;
    long totalAppointments;
    long todayAppointments;
    long completedAppointments;
    long totalBills;
    double totalRevenue;
    long totalLocations;
}
