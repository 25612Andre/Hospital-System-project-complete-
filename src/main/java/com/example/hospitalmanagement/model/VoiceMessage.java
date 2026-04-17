package com.example.hospitalmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "voice_messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class VoiceMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_id")
    private UserAccount sender;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_id")
    private UserAccount recipient;

    @Column(nullable = false)
    private String audioFilename;

    @Column(nullable = false)
    private String audioContentType;

    private String originalFilename;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Builder.Default
    private boolean isRead = false;

    /**
     * Stores audio binary directly in the database.
     * This is more reliable on cloud platforms (Render, Railway, etc.)
     * where the filesystem is ephemeral.
     */
    @Lob
    @Column(name = "audio_data", columnDefinition = "BYTEA")
    private byte[] audioData;
}
