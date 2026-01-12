package com.example.hospitalmanagement.dto;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsultationNoteRequest {
    @NotBlank
    private String observations;

    @Valid
    private List<PrescriptionItemRequest> prescriptions = new ArrayList<>();

    /**
     * When true (default), send the note to the patient by email.
     */
    private Boolean sendEmail = Boolean.TRUE;
}

