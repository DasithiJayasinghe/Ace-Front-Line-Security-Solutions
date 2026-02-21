package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ClientResponse {

    private Integer clientId;
    private String companyName;
    private String companyRegistrationNo;
    private String industryType;
    private String address;
    private String city;
    private String contactPersonName;
    private String contactPersonEmail;
    private String contactPersonPhone;
    private String username;
    private LocalDate serviceStartDate;
    private Integer contractDurationMonths;
    private Double monthlyBaseFee;
    private Double otRatePerHour;
    private String riskLevel;
    private Integer recommendedOfficers;
    private String status;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
    private Integer activeOfficersCount;
    private Double totalOutstanding;
    private String temporaryPassword;
}