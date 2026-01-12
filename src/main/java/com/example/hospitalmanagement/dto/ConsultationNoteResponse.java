package com.example.hospitalmanagement.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationNoteResponse {
    private Long id;
    private Long appointmentId;

    private Long doctorId;
    private String doctorName;

    private Long patientId;
    private String patientName;
    private String patientEmail;

    private String observations;
    private Boolean hasAudio;
    private List<PrescriptionItemResponse> prescriptions;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
