package com.example.hospitalmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetRequest {
    @NotBlank
    @Email
    private String email;

    private String token;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;
}
