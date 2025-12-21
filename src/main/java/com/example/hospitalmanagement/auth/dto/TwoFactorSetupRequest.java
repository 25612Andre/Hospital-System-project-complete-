package com.example.hospitalmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorSetupRequest {
    @NotBlank
    @Email
    private String username;

    @NotBlank
    private String password;

    private boolean enable = true;
}
