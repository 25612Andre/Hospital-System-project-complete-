package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.dto.DashboardSummaryDTO;
import com.example.hospitalmanagement.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final com.example.hospitalmanagement.auth.service.UserAccountService userAccountService;
    private final DashboardService service;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> summary(java.security.Principal principal) {
        var role = com.example.hospitalmanagement.model.enums.Role.ADMIN;
        Long doctorId = null;
        Long patientId = null;

        if (principal != null) {
            var user = userAccountService.findOptional(principal.getName()).orElse(null);
            if (user != null) {
                role = user.getRole();
                if (user.getDoctor() != null) doctorId = user.getDoctor().getId();
                if (user.getPatient() != null) patientId = user.getPatient().getId();
            }
        }
        return ResponseEntity.ok(service.summary(role, doctorId, patientId));
    }
}
