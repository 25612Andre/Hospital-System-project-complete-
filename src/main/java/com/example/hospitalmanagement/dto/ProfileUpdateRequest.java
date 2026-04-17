package com.example.hospitalmanagement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String password;
    private String fullName;
    private String phone;
    private String specialization;
    private String gender;
    private Integer age;
}
