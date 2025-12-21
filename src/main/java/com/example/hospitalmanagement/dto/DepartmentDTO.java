package com.example.hospitalmanagement.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class DepartmentDTO {

    private String name;
    private double consultationFee;
}
