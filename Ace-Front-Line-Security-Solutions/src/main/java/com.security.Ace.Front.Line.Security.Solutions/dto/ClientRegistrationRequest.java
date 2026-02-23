package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ClientRegistrationRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 200)
    private String companyName;

    @Size(max = 100)
    private String companyRegistrationNo;

    // Client's own VAT registration — printed on invoices
    @Size(max = 50)
    private String vatNumber;

    @Size(max = 100)
    private String industryType;

    private String address;

    @NotBlank(message = "Service location is required")
    private String serviceLocation;

    @Size(max = 50)
    private String city;

    @NotBlank(message = "Contact person name is required")
    @Size(max = 100)
    private String contactPersonName;

    @Size(max = 100)
    private String contactPersonDesignation;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String contactPersonEmail;

    @Size(max = 15)
    private String contactPersonPhone;

    @NotNull(message = "Service start date is required")
    private LocalDate serviceStartDate;

    private Integer contractDurationMonths;

    // Number of Officer-in-Charge assigned
    @NotNull(message = "OIC count is required")
    @Min(value = 0, message = "OIC count cannot be negative")
    private Integer oicCount;

    // Number of Junior Security Officers assigned
    @NotNull(message = "JSO count is required")
    @Min(value = 0, message = "JSO count cannot be negative")
    private Integer jsoCount;

    // Rate per 12-hour shift for OIC (e.g., 2871.93)
    @NotNull(message = "OIC rate per shift is required")
    @DecimalMin(value = "0.01", message = "OIC rate must be positive")
    private BigDecimal oicRatePerShift;

    // Rate per 12-hour shift for JSO (e.g., 2701.93)
    @NotNull(message = "JSO rate per shift is required")
    @DecimalMin(value = "0.01", message = "JSO rate must be positive")
    private BigDecimal jsoRatePerShift;

    @NotNull(message = "OT rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "OT rate must be positive")
    private BigDecimal otRatePerHour;

    private String riskLevel;

    private Integer recommendedOfficers;
}