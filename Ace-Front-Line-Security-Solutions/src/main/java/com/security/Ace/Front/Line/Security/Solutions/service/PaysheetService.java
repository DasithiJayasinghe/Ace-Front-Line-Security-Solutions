package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaysheetRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdminPayrollRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanDeduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.PayrollStatus;
import com.security.Ace.Front.Line.Security.Solutions.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanDeductionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.PaysheetRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class PaysheetService {

    private final PaysheetRepository paysheetRepository;
    private final UserRepository userRepository;
    private final LoanDeductionRepository loanDeductionRepository;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Paysheet generatePaysheet(String accountExecUsername, PaysheetRequest request) {
        User accountExec = userRepository.findByUsername(accountExecUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Account executive not found"));

        User employee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (paysheetRepository.findByUserAndPayMonth(employee, request.getPayMonth()).isPresent()) {
            throw new BusinessException("Paysheet already generated for this month");
        }

        double basicSalary = request.getBasicSalary() != null ? request.getBasicSalary()
                : (employee.getBasicSalary() != null ? employee.getBasicSalary() : 0.0);
        double otAmount = request.getOtAmount() != null ? request.getOtAmount() : 0.0;
        double allowances = request.getAllowances() != null ? request.getAllowances() : 0.0;
        double otherDeductions = request.getOtherDeductions() != null ? request.getOtherDeductions() : 0.0;

        // Auto-calculate loan deductions: sum pending deductions for this user & month
        double loanDeduction;
        if (request.getLoanDeduction() != null) {
            loanDeduction = request.getLoanDeduction();
        } else {
            loanDeduction = loanDeductionRepository
                    .sumPendingDeductionsForUserAndMonth(employee, request.getPayMonth());
        }

        // Auto-calculate advance deductions: sum approved advances for this user & month
        double advanceDeduction;
        if (request.getAdvanceDeduction() != null) {
            advanceDeduction = request.getAdvanceDeduction();
        } else {
            List<AdvanceRequest> approvedAdvances = advanceRequestRepository
                    .findByUserAndForMonthAndStatus(employee, request.getPayMonth(), RequestStatus.APPROVED);
            advanceDeduction = approvedAdvances.stream()
                    .mapToDouble(AdvanceRequest::getAmount)
                    .sum();
        }

        double netSalary = basicSalary + otAmount + allowances - loanDeduction - advanceDeduction - otherDeductions;

        Paysheet paysheet = Paysheet.builder()
                .user(employee)
                .payMonth(request.getPayMonth())
                .basicSalary(basicSalary)
                .otAmount(otAmount)
                .allowances(allowances)
                .loanDeduction(loanDeduction)
                .advanceDeduction(advanceDeduction)
                .otherDeductions(otherDeductions)
                .netSalary(netSalary)
                .remarks(request.getRemarks())
                .generatedBy(accountExec)
                .build();

        return paysheetRepository.save(paysheet);
    }

    @Transactional
    public Paysheet createAdminPayroll(String accountExecUsername, AdminPayrollRequest request) {
        User accountExec = userRepository.findByUsername(accountExecUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Account executive not found"));

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // Serialize allowancesDetail to JSON string
        String allowancesDetailJson = null;
        try {
            if (request.getAllowancesDetail() != null && !request.getAllowancesDetail().isEmpty()) {
                allowancesDetailJson = objectMapper.writeValueAsString(request.getAllowancesDetail());
            }
        } catch (Exception e) {
            // If JSON serialization fails, continue without it
        }

        Paysheet paysheet = Paysheet.builder()
                .user(employee)
                .payMonth(request.getPayMonth())
                .basicSalary(request.getBasicSalary())
                .otAmount(request.getOtAmount())
                .allowances(request.getAllowances())
                .allowancesDetail(allowancesDetailJson)
                .loanDeduction(request.getLoanDeduction())
                .advanceDeduction(request.getAdvanceDeduction())
                .otherDeductions(request.getOtherDeductions())
                .netSalary(request.getBasicSalary() + (request.getOtAmount() != null ? request.getOtAmount() : 0.0) 
                        + request.getAllowances() - (request.getLoanDeduction() != null ? request.getLoanDeduction() : 0.0) 
                        - (request.getAdvanceDeduction() != null ? request.getAdvanceDeduction() : 0.0) 
                        - (request.getOtherDeductions() != null ? request.getOtherDeductions() : 0.0))
                .remarks(request.getRemarks())
                .generatedBy(accountExec)
                .status(PayrollStatus.DRAFT)
                .build();

        return paysheetRepository.save(paysheet);
    }

    @Transactional
    public Paysheet submitForApproval(Long payrollId) {
        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        if (!paysheet.getStatus().equals(PayrollStatus.DRAFT)) {
            throw new BusinessException("Only draft payrolls can be submitted for approval");
        }

        paysheet.setStatus(PayrollStatus.SUBMITTED_TO_DIRECTOR);
        paysheet.setSubmittedAt(LocalDateTime.now());
        return paysheetRepository.save(paysheet);
    }

    public Paysheet getPayrollById(Long payrollId) {
        return paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + payrollId));
    }

    public List<Paysheet> getPendingApprovals() {
        return paysheetRepository.findByStatus(PayrollStatus.SUBMITTED_TO_DIRECTOR);
    }

    @Transactional
    public Paysheet approvePayroll(String directorUsername, Long payrollId, Map<String, Object> body) {
        User director = userRepository.findByUsername(directorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Director not found"));

        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        // If body contains updated allowances, update it
        if (body.containsKey("allowances")) {
            Double newAllowances = Double.valueOf(body.get("allowances").toString());
            paysheet.setAllowances(newAllowances);
        }

        // Recalculate net salary
        paysheet.setNetSalary(paysheet.getBasicSalary() + (paysheet.getOtAmount() != null ? paysheet.getOtAmount() : 0.0) 
                + paysheet.getAllowances() - (paysheet.getLoanDeduction() != null ? paysheet.getLoanDeduction() : 0.0) 
                - (paysheet.getAdvanceDeduction() != null ? paysheet.getAdvanceDeduction() : 0.0) 
                - (paysheet.getOtherDeductions() != null ? paysheet.getOtherDeductions() : 0.0));

        // Set approval metadata
        paysheet.setApprovedBy(director);
        paysheet.setApprovedAt(LocalDateTime.now());
        
        if (body.containsKey("approvalRemarks")) {
            paysheet.setApprovalRemarks(body.get("approvalRemarks").toString());
        }

        paysheet.setStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
        
        // Notify the account executive
        notificationService.notifyUser(paysheet.getGeneratedBy().getId(), 
            "Your payroll for " + paysheet.getUser().getFullName() + " (" + paysheet.getPayMonth() + ") has been approved by the director.");

        return paysheetRepository.save(paysheet);
    }

    @Transactional
    public Paysheet rejectPayroll(String directorUsername, Long payrollId, String reason) {
        User director = userRepository.findByUsername(directorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Director not found"));

        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        paysheet.setStatus(PayrollStatus.REJECTED_BY_DIRECTOR);
        paysheet.setRejectionReason(reason);
        paysheet.setRejectedAt(LocalDateTime.now());
        paysheet.setApprovedBy(director);

        // Notify the account executive
        notificationService.notifyUser(paysheet.getGeneratedBy().getId(), 
            "Your payroll for " + paysheet.getUser().getFullName() + " (" + paysheet.getPayMonth() + ") has been rejected. Reason: " + reason);

        return paysheetRepository.save(paysheet);
    }

    public List<Paysheet> getApprovedList() {
        return paysheetRepository.findByStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
    }

    @Transactional
    public Paysheet sendToBank(Long payrollId) {
        Paysheet paysheet = paysheetRepository.findById(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));

        if (!paysheet.getStatus().equals(PayrollStatus.APPROVED_BY_DIRECTOR)) {
            throw new BusinessException("Only approved payrolls can be sent to bank");
        }

        paysheet.setStatus(PayrollStatus.SENT_TO_BANK);
        paysheet.setSentToBankAt(LocalDateTime.now());
        paysheetRepository.save(paysheet);

        // Notify the employee
        notificationService.notifyUser(paysheet.getUser().getId(), 
            "Your salary for " + paysheet.getPayMonth() + " (LKR " + paysheet.getNetSalary() + ") has been sent to the bank. Bank: " + 
            (paysheet.getUser().getBankName() != null ? paysheet.getUser().getBankName() : "N/A"));

        return paysheet;
    }

    @Transactional
    public void proceedAllToBank(HttpServletResponse response) throws IOException {
        List<Paysheet> approvedPayrolls = paysheetRepository.findByStatus(PayrollStatus.APPROVED_BY_DIRECTOR);
        if (approvedPayrolls.isEmpty()) {
            throw new BusinessException("No approved payrolls to process");
        }

        // Generate Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payroll Bank Submission");
            
            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Employee Name");
            header.createCell(1).setCellValue("Employee ID");
            header.createCell(2).setCellValue("Bank Name");
            header.createCell(3).setCellValue("Account Number");
            header.createCell(4).setCellValue("Branch");
            header.createCell(5).setCellValue("Net Salary");
            header.createCell(6).setCellValue("Month");

            int rowNum = 1;
            for (Paysheet p : approvedPayrolls) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getUser().getFullName());
                row.createCell(1).setCellValue(String.valueOf(p.getUser().getId()));
                row.createCell(2).setCellValue(p.getUser().getBankName() != null ? p.getUser().getBankName() : "N/A");
                row.createCell(3).setCellValue(p.getUser().getBankAccountNumber() != null ? p.getUser().getBankAccountNumber() : "N/A");
                row.createCell(4).setCellValue(p.getUser().getBankBranch() != null ? p.getUser().getBankBranch() : "N/A");
                row.createCell(5).setCellValue(p.getNetSalary());
                row.createCell(6).setCellValue(p.getPayMonth());

                // Send each payroll to bank
                sendToBank(p.getId());
            }

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=payroll_bank_submission_" + java.time.LocalDate.now() + ".xlsx");
            workbook.write(response.getOutputStream());
            response.flushBuffer();
        }
    }

    public List<Paysheet> getMyPaysheets(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return paysheetRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Paysheet> getPaysheetsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return paysheetRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Paysheet> getAllPaysheets() {
        return paysheetRepository.findAll();
    }

    // ============ MAPPER ============
    public PayrollResponse mapToPayrollResponse(Paysheet paysheet) {
        Map<String, Double> allowancesDetail = null;
        try {
            if (paysheet.getAllowancesDetail() != null && !paysheet.getAllowancesDetail().isEmpty()) {
                allowancesDetail = objectMapper.readValue(paysheet.getAllowancesDetail(), 
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Double.class));
            }
        } catch (Exception e) {
            // If JSON deserialization fails, continue without it
        }

        return PayrollResponse.builder()
                .id(paysheet.getId())
                .employeeId(paysheet.getUser().getId())
                .employeeName(paysheet.getUser().getFullName())
                .employeeRole(paysheet.getUser().getRole().toString())
                .payMonth(paysheet.getPayMonth())
                .payYear(paysheet.getPayYear())
                .basicSalary(paysheet.getBasicSalary())
                .otAmount(paysheet.getOtAmount())
                .allowances(paysheet.getAllowances())
                .allowancesDetail(allowancesDetail)
                .loanDeduction(paysheet.getLoanDeduction())
                .advanceDeduction(paysheet.getAdvanceDeduction())
                .otherDeductions(paysheet.getOtherDeductions())
                .netSalary(paysheet.getNetSalary())
                .status(paysheet.getStatus())
                .submittedByName(paysheet.getGeneratedBy() != null ? paysheet.getGeneratedBy().getFullName() : null)
                .submittedAt(paysheet.getSubmittedAt())
                .approvedByName(paysheet.getApprovedBy() != null ? paysheet.getApprovedBy().getFullName() : null)
                .approvedAt(paysheet.getApprovedAt())
                .sentToBankAt(paysheet.getSentToBankAt())
                .approvalRemarks(paysheet.getApprovalRemarks())
                .rejectionReason(paysheet.getRejectionReason())
                .remarks(paysheet.getRemarks())
                .createdAt(paysheet.getCreatedAt())
                .updatedAt(paysheet.getCreatedAt())
                .build();
    }
}
