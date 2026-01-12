package com.example.hospitalmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceMessageResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String audioContentType;
    private LocalDateTime timestamp;
    private boolean isRead;
}
