package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.dto.VoiceMessageResponse;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.VoiceMessage;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.repository.VoiceMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VoiceMessageService {

    private final VoiceMessageRepository voiceMessageRepository;
    private final UserAccountRepository userAccountRepository;
    private final ConsultationAudioStorageService audioStorageService;

    @Transactional
    public VoiceMessageResponse sendVoiceMessage(Long recipientId, MultipartFile audio, UserAccount sender) {
        UserAccount recipient = userAccountRepository.findById(recipientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        if (audio == null || audio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio file is required");
        }

        try {
            // Determine content type
            String contentType = audio.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "audio/webm";
            }
            String normalizedContentType = contentType.trim().toLowerCase().split(";", 2)[0].trim();
            if ("application/octet-stream".equals(normalizedContentType)) {
                normalizedContentType = "audio/webm";
            }

            // Read audio bytes to store in DB (cloud-safe storage)
            byte[] audioBytes = audio.getBytes();

            // Also try to persist to filesystem as a backup (will fail gracefully on ephemeral filesystems)
            String filename = "voice-db-" + System.currentTimeMillis();
            try {
                ConsultationAudioStorageService.StoredAudio stored = audioStorageService.store(audio);
                filename = stored.filename();
            } catch (Exception fsEx) {
                log.warn("Could not write audio to filesystem (ephemeral env), using DB storage only: {}", fsEx.getMessage());
            }

            VoiceMessage message = VoiceMessage.builder()
                    .sender(sender)
                    .recipient(recipient)
                    .audioFilename(filename)
                    .audioContentType(normalizedContentType)
                    .originalFilename(audio.getOriginalFilename())
                    .timestamp(LocalDateTime.now())
                    .isRead(false)
                    .audioData(audioBytes)
                    .build();

            VoiceMessage saved = voiceMessageRepository.save(message);
            return toResponse(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read audio data");
        }
    }

    public List<VoiceMessageResponse> getInbox(UserAccount user) {
        return voiceMessageRepository.findByRecipientOrderByTimestampDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoiceMessageResponse> getSentMessages(UserAccount user) {
        return voiceMessageRepository.findBySenderOrderByTimestampDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(UserAccount user) {
        return voiceMessageRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long messageId, UserAccount user) {
        VoiceMessage message = voiceMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!message.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        message.setRead(true);
        voiceMessageRepository.save(message);
    }

    public VoiceMessage getVoiceMessage(Long messageId, UserAccount user) {
        VoiceMessage message = voiceMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));

        if (!message.getSender().getId().equals(user.getId()) && !message.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return message;
    }

    /**
     * Retrieve audio bytes: prefer DB storage (cloud-safe), fall back to filesystem for legacy messages.
     */
    public byte[] getAudioContent(VoiceMessage message) {
        // 1. Try DB storage first (reliable on cloud platforms like Render/Railway)
        if (message.getAudioData() != null && message.getAudioData().length > 0) {
            return message.getAudioData();
        }
        // 2. Fall back to filesystem (local dev or messages sent before this upgrade)
        try {
            return audioStorageService.read(message.getAudioFilename());
        } catch (IOException e) {
            log.error("Audio file not found in DB or filesystem for message id={}: {}", message.getId(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio file not found");
        }
    }

    private VoiceMessageResponse toResponse(VoiceMessage message) {
        String senderName = getUserName(message.getSender());
        String recipientName = getUserName(message.getRecipient());

        return VoiceMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(senderName)
                .recipientId(message.getRecipient().getId())
                .recipientName(recipientName)
                .audioContentType(message.getAudioContentType())
                .timestamp(message.getTimestamp())
                .isRead(message.isRead())
                .build();
    }

    private String getUserName(UserAccount user) {
        if (user.getDoctor() != null) return "Dr. " + user.getDoctor().getName();
        if (user.getPatient() != null) return user.getPatient().getFullName();
        return user.getUsername();
    }
}
