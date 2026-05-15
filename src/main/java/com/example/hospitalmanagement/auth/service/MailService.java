package com.example.hospitalmanagement.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    @Value("${app.mail.from:}")
    private String defaultFrom;

    public void send(String to, String subject, String body) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Cannot send email to {} because JavaMailSender is not configured", to);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email service is not configured."
            );
        }

        if (mailSender instanceof JavaMailSenderImpl senderImpl) {
            String host = senderImpl.getHost();
            String username = senderImpl.getUsername();
            String password = senderImpl.getPassword();
            if (isBlank(host) || isBlank(username) || isBlank(password)) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Email service is misconfigured. Set SPRING_MAIL_HOST, SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD."
                );
            }
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (!isBlank(defaultFrom)) {
                message.setFrom(defaultFrom.trim());
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send email to {}: {}. Body: {}", to, ex.getMessage(), body);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "SMTP delivery failed. Check mail configuration and retry."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
