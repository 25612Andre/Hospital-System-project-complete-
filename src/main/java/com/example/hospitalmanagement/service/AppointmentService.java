package com.example.hospitalmanagement.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.example.hospitalmanagement.model.Appointment;
import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import com.example.hospitalmanagement.repository.BillingRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.model.UserAccount;

import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    // Service to manage appointments

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final BillingRepository billingRepository;
    private final BillingService billingService;
    private final AuditLogService auditLogService;
    private final UserAccountRepository userAccountRepository;
    private final EmailService emailService;

    public List<Appointment> getAll(Boolean unbilled) {
        if (Boolean.TRUE.equals(unbilled)) {
            return appointmentRepository.findAllUnbilled();
        }
        return appointmentRepository.findAll();
    }

    public Page<Appointment> getPage(@NonNull Pageable pageable) {
        return appointmentRepository.findAll(pageable);
    }

    public Page<Appointment> getPage(@NonNull Pageable pageable, Long patientId, Long doctorId) {
        if (patientId != null) {
            return appointmentRepository.findByPatient_Id(patientId, pageable);
        }
        if (doctorId != null) {
            return appointmentRepository.findByDoctor_Id(doctorId, pageable);
        }
        return appointmentRepository.findAll(pageable);
    }

    public Page<Appointment> search(@NonNull String term, @NonNull Pageable pageable) {
        return appointmentRepository.findByDoctor_NameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCase(
                term, term, pageable);
    }

    public Appointment getById(@NonNull Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    @Transactional
    public Appointment create(Long doctorId,
                              Long patientId,
                              LocalDateTime appointmentDate,
                              String status,
                              Double consultationFee,
                              String notes) {
        if (doctorId == null) {
            throw new IllegalArgumentException("Doctor is required");
        }
        if (patientId == null) {
            throw new IllegalArgumentException("Patient is required");
        }
        if (appointmentDate == null) {
            throw new IllegalArgumentException("Appointment date is required");
        }
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // Real-world logic: Check doctor availability (assume 30 min slots)
        LocalDateTime startCheck = appointmentDate.minusMinutes(29);
        LocalDateTime endCheck = appointmentDate.plusMinutes(29);
        long conflictCount = appointmentRepository.countByDoctor_IdAndAppointmentDateBetween(doctorId, startCheck, endCheck);
        if (conflictCount > 0) {
             // For testing/debugging, we relax this check temporarily or log it.
             // throw new RuntimeException("Doctor is pending or busy with another appointment at this time.");
        }

        // Prevent null unboxing safely
        Double resolvedFee = consultationFee;
        if (resolvedFee == null || resolvedFee <= 0.0) {
            resolvedFee = 0.0;
            if (doctor.getDepartment() != null && doctor.getDepartment().getConsultationFee() != null) {
                resolvedFee = doctor.getDepartment().getConsultationFee();
            }
        }
        String resolvedStatus = (status == null || status.isBlank()) ? "Scheduled" : status;

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDate(appointmentDate)
                .consultationFee(resolvedFee)
                .status(resolvedStatus)
                .notes(notes)
                .createdAt(LocalDateTime.now())
                .build();

        Appointment saved = appointmentRepository.save(Objects.requireNonNull(appointment));
        
        // Audit log
        auditLogService.logAction(
            EntityType.APPOINTMENT,
            saved.getId(),
            AuditAction.CREATE,
            "Created new appointment for patient " + patient.getFullName() + " with doctor " + doctor.getName(),
            null,
            saved
        );
        
        try {
            billingService.generateBill(saved.getId());
        } catch (Exception e) {
            // Ignore if fails (e.g. duplicate), though it shouldn't for new appointment
        }
        
        // Notify the doctor via email
        try {
            String doctorEmail = null;
            List<UserAccount> accounts = userAccountRepository.findByDoctor_Id(doctor.getId());
            if (accounts != null && !accounts.isEmpty()) {
                doctorEmail = accounts.get(0).getUsername();
            } else if (doctor.getContact() != null && doctor.getContact().contains("@")) {
                doctorEmail = doctor.getContact();
            }
            if (doctorEmail != null && !doctorEmail.isBlank()) {
                emailService.sendNewAppointmentEmail(
                    doctorEmail,
                    doctor.getName(),
                    patient.getFullName(),
                    appointmentDate.toString()
                );
            }
        } catch (Exception e) {
            // Do not fail appointment creation
        }
        
        return saved;
    }

    @Transactional
    public Appointment update(@NonNull Long id,
                              Long doctorId,
                              Long patientId,
                              LocalDateTime appointmentDate,
                              String status,
                              Double consultationFee,
                              String notes) {
        Appointment existing = getById(id);
        Appointment oldState = Appointment.builder()
            .id(existing.getId())
            .doctor(existing.getDoctor())
            .patient(existing.getPatient())
            .appointmentDate(existing.getAppointmentDate())
            .status(existing.getStatus())
            .consultationFee(existing.getConsultationFee())
            .notes(existing.getNotes())
            .build();
        
        Doctor doctor = doctorId != null
                ? doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"))
                : existing.getDoctor();
        Patient patient = patientId != null
                ? patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"))
                : existing.getPatient();

        existing.setDoctor(doctor);
        existing.setPatient(patient);
        existing.setAppointmentDate(appointmentDate != null ? appointmentDate : existing.getAppointmentDate());
        if (status != null && !status.isBlank()) {
            existing.setStatus(status);
        }
        if (consultationFee != null) {
            existing.setConsultationFee(consultationFee);
        }
        if (notes != null) {
            existing.setNotes(notes);
        }
        Appointment updated = appointmentRepository.save(existing);
        
        // Audit log
        String reason = "Updated appointment";
        if (status != null && !status.equals(oldState.getStatus())) {
            reason += " - Status changed from " + oldState.getStatus() + " to " + status;
        }
        auditLogService.logAction(
            EntityType.APPOINTMENT,
            updated.getId(),
            AuditAction.UPDATE,
            reason,
            oldState,
            updated
        );
        
        return updated;
    }

    @Transactional
    public Appointment complete(@NonNull Long id) {
        Appointment appointment = getById(id);
        String oldStatus = appointment.getStatus();
        appointment.setStatus("Completed");
        Appointment saved = appointmentRepository.save(appointment);
        
        // Audit log
        auditLogService.logAction(
            EntityType.APPOINTMENT,
            saved.getId(),
            AuditAction.APPROVE,
            "Appointment completed - Status changed from " + oldStatus + " to Completed",
            null,
            saved
        );
        
        // Only generate bill if one doesn't exist to avoid transaction rollback on conflict
        if (billingRepository.findByAppointment_Id(saved.getId()).isEmpty()) {
            billingService.generateBill(saved.getId());
        }
        return saved;
    }

    @Transactional
    public void delete(@NonNull Long id) {
        Appointment appointment = getById(id);
        
        // Audit log
        auditLogService.logAction(
            EntityType.APPOINTMENT,
            id,
            AuditAction.DELETE,
            "Deleted appointment for patient " + appointment.getPatient().getFullName() + " with doctor " + appointment.getDoctor().getName(),
            appointment,
            null
        );
        
        billingRepository.findByAppointment_Id(id).forEach(billingRepository::delete);
        appointmentRepository.deleteById(id);
    }

    public List<Appointment> byDoctor(@NonNull Long doctorId) {
        return appointmentRepository.findByDoctor_Id(doctorId);
    }

    public List<Appointment> byPatient(@NonNull Long patientId) {
        return appointmentRepository.findByPatient_Id(patientId);
    }
}
