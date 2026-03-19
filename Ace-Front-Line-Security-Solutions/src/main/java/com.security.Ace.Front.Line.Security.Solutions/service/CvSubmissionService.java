package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.CvSubmissionDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.CvSubmission;
import com.security.Ace.Front.Line.Security.Solutions.repository.CvSubmissionRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.FileUploadUtil;
import com.security.Ace.Front.Line.Security.Solutions.util.FileUploadException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CvSubmissionService {

    @Autowired
    private CvSubmissionRepository cvSubmissionRepository;

    /**
     * Submit a new CV (public)
     */
    public CvSubmissionDTO submitCv(String fullName, String email, String phoneNumber, MultipartFile cvFile) {
        // Upload file using existing utility
        String cvFilePath = null;
        if (cvFile != null && !cvFile.isEmpty()) {
            try {
                cvFilePath = FileUploadUtil.uploadCVFile(cvFile);
            } catch (FileUploadException e) {
                throw new RuntimeException("Failed to upload CV: " + e.getMessage(), e);
            }
        }

        CvSubmission submission = new CvSubmission();
        submission.setFullName(fullName);
        submission.setEmail(email);
        submission.setPhoneNumber(phoneNumber);
        submission.setCvFilePath(cvFilePath);

        CvSubmission saved = cvSubmissionRepository.save(submission);
        return toDTO(saved);
    }

    /**
     * Get all CV submissions (for ops manager)
     */
    public List<CvSubmissionDTO> getAllSubmissions() {
        return cvSubmissionRepository.findAllByOrderBySubmittedDateDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single submission by ID
     */
    public CvSubmission getSubmissionEntity(Long id) {
        return cvSubmissionRepository.findById(id).orElse(null);
    }

    private CvSubmissionDTO toDTO(CvSubmission entity) {
        CvSubmissionDTO dto = new CvSubmissionDTO();
        dto.setId(entity.getId());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setCvFilePath(entity.getCvFilePath());
        dto.setSubmittedDate(entity.getSubmittedDate() != null ? entity.getSubmittedDate().toString() : null);
        return dto;
    }
}
