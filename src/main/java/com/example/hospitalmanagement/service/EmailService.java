package com.example.hospitalmanagement.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendNewAppointmentEmail(String toDoctorEmail, String doctorName, String patientName, String dateStr) {
        if (toDoctorEmail == null || toDoctorEmail.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toDoctorEmail);
            message.setSubject("New Appointment Request: " + patientName);
            message.setText("Hello Dr. " + doctorName + ",\n\n" +
                    "You have a new appointment request.\n\n" +
                    "Patient: " + patientName + "\n" +
                    "Date & Time: " + dateStr + "\n\n" +
                    "Please log in to your dashboard to review the pre-appointment questionnaire and approve the request.\n\n" +
                    "Regards,\nHospital Management System");
            mailSender.send(message);
            log.info("Sent appointment notification email to doctor: {}", toDoctorEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toDoctorEmail, e.getMessage());
            // Do not throw the error to prevent blocking the appointment creation if SMTP is misconfigured
        }
    }
}
