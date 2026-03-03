package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientDashboardResponse {

    private Integer clientId;
    private String companyName;
    private String status;
    private Integer activeOfficersCount;
    private Double totalOutstanding;
    private Integer overdueInvoicesCount;
    private Integer pendingPaymentsCount;
    private Double monthlyBaseFee;
    private String riskLevel;
    private String serviceLocation;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private String contractStatus;     // ACTIVE / EXPIRING_SOON / EXPIRED
    private Integer oicCount;
    private Integer jsoCount;
    private String currentInvoiceStatus;
    private Double currentInvoiceAmount;
    private LocalDate nextDueDate;
    private LocalDate lastPaymentDate;
    private Integer daysUntilDue;      // countdown shown to client
}