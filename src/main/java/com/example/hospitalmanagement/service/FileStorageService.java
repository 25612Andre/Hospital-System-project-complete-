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
public class FileStorageService {

    private final StoredFileRepository storedFileRepository;

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/pjpeg",
            "image/png",
            "image/x-png",
            "image/gif",
            "image/webp"
    );

    @Transactional
    public String storeFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + fileExtension;

        // Store file in DB
        StoredFile storedFile = StoredFile.builder()
                .filename(filename)
                .contentType(file.getContentType())
                .data(file.getBytes())
                .build();
        
        storedFileRepository.save(storedFile);

        // Return URL that our controller will handle
        return "/api/files/download/" + filename;
    }

    @Transactional
    public void deleteFile(String fileUrl) {
        if (fileUrl != null && fileUrl.contains("/api/files/download/")) {
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            storedFileRepository.deleteByFilename(filename);
        }
    }

    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }

        if (!ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return false;
        }

        return file.getSize() <= MAX_SIZE_BYTES;
    }
}
