package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.LeaveRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ApiResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;
    /**
     * leave
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'AREA_MANAGER', 'EXECUTIVE_OFFICER', 'ACCOUNT_EXECUTIVE', 'OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequest>> applyLeave(
            Authentication authentication,
            @Valid @RequestBody LeaveRequestDto dto) {
        LeaveRequest leave = leaveService.applyLeave(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success("Leave request submitted", leave));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getMyLeaves(Authentication authentication) {
        List<LeaveRequest> leaves = leaveService.getMyLeaves(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Leave history retrieved", leaves));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECTOR', 'CHAIRMAN', 'OPERATION_MANAGER', 'ACCOUNT_EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getAllLeaves() {
        List<LeaveRequest> leaves = leaveService.getAllLeaves();
        return ResponseEntity.ok(ApiResponse.success("All leaves retrieved", leaves));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'CHAIRMAN', 'AREA_MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getPendingLeaves() {
        List<LeaveRequest> leaves = leaveService.getPendingLeaves();
        return ResponseEntity.ok(ApiResponse.success("Pending leaves retrieved", leaves));
    }

    @GetMapping("/area/{area}")
    @PreAuthorize("hasAnyRole('AREA_MANAGER', 'OPERATION_MANAGER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getLeavesByArea(@PathVariable String area) {
        List<LeaveRequest> leaves = leaveService.getLeavesByArea(area);
        return ResponseEntity.ok(ApiResponse.success("Area leaves retrieved", leaves));
    }

    @PatchMapping("/{id}/area-review")
    @PreAuthorize("hasRole('AREA_MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequest>> areaManagerReview(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        LeaveRequest leave = leaveService.areaManagerReview(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Leave reviewed", leave));
    }

    @PatchMapping("/{id}/final-review")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'CHAIRMAN', 'OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequest>> finalReview(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ReviewRequest reviewRequest) {
        LeaveRequest leave = leaveService.finalReview(id, authentication.getName(), reviewRequest);
        return ResponseEntity.ok(ApiResponse.success("Leave finalized", leave));
    }
}