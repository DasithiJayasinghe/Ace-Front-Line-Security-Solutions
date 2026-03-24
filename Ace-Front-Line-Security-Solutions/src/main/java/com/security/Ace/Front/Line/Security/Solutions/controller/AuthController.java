package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ============ AUTHENTICATED ============

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
        UserProfileResponse profile = authService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profile));
    }

    @PatchMapping("/me/personal-info")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updatePersonalInfo(
            Authentication authentication,
            @RequestBody UpdatePersonalInfoRequest request) {
        UserProfileResponse profile = authService.updatePersonalInfo(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Personal information updated", profile));
    }

    @PatchMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> updatePhoto(
            Authentication authentication,
            @RequestPart("photo") MultipartFile photo) {
        UserProfileResponse profile = authService.updatePhoto(authentication.getName(), photo);
        return ResponseEntity.ok(ApiResponse.success("Photo updated", profile));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<Void>> sendOtp(Authentication authentication) {
        authService.sendOtpForPasswordChange(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your registered email"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    // ============ FORGOT PASSWORD (PUBLIC) ============

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("If email exists, OTP has been sent"));
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
        boolean valid = authService.validateResetToken(token);
        return ResponseEntity.ok(ApiResponse.success("Token status", valid));
    }

    @PostMapping("/reset-password-by-token")
    public ResponseEntity<ApiResponse<Void>> resetPasswordByToken(
            @Valid @RequestBody ResetPasswordByTokenRequest request) {
        authService.resetPasswordByToken(request.getToken(),
                request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity
                .ok(ApiResponse.success("Password reset successfully. Please login with your new password."));
    }

    // ============ OPERATION_MANAGER ============

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> registerUser(
            @Valid @RequestPart("data") RegisterUserRequest request,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        UserProfileResponse profile = authService.registerUser(request, photo);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", profile));
    }

    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasAnyRole('OPERATION_MANAGER', 'ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getUsersByRole(@PathVariable Role role) {
        List<UserProfileResponse> users = authService.getUsersByRole(role);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/area/{area}")
    @PreAuthorize("hasAnyRole('OPERATION_MANAGER', 'AREA_MANAGER', 'DIRECTOR', 'CHAIRMAN')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getUsersByArea(@PathVariable String area) {
        List<UserProfileResponse> users = authService.getUsersByArea(area);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('OPERATION_MANAGER', 'ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN', 'EXECUTIVE_OFFICER', 'AREA_MANAGER')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyRole('OPERATION_MANAGER', 'ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN', 'EXECUTIVE_OFFICER', 'AREA_MANAGER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable String id) {
        UserProfileResponse profile = authService.getProfileByStringId(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved", profile));
    }

    @DeleteMapping("/users/{id}/deactivate")
    @PreAuthorize("hasRole('OPERATION_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        authService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated"));
    }

    @GetMapping("/users/{id}/debug")
    @PreAuthorize("hasAnyRole('OPERATION_MANAGER', 'ACCOUNT_EXECUTIVE', 'DIRECTOR', 'CHAIRMAN', 'EXECUTIVE_OFFICER', 'AREA_MANAGER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> debugGetUserById(@PathVariable String id) {
        // Debug endpoint - same as getUserById but logs what's happening
        try {
            System.out.println("[DEBUG] Searching for user ID: " + id);
            UserProfileResponse profile = authService.getProfileByStringId(id);
            System.out.println("[DEBUG] Found user: " + profile.getFullName());
            return ResponseEntity.ok(ApiResponse.success("User retrieved", profile));
        } catch (Exception e) {
            System.out.println("[DEBUG] Error: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}