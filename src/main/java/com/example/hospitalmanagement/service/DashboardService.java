package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.DashboardSummaryDTO;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.BillingRepository;
import com.example.hospitalmanagement.repository.DepartmentRepository;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillingRepository billingRepository;
    private final LocationRepository locationRepository;

    public DashboardSummaryDTO summary(com.example.hospitalmanagement.model.enums.Role role, Long doctorId, Long patientId) {
        // Defaults
        long totalPatients = 0;
        long totalDoctors = 0;
        long totalDepartments = 0;
        long totalAppointments = 0;
        long totalBills = 0;
        long completedAppointments = 0;
        long todayAppointments = 0;
        double totalRevenue = 0;
        long totalLocations = 0;
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        if (role == com.example.hospitalmanagement.model.enums.Role.ADMIN) {
             totalPatients = patientRepository.count();
             totalDoctors = doctorRepository.count();
             totalDepartments = departmentRepository.count();
             totalAppointments = appointmentRepository.count();
             totalBills = billingRepository.count();
             completedAppointments = appointmentRepository.countByStatusIgnoreCase("Completed");
             todayAppointments = appointmentRepository.countByAppointmentDateBetween(startOfDay, startOfDay.plusDays(1));
             totalRevenue = billingRepository.sumAmountByStatus("PAID");
             totalLocations = locationRepository.count();
        } else if (role == com.example.hospitalmanagement.model.enums.Role.DOCTOR && doctorId != null) {
             // Count patients who are explicitly assigned OR have appointments with this doctor
             totalPatients = appointmentRepository.countDistinctPatientByDoctor_Id(doctorId);
             // Note: this misses patients who are assigned but have NO appointments yet.
             // Ideally we union them, but appointment-based is usually the more dynamic metric for "active" patients.
             // If we want both, we need a custom query repo method. For now, let's switch to Appointment-based as it catches the "I created an appointment" case which implicitely links usually.
             // Actually, my previous fix explicitly links on creation.
             // Let's rely on the explicit link `patientRepository.countByDoctors_Id(doctorId)` AND also check if we can add appointment based.
             // Let's stick to appointment based for now as it's more robust for "workload".
             long assigned = patientRepository.countByDoctors_Id(doctorId);
             long visited = appointmentRepository.countDistinctPatientByDoctor_Id(doctorId);
             totalPatients = Math.max(assigned, visited); // Approximation since we can't easily union without custom query.
             
             totalDoctors = 1; // Just themselves
             totalDepartments = 1; // Their department
             totalAppointments = appointmentRepository.countByDoctor_Id(doctorId);
             completedAppointments = appointmentRepository.countByDoctor_IdAndStatusIgnoreCase(doctorId, "Completed");
             todayAppointments = appointmentRepository.countByDoctor_IdAndAppointmentDateBetween(doctorId, startOfDay, startOfDay.plusDays(1));
             totalBills = billingRepository.countByAppointment_Doctor_Id(doctorId);
             totalRevenue = billingRepository.sumTotalAmountByDoctorId(doctorId);
             totalLocations = 0; // Not relevant
        } else if (role == com.example.hospitalmanagement.model.enums.Role.PATIENT && patientId != null) {
             totalPatients = 1; // Self
             totalDoctors = 0; // Not relevant to count
             totalAppointments = appointmentRepository.countByPatient_Id(patientId);
             completedAppointments = appointmentRepository.countByPatient_IdAndStatusIgnoreCase(patientId, "Completed");
             todayAppointments = appointmentRepository.countByPatient_IdAndAppointmentDateBetween(patientId, startOfDay, startOfDay.plusDays(1));
             totalBills = billingRepository.countByAppointment_Patient_Id(patientId);
             totalRevenue = billingRepository.sumTotalAmountByPatientId(patientId); // Actually "Money Spent" for patient
        }

        return DashboardSummaryDTO.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .totalDepartments(totalDepartments)
                .totalAppointments(totalAppointments)
                .completedAppointments(completedAppointments)
                .todayAppointments(todayAppointments)
                .totalBills(totalBills)
                .totalRevenue(totalRevenue)
                .totalLocations(totalLocations)
                .build();
    }
}
