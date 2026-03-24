package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserProfileResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.enums.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final UniformRequestRepository uniformRequestRepository;
    private final PaysheetRepository paysheetRepository;


    @GetMapping("/executive")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executiveDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("totalSecurityOfficers", userRepository.findByRole(Role.SECURITY_OFFICER).size());
        data.put("pendingLeaves", leaveRequestRepository.findByStatus(LeaveStatus.APPROVED_BY_AREA_MANAGER).size());
        data.put("pendingLeavesList", leaveRequestRepository.findByStatus(LeaveStatus.APPROVED_BY_AREA_MANAGER));
        data.put("allPaysheets", paysheetRepository.findAll());
        return ResponseEntity.ok(ApiResponse.success("Executive dashboard data", data));
    }

    /**
     * Account Executive dashboard
     */
    @GetMapping("/account-executive")
    @PreAuthorize("hasRole('ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> accountExecutiveDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("pendingLoans", loanRequestRepository.findByStatus(RequestStatus.PENDING));
        data.put("pendingAdvancesApprovedByAreaManager",
                advanceRequestRepository.findByStatus(RequestStatus.APPROVED_BY_AREA_MANAGER));
        data.put("allPaysheets", paysheetRepository.findAll());
        data.put("totalOfficers", userRepository.findByRole(Role.SECURITY_OFFICER).size());
        return ResponseEntity.ok(ApiResponse.success("Account executive dashboard data", data));
    }

    /**
     * Operation Manager dashboard
     */
    @GetMapping("/operation-manager")
    @PreAuthorize("hasRole('OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> operationManagerDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("securityOfficers", authService.getUsersByRole(Role.SECURITY_OFFICER));
        data.put("adminUsers", authService.getUsersByRole(Role.AREA_MANAGER));
        return ResponseEntity.ok(ApiResponse.success("Operation manager dashboard data", data));
    }

    /**
     * Executive Officer dashboard
     */
    @GetMapping("/executive-officer")
    @PreAuthorize("hasRole('EXECUTIVE_OFFICER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executiveOfficerDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("pendingLoans", loanRequestRepository.findByStatus(RequestStatus.PENDING));
        data.put("pendingAdvances", advanceRequestRepository.findByStatus(RequestStatus.PENDING));
        data.put("pendingUniforms", uniformRequestRepository.findByStatus(RequestStatus.PENDING));
        return ResponseEntity.ok(ApiResponse.success("Executive officer dashboard data", data));
    }

    /**
     * Area Manager dashboard - scoped to their area
     */
    @GetMapping("/area-manager")
    @PreAuthorize("hasRole('AREA_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> areaManagerDashboard(Authentication authentication) {
        com.security.Ace.Front.Line.Security.Solutions.entity.User manager =
                userRepository.findByUsername(authentication.getName())
                        .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        String area = manager.getAssignedArea();
        Map<String, Object> data = new HashMap<>();
        data.put("areaOfficers", userRepository.findByAssignedAreaAndRole(area, Role.SECURITY_OFFICER));
        data.put("pendingLeaves", leaveRequestRepository.findByUserAssignedAreaAndStatus(area, LeaveStatus.PENDING));
        data.put("pendingAdvances", advanceRequestRepository.findByUserAssignedAreaAndStatus(area, RequestStatus.PENDING));
        return ResponseEntity.ok(ApiResponse.success("Area manager dashboard data", data));
    }

    /**
     * Security Officer dashboard summary
     */
    @GetMapping("/security-officer")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> securityOfficerDashboard(Authentication authentication) {
        com.security.Ace.Front.Line.Security.Solutions.entity.User user =
                userRepository.findByUsername(authentication.getName())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Object> data = new HashMap<>();
        data.put("profile", authService.getProfile(authentication.getName()));
        data.put("latestPaysheet",
                paysheetRepository.findByUserOrderByCreatedAtDesc(user).stream().findFirst().orElse(null));
        data.put("pendingLeaves", leaveRequestRepository.findByUser(user).stream()
                .filter(l -> l.getStatus() == LeaveStatus.PENDING).count());
        data.put("pendingAdvances", advanceRequestRepository.findByUser(user).stream()
                .filter(a -> a.getStatus() == RequestStatus.PENDING).count());
        return ResponseEntity.ok(ApiResponse.success("Security officer dashboard data", data));
    }
}