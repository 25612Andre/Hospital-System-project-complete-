package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorRepository repository;
    private final UserAccountRepository userAccountRepository;
    private final AppointmentService appointmentService;
    private final PatientRepository patientRepository;
    private final com.example.hospitalmanagement.repository.LocationRepository locationRepository;
    private final AuditLogService auditLogService;

    public List<Doctor> getAll() {
        return repository.findAll();
    }

    public Doctor getById(@NonNull Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    public Page<Doctor> getPage(@NonNull Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Doctor> search(@NonNull String term, @NonNull Pageable pageable) {
        return repository.findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(term, term, pageable);
    }

    @Transactional
    public Doctor save(@NonNull Doctor doctor) {
        com.example.hospitalmanagement.model.Location location = doctor.getLocation();
        if (location != null && location.getId() != null) {
            doctor.setLocation(locationRepository.findById(location.getId()).orElse(null));
        }
        Doctor saved = repository.save(doctor);
        auditLogService.logAction(
            com.example.hospitalmanagement.model.enums.EntityType.DOCTOR,
            saved.getId(),
            com.example.hospitalmanagement.model.enums.AuditAction.CREATE,
            "Created new doctor: " + saved.getName(),
            null,
            saved
        );
        return saved;
    }

    public boolean existsByName(@NonNull String name) {
        return repository.existsByNameIgnoreCase(name);
    }

    @Transactional
    public Doctor update(@NonNull Long id, @NonNull Doctor updated) {
        Doctor existing = getById(id);
        // Create a copy or simple representation for old value if deep copy isn't available/needed
        // For simplicity, we assume 'existing' state before setters is the "old value"
        // In a real app, we might want to clone it to preserve the exact old state for the log
        
        existing.setName(updated.getName());
        existing.setContact(updated.getContact());
        existing.setSpecialization(updated.getSpecialization());
        existing.setDepartment(updated.getDepartment());
        com.example.hospitalmanagement.model.Location location = updated.getLocation();
        if (location != null && location.getId() != null) {
            existing.setLocation(locationRepository.findById(location.getId()).orElse(null));
        } else {
            existing.setLocation(null);
        }
        Doctor saved = repository.save(existing);
        auditLogService.logAction(
            com.example.hospitalmanagement.model.enums.EntityType.DOCTOR,
            saved.getId(),
            com.example.hospitalmanagement.model.enums.AuditAction.UPDATE,
            "Updated doctor: " + saved.getName(),
            null, // Old value not easily captured without cloning, passing null for now
            saved
        );
        return saved;
    }

    @Transactional
    public void delete(@NonNull Long id) {
        Doctor existing = getById(id); // Ensure it exists and get details for log
        
        // Delete UserAccounts
        userAccountRepository.deleteByDoctorId(id);
        
        // Remove from Patients
        patientRepository.findByDoctors_Id(id).forEach(p -> {
            p.getDoctors().removeIf(d -> d.getId().equals(id));
            patientRepository.save(p);
        });

        // Delete Appointments (and Bills)
        appointmentService.byDoctor(id).forEach(app -> appointmentService.delete(app.getId()));

        repository.deleteById(id);
        
        auditLogService.logAction(
            com.example.hospitalmanagement.model.enums.EntityType.DOCTOR,
            id,
            com.example.hospitalmanagement.model.enums.AuditAction.DELETE,
            "Deleted doctor: " + existing.getName(),
            existing,
            null
        );
    }
}
