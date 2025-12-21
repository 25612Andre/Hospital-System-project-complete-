package com.example.hospitalmanagement.auth.service;

import com.example.hospitalmanagement.model.UserAccount;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TwoFactorAuthService {

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private final MailService mailService;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, CodeEntry> pendingCodes = new ConcurrentHashMap<>();

    public String dispatchCode(UserAccount user) {
        if (user == null) {
            throw new IllegalArgumentException("User is required to trigger 2FA");
        }
        return dispatchCode(user.getUsername());
    }

    public String dispatchCode(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username/email is required to send 2FA code");
        }
        String normalized = username.trim().toLowerCase();
        CodeEntry entry = new CodeEntry();
        entry.code = String.format("%06d", random.nextInt(1_000_000));
        entry.expiresAt = Instant.now().plus(CODE_TTL);
        pendingCodes.put(normalized, entry);
        String subject = "Hospital Management System login verification code";
        String body = """
Use the verification code %s to finish signing in. The code expires in %d minutes.

If you did not initiate this request you can ignore this email.
""".formatted(entry.code, CODE_TTL.toMinutes());
        mailService.send(username, subject, body);
        return entry.code;
    }

    public boolean verifyCode(String username, String code) {
        if (username == null || code == null) {
            return false;
        }
        String normalized = username.trim().toLowerCase();
        CodeEntry entry = pendingCodes.get(normalized);
        if (entry == null) {
            return false;
        }
        if (Instant.now().isAfter(entry.expiresAt)) {
            pendingCodes.remove(normalized);
            return false;
        }
        boolean matches = entry.code.equals(code);
        if (matches) {
            pendingCodes.remove(normalized);
        }
        return matches;
    }

    public void invalidate(String username) {
        if (username == null) {
            return;
        }
        pendingCodes.remove(username.trim().toLowerCase());
    }

    private static class CodeEntry {
        String code;
        Instant expiresAt;
    }
}
