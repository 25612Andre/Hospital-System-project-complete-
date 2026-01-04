package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.SearchResultDTO;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.BillingRepository;
import com.example.hospitalmanagement.repository.DepartmentRepository;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final LocationService locationService;
    private final AppointmentRepository appointmentRepository;
    private final BillingRepository billingRepository;

    public Map<String, List<SearchResultDTO>> globalSearch(String term) {
        if (term == null || term.isBlank()) {
            return emptyBuckets();
        }
        String query = term.trim();
        PageRequest limit = PageRequest.of(0, 5);
        Map<String, List<SearchResultDTO>> buckets = emptyBuckets();

        // Try to parse as ID
        Long searchId = null;
        try {
            searchId = Long.parseLong(query);
        } catch (NumberFormatException e) {
            // Not a number, continue with text search
        }

        List<SearchResultDTO> patients = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            patientRepository.findById(searchId).ifPresent(p -> 
                patients.add(new SearchResultDTO("Patient", p.getId(), p.getFullName(), p.getEmail()))
            );
        }
        // Also search by name, email, phone
        patientRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                        query, query, query, limit)
                .forEach(p -> {
                    // Avoid duplicates if ID search already found it
                    if (patients.stream().noneMatch(existing -> existing.getId().equals(p.getId()))) {
                        patients.add(new SearchResultDTO("Patient", p.getId(), p.getFullName(), p.getEmail()));
                    }
                });
        buckets.put("patients", patients);

        List<SearchResultDTO> doctors = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            doctorRepository.findById(searchId).ifPresent(d -> 
                doctors.add(new SearchResultDTO("Doctor", d.getId(), d.getName(), d.getSpecialization()))
            );
        }
        // Also search by name, specialization
        doctorRepository.findByNameContainingIgnoreCaseOrSpecializationContainingIgnoreCase(query, query, limit)
                .forEach(d -> {
                    if (doctors.stream().noneMatch(existing -> existing.getId().equals(d.getId()))) {
                        doctors.add(new SearchResultDTO("Doctor", d.getId(), d.getName(), d.getSpecialization()));
                    }
                });
        buckets.put("doctors", doctors);

        List<SearchResultDTO> departments = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            departmentRepository.findById(searchId).ifPresent(dep -> 
                departments.add(new SearchResultDTO("Department", dep.getId(), dep.getName(),
                        "Fee: " + dep.getConsultationFee()))
            );
        }
        // Also search by name
        departmentRepository.findByNameContainingIgnoreCase(query)
                .forEach(dep -> {
                    if (departments.stream().noneMatch(existing -> existing.getId().equals(dep.getId()))) {
                        departments.add(new SearchResultDTO("Department", dep.getId(), dep.getName(),
                                "Fee: " + dep.getConsultationFee()));
                    }
                });
        buckets.put("departments", departments);

        List<SearchResultDTO> locations = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            locationRepository.findById(searchId).ifPresent(loc -> 
                locations.add(new SearchResultDTO(
                        "Location",
                        loc.getId(),
                        loc.getName(),
                        locationService.buildPath(loc)
                ))
            );
        }
        // Also search by name, code
        locationRepository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(query, query, limit)
                .forEach(loc -> {
                    if (locations.stream().noneMatch(existing -> existing.getId().equals(loc.getId()))) {
                        locations.add(new SearchResultDTO(
                                "Location",
                                loc.getId(),
                                loc.getName(),
                                locationService.buildPath(loc)
                        ));
                    }
                });
        buckets.put("locations", locations);

        List<SearchResultDTO> appointments = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            appointmentRepository.findById(searchId).ifPresent(app -> 
                appointments.add(new SearchResultDTO(
                        "Appointment",
                        app.getId(),
                        app.getPatient().getFullName() + " with " + app.getDoctor().getName(),
                        app.getAppointmentDate().toString()
                ))
            );
        }
        // Also search by doctor/patient name
        appointmentRepository.findByDoctor_NameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCase(query, query, limit)
                .forEach(app -> {
                    if (appointments.stream().noneMatch(existing -> existing.getId().equals(app.getId()))) {
                        appointments.add(new SearchResultDTO(
                                "Appointment",
                                app.getId(),
                                app.getPatient().getFullName() + " with " + app.getDoctor().getName(),
                                app.getAppointmentDate().toString()
                        ));
                    }
                });
        buckets.put("appointments", appointments);

        List<SearchResultDTO> bills = new ArrayList<>();
        // Search by ID if numeric
        if (searchId != null) {
            billingRepository.findById(searchId).ifPresent(bill -> 
                bills.add(new SearchResultDTO(
                        "Bill",
                        bill.getId(),
                        "Bill #" + bill.getId(),
                        bill.getStatus() + " - " + bill.getAmount()
                ))
            );
        }
        // Also search by status, patient name
        billingRepository.findByStatusContainingIgnoreCaseOrAppointment_Patient_FullNameContainingIgnoreCase(query, query, limit)
                .forEach(bill -> {
                    if (bills.stream().noneMatch(existing -> existing.getId().equals(bill.getId()))) {
                        bills.add(new SearchResultDTO(
                                "Bill",
                                bill.getId(),
                                "Bill #" + bill.getId(),
                                bill.getStatus() + " - " + bill.getAmount()
                        ));
                    }
                });
        buckets.put("bills", bills);

        return buckets;
    }

    private Map<String, List<SearchResultDTO>> emptyBuckets() {
        Map<String, List<SearchResultDTO>> buckets = new LinkedHashMap<>();
        buckets.put("patients", Collections.emptyList());
        buckets.put("doctors", Collections.emptyList());
        buckets.put("departments", Collections.emptyList());
        buckets.put("locations", Collections.emptyList());
        buckets.put("appointments", Collections.emptyList());
        buckets.put("bills", Collections.emptyList());
        return buckets;
    }
}
