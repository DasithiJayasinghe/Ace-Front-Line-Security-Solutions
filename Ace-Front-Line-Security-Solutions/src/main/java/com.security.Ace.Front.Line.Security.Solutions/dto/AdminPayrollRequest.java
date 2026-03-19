package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.enums.PayrollStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class AdminPayrollRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotBlank(message = "Pay month is required (format: YYYY-MM)")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Pay month must be in YYYY-MM format")
    private String payMonth;

    @NotNull(message = "Basic salary is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Basic salary must be greater than 0")
    private Double basicSalary;

    @DecimalMin(value = "0.0", message = "OT amount must be non-negative")
    private Double otAmount = 0.0;

    @NotNull(message = "Total allowances is required")
    @DecimalMin(value = "0.0", message = "Allowances must be non-negative")
    private Double allowances;

    // Allowance breakdown (JSON map of allowance type -> amount)
    private Map<String, Double> allowancesDetail;

    @DecimalMin(value = "0.0", message = "Loan deduction must be non-negative")
    private Double loanDeduction = 0.0;

    @DecimalMin(value = "0.0", message = "Advance deduction must be non-negative")
    private Double advanceDeduction = 0.0;

    @DecimalMin(value = "0.0", message = "Other deductions must be non-negative")
    private Double otherDeductions = 0.0;

    private String remarks;
}
