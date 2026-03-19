package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "cv_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CvSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(name = "cv_file_path")
    private String cvFilePath;

    @Column(name = "submitted_date", nullable = false, updatable = false)
    private LocalDateTime submittedDate;

    @PrePersist
    protected void onCreate() {
        submittedDate = LocalDateTime.now();
    }
}
