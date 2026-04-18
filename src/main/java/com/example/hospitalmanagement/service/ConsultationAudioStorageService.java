package com.example.hospitalmanagement.service;

import com.example.hospitalmanagement.model.StoredFile;
import com.example.hospitalmanagement.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsultationAudioStorageService {

    private final StoredFileRepository storedFileRepository;

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/webm",
            "audio/ogg",
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "video/webm",
            "video/mp4",
            "application/octet-stream"
    );

    public record StoredAudio(String filename, String contentType, String originalFilename) {}

    @Transactional
    public StoredAudio store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty audio file");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Audio file is too large");
        }
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "audio/webm";
        }
        String normalizedContentType = contentType.trim().toLowerCase();
        String baseContentType = normalizedContentType.split(";", 2)[0].trim();
        
        if ("application/octet-stream".equals(baseContentType)) {
            baseContentType = "audio/webm";
        }

        String extension = resolveExtension(file.getOriginalFilename(), baseContentType);
        String filename = UUID.randomUUID() + extension;

        StoredFile storedFile = StoredFile.builder()
                .filename(filename)
                .contentType(baseContentType)
                .data(file.getBytes())
                .build();
        
        storedFileRepository.save(storedFile);

        return new StoredAudio(filename, baseContentType, file.getOriginalFilename());
    }

    @Transactional(readOnly = true)
    public byte[] read(String filename) throws IOException {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename is required");
        }
        return storedFileRepository.findByFilename(filename)
                .map(StoredFile::getData)
                .orElseThrow(() -> new IOException("Audio file not found: " + filename));
    }

    @Transactional
    public void deleteIfExists(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        storedFileRepository.deleteByFilename(filename);
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).trim();
            if (ext.length() <= 10) {
                return ext;
            }
        }
        return switch (contentType) {
            case "audio/webm", "video/webm" -> ".webm";
            case "audio/ogg" -> ".ogg";
            case "audio/mpeg" -> ".mp3";
            case "audio/wav" -> ".wav";
            case "audio/mp4", "video/mp4" -> ".m4a";
            default -> ".webm";
        };
    }
}
