package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClientUpdateRequest {

    @Size(max = 200)
    private String companyName;

    @Size(max = 50)
    private String vatNumber;

    private String address;

    private String serviceLocation;

    @Size(max = 50)
    private String city;

    @Size(max = 100)
    private String contactPersonName;

    @Size(max = 100)
    private String contactPersonDesignation;

    @Email
    @Size(max = 100)
    private String contactPersonEmail;

    @Size(max = 15)
    private String contactPersonPhone;

    @Min(value = 0)
    private Integer oicCount;

    @Min(value = 0)
    private Integer jsoCount;

    @DecimalMin(value = "0.01")
    private BigDecimal oicRatePerShift;

    @DecimalMin(value = "0.01")
    private BigDecimal jsoRatePerShift;

    @DecimalMin(value = "0.01")
    private BigDecimal otRatePerHour;

    private BigDecimal oicOtRatePerHour;
    private BigDecimal jsoOtRatePerHour;

    private Integer contractDurationMonths;
    private String riskLevel;
    private Integer recommendedOfficers;
}