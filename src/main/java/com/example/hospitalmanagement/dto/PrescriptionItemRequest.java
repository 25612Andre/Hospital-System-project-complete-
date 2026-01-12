package com.example.hospitalmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PrescriptionItemRequest {
    @NotBlank
    private String medicationName;

    private String dosage;
    private String frequency;
    private String duration;
    private String instructions;
}

