package com.example.hospitalmanagement.auth.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class VerificationService {

    private static class CodeEntry {
        String code;
        Instant expiresAt;
    }

    private final Map<String, CodeEntry> resetTokens = new ConcurrentHashMap<>();

    public String generateResetToken(String email) {
        CodeEntry entry = new CodeEntry();
        // Generate 4-digit code (1000-9999)
        int randomPin = (int) (Math.random() * 9000) + 1000;
        entry.code = String.valueOf(randomPin);
        
        entry.expiresAt = Instant.now().plusSeconds(3600);
        resetTokens.put(email.toLowerCase(), entry);
        return entry.code;
    }

    public boolean validateResetToken(String email, String token) {
        CodeEntry entry = resetTokens.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt)) {
            resetTokens.remove(email.toLowerCase());
            return false;
        }
        boolean ok = entry.code.equals(token);
        if (ok) resetTokens.remove(email.toLowerCase());
        return ok;
    }
}
