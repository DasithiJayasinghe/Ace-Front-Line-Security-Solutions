package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
/**
 * STAFF AUTHENTICATION
 */
@Service
public class FileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    public String storePhoto(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException("Only image files are allowed");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/photos/" + filename;
        } catch (IOException ex) {
            throw new BusinessException("Failed to store file: " + ex.getMessage());
        }
    }

    public void deleteFile(String filePath) {
        if (filePath == null) return;
        try {
            Path path = Paths.get("." + filePath);
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
    }
}