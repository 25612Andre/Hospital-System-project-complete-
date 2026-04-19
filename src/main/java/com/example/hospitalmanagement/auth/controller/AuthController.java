package com.example.hospitalmanagement.auth.controller;

import com.example.hospitalmanagement.auth.dto.AuthRequest;
import com.example.hospitalmanagement.auth.dto.AuthResponse;
import com.example.hospitalmanagement.auth.dto.PasswordResetRequest;
import com.example.hospitalmanagement.auth.dto.TwoFactorRequest;
import com.example.hospitalmanagement.auth.dto.TwoFactorSetupRequest;
import com.example.hospitalmanagement.auth.dto.TwoFactorSetupResponse;
import com.example.hospitalmanagement.auth.service.MailService;
import com.example.hospitalmanagement.auth.service.TwoFactorAuthService;
import com.example.hospitalmanagement.auth.service.UserAccountService;
import com.example.hospitalmanagement.auth.service.VerificationService;
import com.example.hospitalmanagement.dto.UserAccountRequest;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.service.AuditLogService;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import com.example.hospitalmanagement.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserAccountService userAccountService;
    private final VerificationService verificationService;
    private final MailService mailService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @Value("${app.auth.enforce-2fa:false}")
    private boolean enforce2fa;

    @Value("${app.auth.return-2fa-code:false}")
    private boolean return2faCode;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        UserAccount ua = userAccountService.authenticate(request);
        Long patientId = ua.getPatient() != null ? ua.getPatient().getId() : null;
        Long doctorId = ua.getDoctor() != null ? ua.getDoctor().getId() : null;
        AuthResponse.UserInfo info = new AuthResponse.UserInfo(
                ua.getId(),
                ua.getUsername(),
                ua.getRole(),
                patientId,
                doctorId,
                ua.getProfilePictureUrl()
        );
        boolean requiresTwoFactor = enforce2fa || ua.isTwoFactorEnabled();
        if (!requiresTwoFactor) {
            String token = jwtService.generateToken(ua);
            auditLogService.logActionAsUser(
                    EntityType.USER_ACCOUNT,
                    ua.getId(),
                    AuditAction.LOGIN,
                    "User logged in: " + ua.getUsername(),
                    null,
                    null,
                    ua.getUsername(),
                    ua.getId()
            );
            return ResponseEntity.ok(new AuthResponse(token, info, false));
        }
        String code = twoFactorAuthService.dispatchCode(ua);
        return ResponseEntity.ok(new AuthResponse(return2faCode ? code : "", info, true));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String token) {
        String username = "UNKNOWN";
        Long userId = 0L;
        try {
            if (token != null && token.startsWith("Bearer ")) {
                username = jwtService.extractUsername(token.substring(7));
                userId = userAccountService.findOptional(username).map(UserAccount::getId).orElse(0L);
            }
        } catch (Exception ex) {}
        
        auditLogService.logActionAsUser(
                EntityType.USER_ACCOUNT,
                userId,
                AuditAction.LOGOUT,
                "User logged out: " + username,
                null,
                null,
                username,
                userId
        );
            
        return ResponseEntity.ok("Logged out");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        String token = verificationService.generateResetToken(request.getEmail());
        mailService.send(request.getEmail(), "Password reset instructions",
                "Use this token to reset your password within the next hour: " + token);
        // In production, do not return token. For this demo/MVP, returning it simplifies testing.
        return ResponseEntity.ok("Reset token sent to " + request.getEmail() + " (Token: " + token + ")");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Token and new password are required");
        }
        boolean ok = verificationService.validateResetToken(request.getEmail(), request.getToken());
        if (!ok) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
        try {
            userAccountService.updatePassword(request.getEmail(), request.getNewPassword());
        } catch (RuntimeException ex) {
             return ResponseEntity.badRequest().body(ex.getMessage());
        }
        return ResponseEntity.ok("Password reset");
    }

    @PostMapping("/2fa/send")
    public ResponseEntity<String> send2fa(@Valid @RequestBody TwoFactorRequest request) {
        String code;
        try {
            code = userAccountService.findOptional(request.getUsername())
                    .map(twoFactorAuthService::dispatchCode)
                    .orElseGet(() -> twoFactorAuthService.dispatchCode(request.getUsername()));
        } catch (RuntimeException ex) {
            code = twoFactorAuthService.dispatchCode(request.getUsername());
        }
        if (return2faCode) {
            return ResponseEntity.ok(code);
        }
        return ResponseEntity.ok("Verification code sent to " + request.getUsername());
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verify2fa(@Valid @RequestBody TwoFactorRequest request) {
        UserAccount ua = userAccountService.findByUsername(request.getUsername());
        boolean ok = twoFactorAuthService.verifyCode(ua.getUsername(), request.getCode());
        if (!ok) {
            return ResponseEntity.status(401).build();
        }
        Long patientId = ua.getPatient() != null ? ua.getPatient().getId() : null;
        Long doctorId = ua.getDoctor() != null ? ua.getDoctor().getId() : null;
        String token = jwtService.generateToken(ua);
        auditLogService.logActionAsUser(
                EntityType.USER_ACCOUNT,
                ua.getId(),
                AuditAction.LOGIN,
                "User logged in with 2FA: " + ua.getUsername(),
                null,
                null,
                ua.getUsername(),
                ua.getId()
        );
        return ResponseEntity.ok(new AuthResponse(token,
                new AuthResponse.UserInfo(
                        ua.getId(),
                        ua.getUsername(),
                        ua.getRole(),
                        patientId,
                        doctorId,
                        ua.getProfilePictureUrl()
                ), false));
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<TwoFactorSetupResponse> setup2fa(@Valid @RequestBody TwoFactorSetupRequest request) {
        AuthRequest auth = new AuthRequest();
        auth.setUsername(request.getUsername());
        auth.setPassword(request.getPassword());
        UserAccount ua = userAccountService.authenticate(auth);
        userAccountService.updateTwoFactor(ua, request.isEnable());
        
        auditLogService.logAction(EntityType.USER_ACCOUNT, ua.getId(), AuditAction.UPDATE, 
            "Two-factor authentication " + (request.isEnable() ? "enabled" : "disabled") + " for " + ua.getUsername(),
            ua.getUsername(), null);
            
        String message = request.isEnable()
                ? "Email-based verification enabled. Future logins will require the emailed OTP."
                : "Two-factor authentication disabled for this user.";
        return ResponseEntity.ok(new TwoFactorSetupResponse(ua.isTwoFactorEnabled(), "EMAIL", message));
    }

    @PostMapping(value = "/signup", consumes = {"multipart/form-data"})
    public ResponseEntity<UserAccount> signup(
            @Valid @NonNull @org.springframework.web.bind.annotation.ModelAttribute UserAccountRequest request,
            @org.springframework.web.bind.annotation.RequestParam(value = "profilePicture", required = false) 
            org.springframework.web.multipart.MultipartFile profilePicture) {
        // Enforce PATIENT role for public signup.
        // Doctors and Admins must be created by an existing Admin.
        request.setRole(com.example.hospitalmanagement.model.enums.Role.PATIENT);
        UserAccount created = userAccountService.create(request, profilePicture);
        return ResponseEntity.ok(created);
    }
}
