package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.enums.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.*;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import com.security.Ace.Front.Line.Security.Solutions.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpUtil otpUtil;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;

    @Value("${app.otp.expiry-minutes}")
    private int otpExpiryMinutes;

    // ============ LOGIN ============
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return LoginResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .firstLogin(user.isFirstLogin())
                .message(user.isFirstLogin() ? "Please change your password" : "Login successful")
                .build();
    }

    // ============ REGISTER ============
    @Transactional
    public UserProfileResponse registerUser(RegisterUserRequest request, MultipartFile photo) {
        // Validation
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered");
        }
        if (userRepository.existsByNicNumber(request.getNicNumber())) {
            throw new BusinessException("NIC number already registered");
        }

        // Validate designation for security officers
        if (request.getRole() == Role.SECURITY_OFFICER) {
            if (request.getDesignation() == null) {
                throw new BusinessException("Designation is required for Security Officers");
            }
            validateDesignation(request.getDesignation());
        }

        // Build user
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .fullName(request.getFullName())
                .nicNumber(request.getNicNumber())
                .sex(request.getSex())
                .email(request.getEmail())
                .residentialAddress(request.getResidentialAddress())
                .mobileNumber(request.getMobileNumber())
                .dateOfBirth(request.getDateOfBirth())
                .emergencyContact(request.getEmergencyContact())
                .professionalCertificate(request.getProfessionalCertificate())
                .assignedArea(request.getAssignedArea())
                .assignedCompany(request.getAssignedCompany())
                .joinDate(request.getJoinDate())
                .designation(request.getDesignation())
                .basicSalary(request.getBasicSalary())
                .adminPosition(request.getAdminPosition())
                .specialSkills(request.getSpecialSkills())
                .handoverEquipment(request.getHandoverEquipment() != null ? request.getHandoverEquipment() : new ArrayList<>())
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankBranch(request.getBankBranch())
                .firstLogin(true)
                .active(true)
                .build();

        // Handle photo upload
        if (photo != null && !photo.isEmpty()) {
            String photoPath = fileStorageService.storePhoto(photo);
            user.setPhotoPath(photoPath);
        }

        User savedUser = userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName(), savedUser.getUsername());

        return mapToProfile(savedUser);
    }

    private void validateDesignation(Designation designation) {
        List<Designation> validDesignations = Arrays.asList(
                Designation.LSO, Designation.JSO, Designation.SSO, Designation.CSO
        );
        if (!validDesignations.contains(designation)) {
            throw new BusinessException("Invalid designation. Allowed values: LSO, JSO, SSO, CSO");
        }
    }

    // ============ OTP ============
    @Transactional
    public void sendOtpForPasswordChange(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Invalidate existing OTPs
        otpTokenRepository.invalidateAllUserOtps(user);

        // Generate and save new OTP
        String otp = otpUtil.generateOtp();
        OtpToken otpToken = OtpToken.builder()
                .otp(otp)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .used(false)
                .build();
        otpTokenRepository.save(otpToken);

        // Send OTP via email
        emailService.sendOtpEmail(user.getEmail(), otp, user.getFullName());
    }

    // ============ CHANGE PASSWORD ============
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Passwords do not match");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify OTP
        OtpToken otpToken = otpTokenRepository
                .findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BusinessException("No valid OTP found. Please request a new one."));

        if (otpToken.isExpired()) {
            throw new BusinessException("OTP has expired. Please request a new one.");
        }

        if (!otpToken.getOtp().equals(request.getOtp())) {
            throw new BusinessException("Invalid OTP");
        }

        // Mark OTP as used
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        // Update password and firstLogin
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLogin(false);
        userRepository.save(user);
    }

    // ============ PROFILE ============
    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToProfile(user);
    }

    public UserProfileResponse getProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToProfile(user);
    }

    @Transactional
    public UserProfileResponse updatePersonalInfo(String username, UpdatePersonalInfoRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getResidentialAddress() != null) user.setResidentialAddress(request.getResidentialAddress());
        if (request.getMobileNumber() != null) user.setMobileNumber(request.getMobileNumber());
        if (request.getEmergencyContact() != null) user.setEmergencyContact(request.getEmergencyContact());
        if (request.getEmail() != null) {
            if (userRepository.existsByEmail(request.getEmail()) &&
                    !request.getEmail().equals(user.getEmail())) {
                throw new BusinessException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        User saved = userRepository.save(user);
        return mapToProfile(saved);
    }

    @Transactional
    public UserProfileResponse updatePhoto(String username, MultipartFile photo) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Delete old photo
        if (user.getPhotoPath() != null) {
            fileStorageService.deleteFile(user.getPhotoPath());
        }

        String photoPath = fileStorageService.storePhoto(photo);
        user.setPhotoPath(photoPath);
        User saved = userRepository.save(user);
        return mapToProfile(saved);
    }

    // ============ ADMIN - GET ALL USERS ============
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToProfile).toList();
    }

    public List<UserProfileResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream().map(this::mapToProfile).toList();
    }

    public List<UserProfileResponse> getUsersByArea(String area) {
        return userRepository.findByAssignedArea(area).stream().map(this::mapToProfile).toList();
    }

    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }

    // ============ MAPPER ============
    private UserProfileResponse mapToProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .nicNumber(user.getNicNumber())
                .sex(user.getSex())
                .email(user.getEmail())
                .residentialAddress(user.getResidentialAddress())
                .mobileNumber(user.getMobileNumber())
                .dateOfBirth(user.getDateOfBirth())
                .emergencyContact(user.getEmergencyContact())
                .photoUrl(user.getPhotoPath())
                .professionalCertificate(user.getProfessionalCertificate())
                .assignedArea(user.getAssignedArea())
                .assignedCompany(user.getAssignedCompany())
                .joinDate(user.getJoinDate())
                .designation(user.getDesignation())
                .basicSalary(user.getBasicSalary())
                .adminPosition(user.getAdminPosition())
                .specialSkills(user.getSpecialSkills())
                .handoverEquipment(user.getHandoverEquipment())
                .bankName(user.getBankName())
                .bankAccountNumber(user.getBankAccountNumber())
                .bankBranch(user.getBankBranch())
                .createdAt(user.getCreatedAt())
                .build();
    }
}