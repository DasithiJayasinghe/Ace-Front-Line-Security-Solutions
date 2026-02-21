package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ClientRegistrationRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 200)
    private String companyName;

    @Size(max = 100)
    private String companyRegistrationNo;

    @Size(max = 100)
    private String industryType;

    private String address;

    @Size(max = 50)
    private String city;

    @NotBlank(message = "Contact person name is required")
    @Size(max = 100)
    private String contactPersonName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String contactPersonEmail;

    @Size(max = 15)
    private String contactPersonPhone;

    @NotNull(message = "Service start date is required")
    private LocalDate serviceStartDate;

    private Integer contractDurationMonths;

    @NotNull(message = "Monthly base fee is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base fee must be positive")
    private Double monthlyBaseFee;

    @NotNull(message = "OT rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "OT rate must be positive")
    private Double otRatePerHour;

    private String riskLevel;

    private Integer recommendedOfficers;
}