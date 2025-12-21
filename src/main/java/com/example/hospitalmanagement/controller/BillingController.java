package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.dto.BillUpdateRequest;
import com.example.hospitalmanagement.model.Bill;
import com.example.hospitalmanagement.service.BillingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping
    public ResponseEntity<List<Bill>> getAll() {
        return ResponseEntity.ok(billingService.getAll());
    }

    private final com.example.hospitalmanagement.auth.service.UserAccountService userAccountService;
    
    @GetMapping("/page")
    public ResponseEntity<Page<Bill>> getPage(@PageableDefault(sort = "id") Pageable pageable,
                                              java.security.Principal principal) {
        Long patientId = null;
        Long doctorId = null;
        if (principal != null) {
             var user = userAccountService.findOptional(principal.getName()).orElse(null);
             if (user != null) {
                if (user.getRole() == com.example.hospitalmanagement.model.enums.Role.PATIENT && user.getPatient() != null) {
                    patientId = user.getPatient().getId();
                } else if (user.getRole() == com.example.hospitalmanagement.model.enums.Role.DOCTOR && user.getDoctor() != null) {
                    doctorId = user.getDoctor().getId();
                }
             }
        }
        return ResponseEntity.ok(billingService.getPage(pageable, patientId, doctorId));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Bill>> search(@RequestParam @NonNull String q,
                                             @PageableDefault(sort = "issuedDate") Pageable pageable,
                                             java.security.Principal principal) {
        Long patientId = null;
        if (principal != null) {
            var user = userAccountService.findOptional(principal.getName()).orElse(null);
            if (user != null && user.getRole() == com.example.hospitalmanagement.model.enums.Role.PATIENT && user.getPatient() != null) {
                patientId = user.getPatient().getId();
            }
        }
        return ResponseEntity.ok(billingService.search(q, pageable, patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bill> getById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(billingService.getById(id));
    }

    @PostMapping("/generate/{appointmentId}")
    public ResponseEntity<Bill> generateBill(@PathVariable @NonNull Long appointmentId) {
        Bill bill = billingService.generateBill(appointmentId);
        return ResponseEntity.ok(bill);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Bill> updateStatus(@PathVariable @NonNull Long id, @RequestBody String status) {
        return ResponseEntity.ok(billingService.updateStatus(id, status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bill> update(@PathVariable @NonNull Long id,
                                       @RequestBody @Valid @NonNull BillUpdateRequest request) {
        return ResponseEntity.ok(billingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id) {
        billingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
