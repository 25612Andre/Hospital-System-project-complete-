package com.example.hospitalmanagement.controller;

import jakarta.validation.Valid;
import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.hospitalmanagement.dto.ConsultationNoteRequest;
import com.example.hospitalmanagement.dto.ConsultationNoteResponse;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.service.ConsultationNoteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class AppointmentConsultationController {

    private final ConsultationNoteService consultationNoteService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping("/{appointmentId}/consultation-note")
    public ResponseEntity<ConsultationNoteResponse> get(@PathVariable @NonNull Long appointmentId, Principal principal) {
        UserAccount actor = requireActor(principal);
        ConsultationNoteResponse note = consultationNoteService.getForAppointment(appointmentId, actor);
        if (note == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        return ResponseEntity.ok(note);
    }

    @PutMapping("/{appointmentId}/consultation-note")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ConsultationNoteResponse> upsert(@PathVariable @NonNull Long appointmentId,
                                                           @RequestBody @Valid @NonNull ConsultationNoteRequest request,
                                                           Principal principal) {
        UserAccount actor = requireActor(principal);
        return ResponseEntity.ok(consultationNoteService.upsertForAppointment(appointmentId, request, actor));
    }

    @PutMapping(value = "/{appointmentId}/consultation-note", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ConsultationNoteResponse> upsertMultipart(@PathVariable @NonNull Long appointmentId,
                                                                    @RequestPart("data") @Valid @NonNull ConsultationNoteRequest request,
                                                                    @RequestPart(value = "audio", required = false) MultipartFile audio,
                                                                    Principal principal) {
        UserAccount actor = requireActor(principal);
        return ResponseEntity.ok(consultationNoteService.upsertForAppointment(appointmentId, request, audio, actor));
    }

    @GetMapping("/{appointmentId}/consultation-note/audio")
    public ResponseEntity<byte[]> audio(@PathVariable @NonNull Long appointmentId, Principal principal) {
        UserAccount actor = requireActor(principal);
        var audio = consultationNoteService.getAudioForAppointment(appointmentId, actor);
        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(audio.contentType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Cache-Control", "no-store")
                .body(audio.bytes());
    }

    private UserAccount requireActor(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userAccountRepository.findByUsernameIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
    }
}
