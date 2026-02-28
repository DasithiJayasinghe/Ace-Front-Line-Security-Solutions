package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /** Admin summary stats card row */
    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getAdminDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard stats retrieved successfully", stats));
    }

    /** Full admin analytics dashboard — revenue charts, retention, top clients */
    @GetMapping("/admin/analytics")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getAdminAnalytics(
            @RequestParam(required = false) Integer year) {
        DashboardStatsResponse analytics = dashboardService.getAdminAnalytics(year);
        return ResponseEntity.ok(ApiResponse.success("Admin analytics retrieved successfully", analytics));
    }

    /** Upcoming renewals panel — contracts expiring in 30/60 days */
    @GetMapping("/admin/upcoming-renewals")
    public ResponseEntity<ApiResponse<?>> getUpcomingRenewals() {
        return ResponseEntity.ok(ApiResponse.success("Upcoming renewals retrieved",
                dashboardService.getUpcomingRenewals()));
    }

    /** Accountant dashboard — overdue list, pending verifications, batch queue */
    @GetMapping("/accountant")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getAccountantDashboard() {
        DashboardStatsResponse stats = dashboardService.getAccountantDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Accountant dashboard retrieved successfully", stats));
    }

    /** Client dashboard — service overview, invoice snapshot, officer counts */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<ClientDashboardResponse>> getClientDashboard(
            @PathVariable Integer clientId) {
        ClientDashboardResponse dashboard = dashboardService.getClientDashboard(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client dashboard retrieved successfully", dashboard));
    }
}