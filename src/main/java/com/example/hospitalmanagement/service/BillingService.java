package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.BillUpdateRequest;
import com.example.hospitalmanagement.model.Appointment;
import com.example.hospitalmanagement.model.Bill;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.BillingRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BillingService {

    private final BillingRepository billingRepository;
    private final AppointmentRepository appointmentRepository;

    public List<Bill> getAll() {
        return billingRepository.findAll();
    }

    public Page<Bill> getPage(Pageable pageable, Long patientId, Long doctorId) {
        if (patientId != null) {
            return billingRepository.findByAppointment_Patient_Id(patientId, pageable);
        }
        if (doctorId != null) {
            return billingRepository.findByAppointment_Doctor_Id(doctorId, pageable);
        }
        return billingRepository.findAll(pageable);
    }

    public Page<Bill> search(@NonNull String term, Pageable pageable, Long patientId) {
        if (patientId != null) {
            return billingRepository.searchByTermAndPatient(term, patientId, pageable);
        }
        return billingRepository.findByStatusContainingIgnoreCaseOrAppointment_Patient_FullNameContainingIgnoreCase(
                term, term, pageable);
    }

    public Bill getById(@NonNull Long id) {
        return billingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with ID: " + id));
    }

    @Transactional
    public Bill generateBill(@NonNull Long appointmentId) {
        List<Bill> existingBills = billingRepository.findByAppointment_Id(appointmentId);
        if (!existingBills.isEmpty()) {
            Bill existing = existingBills.get(0);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A bill already exists for appointment " + appointmentId + " (Bill #" + existing.getId() + ")");
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        // Get the consultation fee or default to 0
        Double amount = Optional.ofNullable(appointment.getConsultationFee()).orElse(0.0);

        // Build and save the bill
        Bill bill = Bill.builder()
                .appointment(appointment)
                .amount(amount)
                .status("Pending")
                .issuedDate(LocalDateTime.now())
                .build();

        return Objects.requireNonNull(billingRepository.save(bill));
    }

    @Transactional
    public Bill updateStatus(@NonNull Long id, @NonNull String status) {
        Bill bill = getById(id);
        if ("Paid".equalsIgnoreCase(bill.getStatus())) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify a paid bill");
        }
        bill.setStatus(status);
        return billingRepository.save(bill);
    }

    @Transactional
    public Bill update(@NonNull Long id, @NonNull BillUpdateRequest request) {
        Bill bill = getById(id);
        if ("Paid".equalsIgnoreCase(bill.getStatus())) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify a paid bill");
        }
        if (request.getAmount() != null) {
            
            bill.setAmount(request.getAmount());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            bill.setStatus(request.getStatus());
        }
        if (request.getPaymentMethod() != null) {
            bill.setPaymentMethod(request.getPaymentMethod());
        }
        return billingRepository.save(bill);
    }

    @Transactional
    public void delete(@NonNull Long id) {
        Bill bill = getById(id);
        if ("Paid".equalsIgnoreCase(bill.getStatus())) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete a paid bill");
        }
        billingRepository.deleteById(id);
    }
}
