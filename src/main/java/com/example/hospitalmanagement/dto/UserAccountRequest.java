package com.example.hospitalmanagement.dto;

import com.example.hospitalmanagement.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAccountRequest {
    @NotBlank
    @Email
    private String username;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull
    private Role role;

    private Long patientId;
    private Long doctorId;
    private Long locationId;
    private Boolean twoFactorEnabled;
    
    // Patient Registration Fields
    private String fullName;
    private Integer age;
    private String gender;
    private String phone;
    
    // Doctor Registration Fields
    private Long departmentId;
    private String specialization;
}
