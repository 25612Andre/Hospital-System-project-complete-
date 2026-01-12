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

    public Page<Patient> getPage(@NonNull Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Page<Patient> getPage(@NonNull Pageable pageable, Long doctorId) {
        if (doctorId != null) {
            return repository.findByDoctors_Id(doctorId, pageable);
        }
        return repository.findAll(pageable);
    }

    public Page<Patient> search(@NonNull String term, @NonNull Pageable pageable) {
        return search(term, pageable, null);
    }

    public Page<Patient> search(@NonNull String term, @NonNull Pageable pageable, Long doctorId) {
        if (doctorId != null) {
            return repository.searchForDoctor(doctorId, term, pageable);
        }
        return repository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                term, term, term, pageable);
    }

    public Page<Patient> filter(String name, String email, String phone, String gender, @NonNull Pageable pageable) {
        return filter(name, email, phone, gender, pageable, null);
    }

    public Page<Patient> filter(String name, String email, String phone, String gender, @NonNull Pageable pageable, Long doctorId) {
        String normalizedGender = normalizeGenderFilter(gender);
        String nameFilter = normalizeFilter(name);
        String emailFilter = normalizeFilter(email);
        String phoneFilter = normalizeFilter(phone);
        if (doctorId != null) {
            return repository.filterPatientsForDoctor(doctorId, nameFilter, emailFilter, phoneFilter, normalizedGender, pageable);
        }
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
        patient.setGender(normalizeGenderValue(patient.getGender()));
        if (repository.existsByEmailIgnoreCase(patient.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered for another patient");
        }
        if (repository.existsByPhone(patient.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
        }
        // Resolve location from database if only ID is provided
        if (patient.getLocation() != null && patient.getLocation().getId() != null) {
            Long locationId = patient.getLocation().getId();
            Location resolvedLocation = locationRepository.findById(locationId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
            patient.setLocation(resolvedLocation);
        }
        return repository.save(patient);
    }

    @org.springframework.transaction.annotation.Transactional
    public Patient update(@NonNull Long id, @NonNull Patient updated) {
        Patient existing = getById(id);
        existing.setGender(normalizeGenderValue(updated.getGender()));
        if (!existing.getEmail().equalsIgnoreCase(updated.getEmail())
                && repository.existsByEmailIgnoreCase(updated.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered for another patient");
        }
        if (!existing.getPhone().equals(updated.getPhone()) && repository.existsByPhone(updated.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
        }
        existing.setFullName(updated.getFullName());
        existing.setAge(updated.getAge());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        // Resolve location from database if only ID is provided
        if (updated.getLocation() != null && updated.getLocation().getId() != null) {
            Long locationId = updated.getLocation().getId();
            Location resolvedLocation = locationRepository.findById(locationId)
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

    private String normalizeGenderFilter(String rawGender) {
        if (rawGender == null) return null;
        String trimmed = rawGender.trim();
        if (trimmed.isEmpty()) return null;
        return normalizeGenderValue(trimmed);
    }

    private String normalizeGenderValue(String rawGender) {
        if (rawGender == null) return null;
        String trimmed = rawGender.trim();
        if (trimmed.isEmpty()) return trimmed;
        String upper = trimmed.toUpperCase();
        return switch (upper) {
            case "M", "MALE" -> "MALE";
            case "F", "FEMALE" -> "FEMALE";
            case "O", "OTHER" -> "OTHER";
            default -> trimmed;
        };
    }
}
