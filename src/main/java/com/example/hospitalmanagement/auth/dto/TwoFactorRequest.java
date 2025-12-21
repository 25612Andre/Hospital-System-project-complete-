package com.example.hospitalmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorRequest {
    @NotBlank
    @Email
    private String username;

    @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits")
    private String code;
}
