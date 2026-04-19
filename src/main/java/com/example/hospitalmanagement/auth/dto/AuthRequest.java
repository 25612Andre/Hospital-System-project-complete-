package com.example.hospitalmanagement.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthRequest {
    @NotBlank
    @Email
    private String username;

    @NotBlank
    private String password;

    public void setUsername(String username) {
        this.username = username == null ? null : username.trim();
    }
}
