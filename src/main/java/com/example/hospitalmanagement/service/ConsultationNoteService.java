package com.example.hospitalmanagement.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.hospitalmanagement.auth.service.MailService;
import com.example.hospitalmanagement.dto.ConsultationNoteRequest;
import com.example.hospitalmanagement.dto.ConsultationNoteResponse;
import com.example.hospitalmanagement.dto.PrescriptionItemRequest;
import com.example.hospitalmanagement.dto.PrescriptionItemResponse;
import com.example.hospitalmanagement.model.Appointment;
import com.example.hospitalmanagement.model.ConsultationNote;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.PrescriptionItem;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.AuditAction;
import com.example.hospitalmanagement.model.enums.EntityType;
import com.example.hospitalmanagement.model.enums.Role;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.ConsultationNoteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultationNoteService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final AuditLogService auditLogService;
    private final MailService mailService;
    private final ConsultationAudioStorageService audioStorageService;

    public record ConsultationNoteAudio(byte[] bytes, String contentType) {}

    public ConsultationNoteResponse getForAppointment(Long appointmentId, UserAccount actor) {
        Appointment appointment = getAppointment(appointmentId);
        enforceReadAccess(actor, appointment);

        ConsultationNote note = consultationNoteRepository.findByAppointment_Id(appointmentId).orElse(null);
        if (note == null) {
            return null;
        }
        return toResponse(note);
    }

    @Transactional
    public ConsultationNoteResponse upsertForAppointment(Long appointmentId, ConsultationNoteRequest request, UserAccount actor) {
        return upsertForAppointment(appointmentId, request, null, actor);
    }

    @Transactional
    public ConsultationNoteResponse upsertForAppointment(Long appointmentId, ConsultationNoteRequest request, MultipartFile audio, UserAccount actor) {
        Appointment appointment = getAppointment(appointmentId);
        enforceWriteAccess(actor, appointment);

        String status = appointment.getStatus() != null ? appointment.getStatus().trim() : "";
        if ("Requested".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment must be approved/scheduled before adding observations");
        }
        if ("Cancelled".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot add observations to a cancelled appointment");
        }
        if (!"Completed".equalsIgnoreCase(status)) {
            appointment = appointmentService.complete(appointmentId);
        }

        ConsultationNote note = consultationNoteRepository.findByAppointment_Id(appointmentId).orElse(null);
        boolean isNew = (note == null);

        Map<String, Object> oldSnapshot = isNew ? null : snapshot(note);

        LocalDateTime now = LocalDateTime.now();
        if (isNew) {
            note = new ConsultationNote();
            note.setCreatedAt(now);
            note.setAppointment(appointment);
            note.setDoctor(appointment.getDoctor());
            note.setPatient(appointment.getPatient());
        }

        note.setUpdatedAt(now);
        note.setObservations(request.getObservations());

        if (audio != null && !audio.isEmpty()) {
            String oldFilename = note.getAudioFilename();
            try {
                ConsultationAudioStorageService.StoredAudio stored = audioStorageService.store(audio);
                note.setAudioFilename(stored.filename());
                note.setAudioContentType(stored.contentType());
                note.setAudioOriginalFilename(stored.originalFilename());
                if (oldFilename != null && !oldFilename.isBlank() && !oldFilename.equals(stored.filename())) {
                    audioStorageService.deleteIfExists(oldFilename);
                }
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store audio recording");
            }
        }

        // Replace prescriptions (orphanRemoval=true ensures deletes)
        note.getPrescriptions().clear();
        List<PrescriptionItemRequest> items = request.getPrescriptions() != null ? request.getPrescriptions() : List.of();
        for (PrescriptionItemRequest item : items) {
            PrescriptionItem pi = PrescriptionItem.builder()
                    .consultationNote(note)
                    .medicationName(item.getMedicationName())
                    .dosage(item.getDosage())
                    .frequency(item.getFrequency())
                    .duration(item.getDuration())
                    .instructions(item.getInstructions())
                    .createdAt(now)
                    .build();
            note.getPrescriptions().add(pi);
        }

        ConsultationNote saved = consultationNoteRepository.save(Objects.requireNonNull(note));

        auditLogService.logAction(
                EntityType.CONSULTATION_NOTE,
                saved.getId(),
                isNew ? AuditAction.CREATE : AuditAction.UPDATE,
                isNew ? "Added consultation note" : "Updated consultation note",
                oldSnapshot,
                snapshot(saved)
        );

        boolean shouldSend = request.getSendEmail() == null || Boolean.TRUE.equals(request.getSendEmail());
        if (shouldSend) {
            sendToPatientEmail(saved);
        }

        return toResponse(saved);
    }

    public ConsultationNoteAudio getAudioForAppointment(Long appointmentId, UserAccount actor) {
        Appointment appointment = getAppointment(appointmentId);
        enforceReadAccess(actor, appointment);

        ConsultationNote note = consultationNoteRepository.findByAppointment_Id(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation note not found"));

        if (note.getAudioFilename() == null || note.getAudioFilename().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No audio recording found");
        }

        try {
            String contentType = (note.getAudioContentType() == null || note.getAudioContentType().isBlank())
                    ? "application/octet-stream"
                    : note.getAudioContentType();
            return new ConsultationNoteAudio(audioStorageService.read(note.getAudioFilename()), contentType);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio file not found");
        }
    }

    private Appointment getAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
    }

    private void enforceReadAccess(UserAccount actor, Appointment appointment) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Role role = actor.getRole();
        if (role == Role.ADMIN) return;

        if (role == Role.DOCTOR) {
            if (actor.getDoctor() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Doctor account is not linked to a doctor profile");
            }
            if (!appointment.getDoctor().getId().equals(actor.getDoctor().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
            }
            return;
        }

        if (role == Role.PATIENT) {
            if (actor.getPatient() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Patient account is not linked to a patient profile");
            }
            if (!appointment.getPatient().getId().equals(actor.getPatient().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
            }
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    private void enforceWriteAccess(UserAccount actor, Appointment appointment) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() != Role.DOCTOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only doctors can add observations");
        }
        if (actor.getDoctor() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Doctor account is not linked to a doctor profile");
        }
        if (!appointment.getDoctor().getId().equals(actor.getDoctor().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private ConsultationNoteResponse toResponse(ConsultationNote note) {
        return ConsultationNoteResponse.builder()
                .id(note.getId())
                .appointmentId(note.getAppointment() != null ? note.getAppointment().getId() : null)
                .doctorId(note.getDoctor() != null ? note.getDoctor().getId() : null)
                .doctorName(note.getDoctor() != null ? note.getDoctor().getName() : null)
                .patientId(note.getPatient() != null ? note.getPatient().getId() : null)
                .patientName(note.getPatient() != null ? note.getPatient().getFullName() : null)
                .patientEmail(note.getPatient() != null ? note.getPatient().getEmail() : null)
                .observations(note.getObservations())
                .hasAudio(note.getAudioFilename() != null && !note.getAudioFilename().isBlank())
                .prescriptions(toPrescriptionResponses(note))
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }

    private List<PrescriptionItemResponse> toPrescriptionResponses(ConsultationNote note) {
        if (note.getPrescriptions() == null) return List.of();
        return note.getPrescriptions().stream()
                .map(pi -> PrescriptionItemResponse.builder()
                        .id(pi.getId())
                        .medicationName(pi.getMedicationName())
                        .dosage(pi.getDosage())
                        .frequency(pi.getFrequency())
                        .duration(pi.getDuration())
                        .instructions(pi.getInstructions())
                        .build())
                .collect(Collectors.toList());
    }

    private void sendToPatientEmail(ConsultationNote note) {
        Patient patient = note.getPatient();
        if (patient == null || patient.getEmail() == null || patient.getEmail().isBlank()) {
            return;
        }

        String subject = "Doctor observations - Appointment #" + (note.getAppointment() != null ? note.getAppointment().getId() : "");

        StringBuilder body = new StringBuilder();
        body.append("Hello ").append(patient.getFullName() != null ? patient.getFullName() : "Patient").append(",\n\n");

        if (note.getDoctor() != null && note.getDoctor().getName() != null) {
            body.append("Dr. ").append(note.getDoctor().getName()).append(" has added observations for your appointment.\n\n");
        } else {
            body.append("Your doctor has added observations for your appointment.\n\n");
        }

        body.append("Observations:\n");
        body.append(note.getObservations()).append("\n\n");

        if (note.getPrescriptions() != null && !note.getPrescriptions().isEmpty()) {
            body.append("Prescribed medications:\n");
            for (PrescriptionItem item : note.getPrescriptions()) {
                body.append("- ").append(item.getMedicationName());
                if (item.getDosage() != null && !item.getDosage().isBlank()) {
                    body.append(" | Dosage: ").append(item.getDosage());
                }
                if (item.getFrequency() != null && !item.getFrequency().isBlank()) {
                    body.append(" | Frequency: ").append(item.getFrequency());
                }
                if (item.getDuration() != null && !item.getDuration().isBlank()) {
                    body.append(" | Duration: ").append(item.getDuration());
                }
                body.append("\n");
                if (item.getInstructions() != null && !item.getInstructions().isBlank()) {
                    body.append("  Instructions: ").append(item.getInstructions()).append("\n");
                }
            }
            body.append("\n");
        }

        body.append("Regards,\nHospital Management System\n");

        mailService.send(patient.getEmail(), subject, body.toString());
    }

    private Map<String, Object> snapshot(ConsultationNote note) {
        List<Map<String, Object>> prescriptions = note.getPrescriptions() == null
                ? List.of()
                : note.getPrescriptions().stream()
                .map(p -> Map.<String, Object>of(
                        "id", p.getId(),
                        "medicationName", p.getMedicationName(),
                        "dosage", p.getDosage(),
                        "frequency", p.getFrequency(),
                        "duration", p.getDuration(),
                        "instructions", p.getInstructions()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "id", note.getId(),
                "appointmentId", note.getAppointment() != null ? note.getAppointment().getId() : null,
                "doctorId", note.getDoctor() != null ? note.getDoctor().getId() : null,
                "patientId", note.getPatient() != null ? note.getPatient().getId() : null,
                "observations", note.getObservations(),
                "hasAudio", note.getAudioFilename() != null && !note.getAudioFilename().isBlank(),
                "prescriptions", prescriptions,
                "createdAt", note.getCreatedAt(),
                "updatedAt", note.getUpdatedAt()
        );
    }
}
