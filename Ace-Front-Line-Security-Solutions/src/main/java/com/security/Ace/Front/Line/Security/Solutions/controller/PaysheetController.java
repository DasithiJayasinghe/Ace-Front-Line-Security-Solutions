package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.PaysheetRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.AdminPayrollRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.service.PaysheetService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paysheets")
@RequiredArgsConstructor
public class PaysheetController {
    /**
     * paysheet controller
     */
    private final PaysheetService paysheetService;

    @PostMapping
    @PreAuthorize("hasRole('ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<Paysheet>> generatePaysheet(
            Authentication authentication,
            @Valid @RequestBody PaysheetRequest request) {
        Paysheet paysheet = paysheetService.generatePaysheet(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Paysheet generated", paysheet));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Paysheet>>> getMyPaysheets(Authentication authentication) {
        List<Paysheet> paysheets = paysheetService.getMyPaysheets(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Paysheets retrieved", paysheets));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN', 'OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<List<Paysheet>>> getPaysheetsByUser(@PathVariable Long userId) {
        List<Paysheet> paysheets = paysheetService.getPaysheetsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Paysheets retrieved", paysheets));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<Paysheet>>> getAllPaysheets() {
        List<Paysheet> paysheets = paysheetService.getAllPaysheets();
        return ResponseEntity.ok(ApiResponse.success("All paysheets retrieved", paysheets));
    }

    // Admin Payroll Flow Endpoints
    
    @PostMapping("/admin-payroll/create")
    @PreAuthorize("hasRole('ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<PayrollResponse>> createAdminPayroll(
            Authentication authentication,
            @Valid @RequestBody AdminPayrollRequest request) {
        Paysheet paysheet = paysheetService.createAdminPayroll(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Admin payroll created", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @PostMapping("/admin-payroll/{payrollId}/submit-for-approval")
    @PreAuthorize("hasRole('ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<PayrollResponse>> submitForApproval(
            @PathVariable Long payrollId) {
        Paysheet paysheet = paysheetService.submitForApproval(payrollId);
        return ResponseEntity.ok(ApiResponse.success("Payroll submitted for director approval", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @GetMapping("/admin-payroll/{payrollId}")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'DIRECTOR', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PayrollResponse>> getPayrollById(
            @PathVariable Long payrollId) {
        Paysheet paysheet = paysheetService.getPayrollById(payrollId);
        return ResponseEntity.ok(ApiResponse.success("Payroll retrieved", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @GetMapping("/admin-payroll/pending-approvals")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPendingApprovals() {
        List<Paysheet> paysheets = paysheetService.getPendingApprovals();
        List<PayrollResponse> responses = paysheets.stream().map(paysheetService::mapToPayrollResponse).toList();
        return ResponseEntity.ok(ApiResponse.success("Pending approvals retrieved", responses));
    }

    @PostMapping("/admin-payroll/{payrollId}/approve")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<ApiResponse<PayrollResponse>> approvePayroll(
            Authentication authentication,
            @PathVariable Long payrollId,
            @RequestBody Map<String, Object> body) {
        Paysheet paysheet = paysheetService.approvePayroll(authentication.getName(), payrollId, body);
        return ResponseEntity.ok(ApiResponse.success("Payroll approved", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @PostMapping("/admin-payroll/{payrollId}/reject")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<ApiResponse<PayrollResponse>> rejectPayroll(
            Authentication authentication,
            @PathVariable Long payrollId,
            @RequestBody Map<String, String> body) {
        String reason = body.get("rejectionReason");
        Paysheet paysheet = paysheetService.rejectPayroll(authentication.getName(), payrollId, reason);
        return ResponseEntity.ok(ApiResponse.success("Payroll rejected", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @GetMapping("/admin-payroll/approved-list")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getApprovedList() {
        List<Paysheet> paysheets = paysheetService.getApprovedList();
        List<PayrollResponse> responses = paysheets.stream().map(paysheetService::mapToPayrollResponse).toList();
        return ResponseEntity.ok(ApiResponse.success("Approved payrolls retrieved", responses));
    }

    @PostMapping("/admin-payroll/{payrollId}/send-to-bank")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PayrollResponse>> sendToBank(
            @PathVariable Long payrollId) {
        Paysheet paysheet = paysheetService.sendToBank(payrollId);
        return ResponseEntity.ok(ApiResponse.success("Payroll sent to bank successfully", paysheetService.mapToPayrollResponse(paysheet)));
    }

    @PostMapping("/admin-payroll/proceed-bank")
    @PreAuthorize("hasAnyRole('ACCOUNT_EXECUTIVE', 'ACCOUNTANT')")
    public void proceedAllToBank(HttpServletResponse response) throws IOException {
        paysheetService.proceedAllToBank(response);
    }
}