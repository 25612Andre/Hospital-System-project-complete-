package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import com.example.hospitalmanagement.model.Patient;
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

    public List<Doctor> getAll() {
        return repository.findAll();
    }

    public Doctor getById(@NonNull Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    public Page<Doctor> getPage(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Doctor> search(@NonNull String term, Pageable pageable) {
        return repository.findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(term, term, pageable);
    }

    @Transactional
    public Doctor save(@NonNull Doctor doctor) {
        if (doctor.getLocation() != null && doctor.getLocation().getId() != null) {
            doctor.setLocation(locationRepository.findById(doctor.getLocation().getId()).orElse(null));
        }
        return repository.save(doctor);
    }

    public boolean existsByName(@NonNull String name) {
        return repository.existsByNameIgnoreCase(name);
    }

    @Transactional
    public Doctor update(@NonNull Long id, @NonNull Doctor updated) {
        Doctor existing = getById(id);
        existing.setName(updated.getName());
        existing.setContact(updated.getContact());
        existing.setSpecialization(updated.getSpecialization());
        existing.setDepartment(updated.getDepartment());
        if (updated.getLocation() != null && updated.getLocation().getId() != null) {
            existing.setLocation(locationRepository.findById(updated.getLocation().getId()).orElse(null));
        } else {
            existing.setLocation(null);
        }
        return repository.save(existing);
    }

    @Transactional
    public void delete(@NonNull Long id) {
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
    }
}
