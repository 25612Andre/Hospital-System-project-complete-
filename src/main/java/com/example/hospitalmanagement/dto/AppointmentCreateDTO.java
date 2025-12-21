package com.example.hospitalmanagement.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentCreateDTO {

    private LocalDate date;
    private LocalTime time;
    private String reason;
    private String doctorName;       // spinner choice
    private String departmentName;   // spinner choice
    private String patientEmail;
}
