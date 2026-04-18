package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.dto.VoiceMessageResponse;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.service.VoiceMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/voice-messages")
@RequiredArgsConstructor
@Slf4j
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class VoiceMessageController {

    private final VoiceMessageService voiceMessageService;
    private final UserAccountRepository userAccountRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<VoiceMessageResponse> sendVoiceMessage(
            @RequestParam("recipientId") Long recipientId,
            @RequestParam("audio") MultipartFile audio,
            Principal principal) {
        UserAccount sender = requireActor(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(voiceMessageService.sendVoiceMessage(recipientId, audio, sender));
    }

    @GetMapping("/inbox")
    public List<VoiceMessageResponse> getInbox(Principal principal) {
        UserAccount user = requireActor(principal);
        return voiceMessageService.getInbox(user);
    }

    @GetMapping("/sent")
    public List<VoiceMessageResponse> getSent(Principal principal) {
        UserAccount user = requireActor(principal);
        return voiceMessageService.getSentMessages(user);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(Principal principal) {
        UserAccount user = requireActor(principal);
        return voiceMessageService.getUnreadCount(user);
    }

    @PutMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @org.springframework.transaction.annotation.Transactional
    public void markAsRead(@PathVariable Long id, Principal principal) {
        UserAccount user = requireActor(principal);
        voiceMessageService.markAsRead(id, user);
    }

    @GetMapping("/{id}/audio")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<byte[]> getAudio(@PathVariable Long id, Principal principal) {
        log.info("Requesting audio for voice message id={}", id);
        UserAccount user = requireActor(principal);
        var message = voiceMessageService.getVoiceMessage(id, user);
        log.info("Message found, fetching audio content... (filename={}, dataLength={})", 
            message.getAudioFilename(), message.getAudioData() != null ? message.getAudioData().length : 0);
        byte[] audio = voiceMessageService.getAudioContent(message);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(message.getAudioContentType());
        } catch (Exception e) {
            mediaType = MediaType.parseMediaType("audio/webm");
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(audio);
    }

    private UserAccount requireActor(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userAccountRepository.findByUsernameIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
    }
}
