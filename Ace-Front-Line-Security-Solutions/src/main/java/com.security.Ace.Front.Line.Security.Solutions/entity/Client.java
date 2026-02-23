package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "client_id")
    private Integer clientId;

    // System-generated unique display code e.g. ACE-2026-001
    @Column(name = "client_code", unique = true, length = 20)
    private String clientCode;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "company_registration_no", unique = true, length = 100)
    private String companyRegistrationNo;

    // Client's own VAT registration number (printed on invoices)
    @Column(name = "vat_number", length = 50)
    private String vatNumber;

    @Column(name = "industry_type", length = 100)
    private String industryType;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // Where officers are physically deployed (may differ from registered address)
    @Column(name = "service_location", columnDefinition = "TEXT")
    private String serviceLocation;

    @Column(name = "city", length = 50)
    private String city;

    @Column(name = "contact_person_name", nullable = false, length = 100)
    private String contactPersonName;

    @Column(name = "contact_person_designation", length = 100)
    private String contactPersonDesignation;

    @Column(name = "contact_person_email", unique = true, nullable = false, length = 100)
    private String contactPersonEmail;

    @Column(name = "contact_person_phone", length = 15)
    private String contactPersonPhone;

    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "is_first_login")
    private Boolean isFirstLogin = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "service_start_date", nullable = false)
    private LocalDate serviceStartDate;

    @Column(name = "contract_duration_months")
    private Integer contractDurationMonths = 12;

    // Number of Officer-in-Charge assigned
    @Column(name = "oic_count")
    private Integer oicCount;

    // Number of Junior Security Officers assigned
    @Column(name = "jso_count")
    private Integer jsoCount;

    // Rate per 12-hour shift for OIC (e.g., Rs 2,871.93)
    @Column(name = "oic_rate_per_shift", precision = 10, scale = 2)
    private BigDecimal oicRatePerShift;

    // Rate per 12-hour shift for JSO (e.g., Rs 2,701.93)
    @Column(name = "jso_rate_per_shift", precision = 10, scale = 2)
    private BigDecimal jsoRatePerShift;

    // Overtime rate per hour
    @Column(name = "ot_rate_per_hour", precision = 10, scale = 2)
    private BigDecimal otRatePerHour;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Column(name = "recommended_officers")
    private Integer recommendedOfficers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ClientStatus status = ClientStatus.ACTIVE;

    @Column(name = "registered_by")
    private Integer registeredBy;

    @Column(name = "registered_at", updatable = false)
    private LocalDateTime registeredAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AssignedOfficer> assignedOfficers;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Invoice> invoices;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ClientFeedback> feedbacks;

    /**
     * Computed contract end date — not stored as a column.
     * Returns null if serviceStartDate or contractDurationMonths is null.
     */
    public LocalDate getContractEndDate() {
        if (serviceStartDate != null && contractDurationMonths != null) {
            return serviceStartDate.plusMonths(contractDurationMonths);
        }
        return null;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}