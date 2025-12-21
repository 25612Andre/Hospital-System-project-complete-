package com.example.hospitalmanagement.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorDTO {

    private String name;
    private String specialization;
    private String contact;
    private String departmentName;
}
