package com.example.hospitalmanagement.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PatientDTO {

    private String fullName;
    private String email;
    private String phone;
    private String locationName;
}
