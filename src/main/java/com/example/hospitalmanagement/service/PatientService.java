package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository repository;
    private final LocationService locationService;
    private final com.example.hospitalmanagement.repository.LocationRepository locationRepository;
    private final com.example.hospitalmanagement.repository.AppointmentRepository appointmentRepository;
    private final com.example.hospitalmanagement.repository.BillingRepository billRepository;
    private final com.example.hospitalmanagement.repository.UserAccountRepository userAccountRepository;

    public List<Patient> getAll() {
        return repository.findAll();
    }

    public Page<Patient> getPage(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Patient> getPage(Pageable pageable, Long doctorId) {
        if (doctorId != null) {
            return repository.findByDoctors_Id(doctorId, pageable);
        }
        return repository.findAll(pageable);
    }

    public Page<Patient> search(@NonNull String term, Pageable pageable) {
        return repository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                term, term, term, pageable);
    }

    public Page<Patient> filter(String name, String email, String phone, String gender, Pageable pageable) {
        String normalizedGender = (gender == null || gender.isBlank()) ? null : gender;
        String nameFilter = normalizeFilter(name);
        String emailFilter = normalizeFilter(email);
        String phoneFilter = normalizeFilter(phone);
        return repository.filterPatients(nameFilter, emailFilter, phoneFilter, normalizedGender, pageable);
    }

    public List<Patient> byProvince(@NonNull String provinceName) {
        Location province = locationService.requireByTypeAndName(LocationType.PROVINCE, provinceName);
        List<Long> ids = locationService.collectDescendantIds(province);
        return repository.findByLocation_IdIn(ids);
    }

    public List<Patient> byProvinceCode(@NonNull String provinceCode) {
        Location province = locationService.requireByTypeAndCode(LocationType.PROVINCE, provinceCode);
        List<Long> ids = locationService.collectDescendantIds(province);
        return repository.findByLocation_IdIn(ids);
    }

    public Patient getById(@NonNull Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    @org.springframework.transaction.annotation.Transactional
    public Patient save(@NonNull Patient patient) {
        if (repository.existsByEmailIgnoreCase(patient.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered for another patient");
        }
        if (repository.existsByPhone(patient.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
        }
        // Resolve location from database if only ID is provided
        if (patient.getLocation() != null && patient.getLocation().getId() != null) {
            Location resolvedLocation = locationRepository.findById(patient.getLocation().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
            patient.setLocation(resolvedLocation);
        }
        return repository.save(patient);
    }

    @org.springframework.transaction.annotation.Transactional
    public Patient update(@NonNull Long id, @NonNull Patient updated) {
        Patient existing = getById(id);
        if (!existing.getEmail().equalsIgnoreCase(updated.getEmail())
                && repository.existsByEmailIgnoreCase(updated.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered for another patient");
        }
        if (!existing.getPhone().equals(updated.getPhone()) && repository.existsByPhone(updated.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
        }
        existing.setFullName(updated.getFullName());
        existing.setAge(updated.getAge());
        existing.setGender(updated.getGender());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        // Resolve location from database if only ID is provided
        if (updated.getLocation() != null && updated.getLocation().getId() != null) {
            Location resolvedLocation = locationRepository.findById(updated.getLocation().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
            existing.setLocation(resolvedLocation);
        } else {
            existing.setLocation(null);
        }
        return repository.save(existing);
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(@NonNull Long id) {
        // 1. Delete Linked UserAccount
        userAccountRepository.deleteByPatientId(id);

        // 2. Delete Appointments & Bills
        List<com.example.hospitalmanagement.model.Appointment> appointments = appointmentRepository.findByPatient_Id(id);
        for (com.example.hospitalmanagement.model.Appointment app : appointments) {
            billRepository.findByAppointment_Id(app.getId()).forEach(billRepository::delete);
            appointmentRepository.delete(app);
        }

        repository.deleteById(id);
    }

    private String normalizeFilter(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
