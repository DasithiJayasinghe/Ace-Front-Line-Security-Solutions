package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ClientResponse {

    private Integer clientId;
    private String clientCode;
    private String companyName;
    private String companyRegistrationNo;
    private String vatNumber;
    private String industryType;
    private String address;
    private String serviceLocation;
    private String city;
    private String contactPersonName;
    private String contactPersonDesignation;
    private String contactPersonEmail;
    private String contactPersonPhone;
    private String username;
    private LocalDate serviceStartDate;
    private Integer contractDurationMonths;
    private LocalDate contractEndDate;
    private Integer oicCount;
    private Integer jsoCount;
    private BigDecimal oicRatePerShift;
    private BigDecimal jsoRatePerShift;
    private BigDecimal otRatePerHour;
    private String riskLevel;
    private Integer recommendedOfficers;
    private String status;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
    private Integer activeOfficersCount;
    private Double totalOutstanding;
    // NOTE: temporaryPassword is intentionally EXCLUDED.
    // Temporary credentials are sent via email only — never returned in API responses.
}