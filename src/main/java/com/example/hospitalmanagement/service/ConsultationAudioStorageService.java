package com.example.hospitalmanagement.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ConsultationAudioStorageService {

    @Value("${file.consultation-audio-dir:uploads/consultation-audio}")
    private String uploadDir;

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/webm",
            "audio/ogg",
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "video/webm", // Some browsers use video/webm for audio recordings
            "video/mp4",
            "application/octet-stream"
    );

    public record StoredAudio(String filename, String contentType, String originalFilename) {}

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
        
        // Final fallback if generic octet-stream
        if ("application/octet-stream".equals(baseContentType)) {
            baseContentType = "audio/webm";
        }

        if (!ALLOWED_CONTENT_TYPES.contains(baseContentType)) {
            // Log warning but allow it to proceed, preventing "crash" for unknown types
            System.out.println("Warning: Uncommon audio type received: " + contentType);
            // throw new IllegalArgumentException("Unsupported audio type: " + contentType);
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String extension = resolveExtension(file.getOriginalFilename(), baseContentType);
        String filename = UUID.randomUUID() + extension;
        Path targetLocation = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return new StoredAudio(filename, baseContentType, file.getOriginalFilename());
    }

    public byte[] read(String filename) throws IOException {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename is required");
        }
        Path path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
        return Files.readAllBytes(path);
    }

    public void deleteIfExists(String filename) {
        try {
            if (filename == null || filename.isBlank()) {
                return;
            }
            Path path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Error deleting audio file: " + e.getMessage());
        }
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
