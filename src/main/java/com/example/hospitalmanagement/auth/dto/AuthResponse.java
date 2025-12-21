package com.example.hospitalmanagement.auth.dto;

import com.example.hospitalmanagement.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserInfo user;
    private boolean requires2fa;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private Role role;
        private Long patientId;
        private Long doctorId;
    }
}
