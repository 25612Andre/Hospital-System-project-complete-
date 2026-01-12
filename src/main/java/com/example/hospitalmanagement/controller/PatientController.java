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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService service;

    private final com.example.hospitalmanagement.auth.service.UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<List<Patient>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<Patient>> getPage(@PageableDefault(sort = "id") Pageable pageable,
                                                 java.security.Principal principal) {
        Long doctorId = null;
        if (principal != null) {
            var user = userAccountService.findOptional(principal.getName()).orElse(null);
            if (user != null && user.getRole() == com.example.hospitalmanagement.model.enums.Role.DOCTOR && user.getDoctor() != null) {
                doctorId = user.getDoctor().getId();
            }
        }
        return ResponseEntity.ok(service.getPage(pageable, doctorId));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Patient>> search(@RequestParam @NonNull String q,
                                                @PageableDefault(sort = "id") Pageable pageable,
                                                java.security.Principal principal) {
        return ResponseEntity.ok(service.search(q, pageable, resolveDoctorId(principal)));
    }

    @GetMapping("/province/{name}")
    public ResponseEntity<List<Patient>> getByProvince(@PathVariable @NonNull String name) {
        return ResponseEntity.ok(service.byProvince(name));
    }

    @GetMapping("/province/code/{code}")
    public ResponseEntity<List<Patient>> getByProvinceCode(@PathVariable @NonNull String code) {
        return ResponseEntity.ok(service.byProvinceCode(code));
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<Patient>> filter(@RequestParam(required = false) String name,
                                                @RequestParam(required = false) String email,
                                                @RequestParam(required = false) String phone,
                                                @RequestParam(required = false) String gender,
                                                @PageableDefault(sort = "id") Pageable pageable,
                                                java.security.Principal principal) {
        return ResponseEntity.ok(service.filter(name, email, phone, gender, pageable, resolveDoctorId(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody @Valid @NonNull Patient patient,
                                          java.security.Principal principal) {
        if (principal != null) {
            var user = userAccountService.findOptional(principal.getName()).orElse(null);
            if (user != null && user.getRole() == com.example.hospitalmanagement.model.enums.Role.DOCTOR && user.getDoctor() != null) {
                // Auto-link this patient to the creating doctor
                patient.getDoctors().add(user.getDoctor());
            }
        }
        return ResponseEntity.ok(service.save(patient));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> update(@PathVariable @NonNull Long id,
                                          @RequestBody @Valid @NonNull Patient patient) {
        return ResponseEntity.ok(service.update(id, patient));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Long resolveDoctorId(java.security.Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return null;
        }
        var user = userAccountService.findOptional(principal.getName()).orElse(null);
        if (user == null) {
            return null;
        }
        if (user.getRole() == com.example.hospitalmanagement.model.enums.Role.DOCTOR && user.getDoctor() != null) {
            return user.getDoctor().getId();
        }
        return null;
    }
}
