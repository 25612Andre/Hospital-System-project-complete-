package com.example.hospitalmanagement.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class TwoFactorSetupResponse {
    private boolean enabled;
    private String deliveryChannel;
    private String instructions;
}
