package com.example.hospitalmanagement.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentRequest {
    @NotNull
    private Long doctorId;

    @NotNull
    private Long patientId;

    @NotNull
    private LocalDateTime appointmentDate;

    @NotBlank
    private String status;

    private Double consultationFee;
    
    private String notes;
}
