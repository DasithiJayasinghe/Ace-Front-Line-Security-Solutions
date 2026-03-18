package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.security.Ace.Front.Line.Security.Solutions.enums.PayrollStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "paysheets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paysheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String payMonth; // e.g. "2024-01"
    private int payYear;

    private Double basicSalary;
    private Double otAmount;
    private Double allowances;
    private Double loanDeduction;
    private Double advanceDeduction;
    private Double otherDeductions;
    private Double netSalary;

    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private User generatedBy;

    @Enumerated(EnumType.STRING)
    private PayrollStatus status = PayrollStatus.PENDING;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}