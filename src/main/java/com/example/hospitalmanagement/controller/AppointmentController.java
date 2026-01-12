package com.example.hospitalmanagement.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hospitalmanagement.dto.AppointmentRequest;
import com.example.hospitalmanagement.model.Appointment;
import com.example.hospitalmanagement.service.AppointmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService service;

    private final com.example.hospitalmanagement.auth.service.UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<List<Appointment>> getAll(@RequestParam(required = false) Boolean unbilled) {
        return ResponseEntity.ok(service.getAll(unbilled));
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Appointment>> getPage(@NonNull @PageableDefault(sort = "id") Pageable pageable,
                                                     java.security.Principal principal) {
        Long patientId = null;
        Long doctorId = null;
        if (principal != null) {
            System.out.println("DEBUG: getPage requested by: " + principal.getName());
            var user = userAccountService.findOptional(principal.getName()).orElse(null);
            if (user != null) {
                System.out.println("DEBUG: User Role: " + user.getRole());
                if (user.getRole() == com.example.hospitalmanagement.model.enums.Role.PATIENT) {
                    if (user.getPatient() != null) {
                        patientId = user.getPatient().getId();
                        System.out.println("DEBUG: Resolved Patient ID: " + patientId);
                    } else {
                        return ResponseEntity.ok(Page.empty(pageable));
                    }
                } else if (user.getRole() == com.example.hospitalmanagement.model.enums.Role.DOCTOR) {
                    if (user.getDoctor() != null) {
                        // If linked to a doctor profile, filter by that doctor (optional, can be removed to view all)
                        doctorId = user.getDoctor().getId();
                        System.out.println("DEBUG: Resolved Doctor ID: " + doctorId);
                    } else {
                        // If role is DOCTOR but no doctor profile is linked, assume Receptionist/Manager view -> View All
                        System.out.println("DEBUG: Doctor Role but no details linked. Showing all.");
                    }
                }
            }
        }
        Page<Appointment> page = service.getPage(pageable, patientId, doctorId);
        System.out.println("DEBUG: Returning " + page.getTotalElements() + " appointments.");
        return ResponseEntity.ok(page);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Appointment>> search(@RequestParam @NonNull String q,
                                                    @NonNull @PageableDefault(sort = "appointmentDate") Pageable pageable) {
        return ResponseEntity.ok(service.search(q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<Appointment> create(@RequestBody @Valid @NonNull AppointmentRequest request) {
        return ResponseEntity.ok(service.create(
                request.getDoctorId(),
                request.getPatientId(),
                request.getAppointmentDate(),
                request.getStatus(),
                request.getConsultationFee(),
                request.getNotes()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> update(@PathVariable @NonNull Long id,
                                              @RequestBody @Valid @NonNull AppointmentRequest request,
                                              java.security.Principal principal) {
        verifyOwnership(id, principal);
        return ResponseEntity.ok(service.update(
                id,
                request.getDoctorId(),
                request.getPatientId(),
                request.getAppointmentDate(),
                request.getStatus(),
                request.getConsultationFee(),
                request.getNotes()
        ));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Appointment> complete(@PathVariable @NonNull Long id) {
        // Only doctors/admin verify via security config role check (PATIENT not allowed here usually)
        return ResponseEntity.ok(service.complete(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id, java.security.Principal principal) {
        verifyOwnership(id, principal);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void verifyOwnership(@NonNull Long appointmentId, java.security.Principal principal) {
        if (principal == null) return;
        var user = userAccountService.findOptional(principal.getName()).orElse(null);
        if (user != null && user.getRole() == com.example.hospitalmanagement.model.enums.Role.PATIENT) {
            Appointment appt = service.getById(appointmentId);
            if (user.getPatient() == null || !appt.getPatient().getId().equals(user.getPatient().getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You can only manage your own appointments.");
            }
            // Patients can only delete/edit if status is 'Requested'
            if (!"Requested".equalsIgnoreCase(appt.getStatus())) {
                 throw new org.springframework.security.access.AccessDeniedException("Access Denied: Cannot modify processed appointments.");
            }
        }
    }

    @GetMapping("/doctor/{id}")
    public ResponseEntity<List<Appointment>> getByDoctor(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(service.byDoctor(id));
    }

    @GetMapping("/patient/{id}")
    public ResponseEntity<List<Appointment>> getByPatient(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(service.byPatient(id));
    }
}
