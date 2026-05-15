package com.example.hospitalmanagement.auth.dto;

public record ForgotPasswordResponse(
        String message,
        String resetToken,
        boolean emailSent
) {
}
