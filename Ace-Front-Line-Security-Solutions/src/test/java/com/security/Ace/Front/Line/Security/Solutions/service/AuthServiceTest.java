package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserProfileResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.OtpToken;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.OtpTokenRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import com.security.Ace.Front.Line.Security.Solutions.util.OtpUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService – Unit Tests")
class AuthServiceTest extends BaseServiceTest {

    @Mock private UserRepository        userRepository;
    @Mock private OtpTokenRepository    otpTokenRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private PasswordEncoder       passwordEncoder;
    @Mock private JwtUtil               jwtUtil;
    @Mock private OtpUtil               otpUtil;
    @Mock private EmailService          emailService;
    @Mock private FileStorageService    fileStorageService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void injectProperties() {
        ReflectionTestUtils.setField(authService, "otpExpiryMinutes", 10);
    }

    // =========================================================================
    // login()
    // =========================================================================
    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("returns LoginResponse with JWT tokens on valid credentials")
        void login_validCredentials_returnsTokens() {
            User officer = aSecurityOfficer();
            LoginRequest req = new LoginRequest();
            req.setUsername("officer_01");
            req.setPassword("StrongPass@1");

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(jwtUtil.generateToken(officer)).thenReturn("jwt-access-token");
            when(jwtUtil.generateRefreshToken(officer)).thenReturn("jwt-refresh-token");

            LoginResponse response = authService.login(req);

            assertThat(response.getToken()).isEqualTo("jwt-access-token");
            assertThat(response.getRefreshToken()).isEqualTo("jwt-refresh-token");
            assertThat(response.getUsername()).isEqualTo("officer_01");
            assertThat(response.getRole()).isEqualTo(Role.SECURITY_OFFICER);
            assertThat(response.isFirstLogin()).isFalse();
            assertThat(response.getMessage()).isEqualTo("Login successful");

            verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        }

        @Test
        @DisplayName("returns firstLogin=true and advisory message for first-login user")
        void login_firstLoginUser_returnsAdvisoryMessage() {
            User officer = aFirstLoginOfficer();
            LoginRequest req = new LoginRequest();
            req.setUsername("new_officer");
            req.setPassword("TempPass@1");

            when(userRepository.findByUsername("new_officer")).thenReturn(Optional.of(officer));
            when(jwtUtil.generateToken(any())).thenReturn("token");
            when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");

            LoginResponse response = authService.login(req);

            assertThat(response.isFirstLogin()).isTrue();
            assertThat(response.getMessage()).isEqualTo("Please change your password");
        }

        @Test
        @DisplayName("propagates BadCredentialsException on wrong password")
        void login_wrongPassword_propagatesBadCredentialsException() {
            LoginRequest req = new LoginRequest();
            req.setUsername("officer_01");
            req.setPassword("WrongPassword");

            doThrow(new BadCredentialsException("Bad credentials"))
                    .when(authenticationManager).authenticate(any());

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user record missing after auth succeeds")
        void login_userMissingAfterAuth_throwsResourceNotFoundException() {
            LoginRequest req = new LoginRequest();
            req.setUsername("ghost");
            req.setPassword("Pass@1");

            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // registerUser()
    // =========================================================================
    @Nested
    @DisplayName("registerUser()")
    class RegisterUserTests {

        private RegisterUserRequest validOfficerRequest() {
            RegisterUserRequest req = new RegisterUserRequest();
            req.setUsername("new_jso_01");
            req.setPassword("TempPass@123");
            req.setRole(Role.SECURITY_OFFICER);
            req.setFullName("Amal Dissanayake");
            req.setNicNumber("200156789012");
            req.setSex(Sex.MALE);
            req.setEmail("amal.d@ace.lk");
            req.setResidentialAddress("15, Kandy Road, Peradeniya");
            req.setMobileNumber("+94765432101");
            req.setDateOfBirth(LocalDate.of(2001, 4, 12));
            req.setEmergencyContact("Sunethra D - +94776543210");
            req.setDesignation(Designation.JSO);
            req.setBasicSalary(38000.0);
            req.setJoinDate(LocalDate.now());
            req.setAssignedArea("Kandy");
            req.setAssignedCompany("Ceylon Tea Exports Ltd");
            req.setHandoverEquipment(new ArrayList<>());
            return req;
        }

        @Test
        @DisplayName("saves and returns new user profile when all fields are valid")
        void registerUser_validRequest_savesAndReturnsProfile() {
            RegisterUserRequest req = validOfficerRequest();
            User saved = aSecurityOfficer();
            saved.setUsername("new_jso_01");

            when(userRepository.existsByUsername("new_jso_01")).thenReturn(false);
            when(userRepository.existsByEmail("amal.d@ace.lk")).thenReturn(false);
            when(userRepository.existsByNicNumber("200156789012")).thenReturn(false);
            when(passwordEncoder.encode("TempPass@123")).thenReturn("$2a$10$encoded");
            when(userRepository.save(any(User.class))).thenReturn(saved);
            doNothing().when(emailService).sendWelcomeEmail(anyString(), anyString(), anyString());

            UserProfileResponse profile = authService.registerUser(req, null);

            assertThat(profile).isNotNull();
            verify(userRepository).save(any(User.class));
            verify(emailService).sendWelcomeEmail(
                    eq("amal.d@ace.lk"), eq("Amal Dissanayake"), eq("new_jso_01"));
        }

        @Test
        @DisplayName("saves admin role user without requiring designation")
        void registerUser_adminRole_allowsNullDesignation() {
            RegisterUserRequest req = validOfficerRequest();
            req.setRole(Role.AREA_MANAGER);
            req.setDesignation(null);
            req.setAdminPosition("Senior Area Manager");

            User saved = anAreaManager();
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByNicNumber(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encoded");
            when(userRepository.save(any(User.class))).thenReturn(saved);
            doNothing().when(emailService).sendWelcomeEmail(anyString(), anyString(), anyString());

            UserProfileResponse profile = authService.registerUser(req, null);

            assertThat(profile).isNotNull();
        }

        @Test
        @DisplayName("throws BusinessException on duplicate username")
        void registerUser_duplicateUsername_throwsBusinessException() {
            RegisterUserRequest req = validOfficerRequest();
            when(userRepository.existsByUsername("new_jso_01")).thenReturn(true);

            assertThatThrownBy(() -> authService.registerUser(req, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Username already exists");
        }

        @Test
        @DisplayName("throws BusinessException on duplicate email")
        void registerUser_duplicateEmail_throwsBusinessException() {
            RegisterUserRequest req = validOfficerRequest();
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail("amal.d@ace.lk")).thenReturn(true);

            assertThatThrownBy(() -> authService.registerUser(req, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Email already registered");
        }

        @Test
        @DisplayName("throws BusinessException on duplicate NIC number")
        void registerUser_duplicateNic_throwsBusinessException() {
            RegisterUserRequest req = validOfficerRequest();
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByNicNumber("200156789012")).thenReturn(true);

            assertThatThrownBy(() -> authService.registerUser(req, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("NIC number already registered");
        }

        @Test
        @DisplayName("throws BusinessException when designation missing for SECURITY_OFFICER role")
        void registerUser_officerMissingDesignation_throwsBusinessException() {
            RegisterUserRequest req = validOfficerRequest();
            req.setDesignation(null);

            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByNicNumber(anyString())).thenReturn(false);

            assertThatThrownBy(() -> authService.registerUser(req, null))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Designation is required");
        }
    }

    // =========================================================================
    // sendOtpForPasswordChange()
    // =========================================================================
    @Nested
    @DisplayName("sendOtpForPasswordChange()")
    class SendOtpTests {

        @Test
        @DisplayName("generates 6-digit OTP, persists token and emails user")
        void sendOtp_knownUser_generatesAndSendsOtp() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(otpUtil.generateOtp()).thenReturn("847261");
            doNothing().when(otpTokenRepository).invalidateAllUserOtps(officer);
            when(otpTokenRepository.save(any(OtpToken.class))).thenReturn(new OtpToken());
            doNothing().when(emailService).sendOtpEmail(anyString(), anyString(), anyString());

            authService.sendOtpForPasswordChange("officer_01");

            verify(otpUtil).generateOtp();
            verify(otpTokenRepository).invalidateAllUserOtps(officer);
            verify(otpTokenRepository).save(any(OtpToken.class));
            verify(emailService).sendOtpEmail("john.silva@ace.lk", "847261", "John Priyantha Silva");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown username")
        void sendOtp_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.sendOtpForPasswordChange("ghost"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // changePassword()
    // =========================================================================
    @Nested
    @DisplayName("changePassword()")
    class ChangePasswordTests {

        private OtpToken validToken(User user) {
            return OtpToken.builder()
                    .otp("123456")
                    .user(user)
                    .used(false)
                    .expiresAt(LocalDateTime.now().plusMinutes(8))
                    .build();
        }

        private ChangePasswordRequest matchingRequest(String otp) {
            ChangePasswordRequest req = new ChangePasswordRequest();
            req.setOtp(otp);
            req.setNewPassword("NewSecure@Pass1");
            req.setConfirmPassword("NewSecure@Pass1");
            return req;
        }

        @Test
        @DisplayName("updates password, marks token used and clears firstLogin flag")
        void changePassword_validOtp_updatesPasswordAndClearsFirstLogin() {
            User officer = aSecurityOfficer();
            officer.setFirstLogin(true);
            OtpToken token = validToken(officer);

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(officer))
                    .thenReturn(Optional.of(token));
            when(passwordEncoder.encode("NewSecure@Pass1")).thenReturn("$2a$10$newEncoded");
            when(userRepository.save(any(User.class))).thenReturn(officer);
            when(otpTokenRepository.save(any(OtpToken.class))).thenReturn(token);

            authService.changePassword("officer_01", matchingRequest("123456"));

            verify(passwordEncoder).encode("NewSecure@Pass1");
            verify(userRepository).save(argThat(u -> !u.isFirstLogin()));
            verify(otpTokenRepository).save(argThat(OtpToken::isUsed));
        }

        @Test
        @DisplayName("throws BusinessException when new password and confirm password differ")
        void changePassword_passwordMismatch_throwsBusinessException() {
            ChangePasswordRequest req = new ChangePasswordRequest();
            req.setOtp("123456");
            req.setNewPassword("Pass@One");
            req.setConfirmPassword("Pass@Two");

            assertThatThrownBy(() -> authService.changePassword("officer_01", req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Passwords do not match");
        }

        @Test
        @DisplayName("throws BusinessException when no un-used OTP token found")
        void changePassword_noOtpToken_throwsBusinessException() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(officer))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.changePassword("officer_01", matchingRequest("999999")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("No valid OTP found");
        }

        @Test
        @DisplayName("throws BusinessException when OTP is expired")
        void changePassword_expiredOtp_throwsBusinessException() {
            User officer = aSecurityOfficer();
            OtpToken expired = OtpToken.builder()
                    .otp("123456").user(officer).used(false)
                    .expiresAt(LocalDateTime.now().minusSeconds(30))
                    .build();

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(officer))
                    .thenReturn(Optional.of(expired));

            assertThatThrownBy(() -> authService.changePassword("officer_01", matchingRequest("123456")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("OTP has expired");
        }

        @Test
        @DisplayName("throws BusinessException when OTP code does not match")
        void changePassword_wrongOtpCode_throwsBusinessException() {
            User officer = aSecurityOfficer();
            OtpToken token = validToken(officer); // stored = "123456"

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(otpTokenRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(officer))
                    .thenReturn(Optional.of(token));

            assertThatThrownBy(() -> authService.changePassword("officer_01", matchingRequest("000000")))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid OTP");
        }
    }

    // =========================================================================
    // getProfile()
    // =========================================================================
    @Nested
    @DisplayName("getProfile()")
    class GetProfileTests {

        @Test
        @DisplayName("returns full profile DTO for existing user")
        void getProfile_existingUser_returnsProfile() {
            User officer = aSecurityOfficer();
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));

            UserProfileResponse profile = authService.getProfile("officer_01");

            assertThat(profile.getFullName()).isEqualTo("John Priyantha Silva");
            assertThat(profile.getRole()).isEqualTo(Role.SECURITY_OFFICER);
            assertThat(profile.getDesignation()).isEqualTo(Designation.SSO);
            assertThat(profile.getNicNumber()).isEqualTo("199045678901");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for unknown username")
        void getProfile_unknownUser_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.getProfile("ghost"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // updatePersonalInfo()
    // =========================================================================
    @Nested
    @DisplayName("updatePersonalInfo()")
    class UpdatePersonalInfoTests {

        @Test
        @DisplayName("persists changed personal fields and returns updated profile")
        void updatePersonalInfo_validChanges_savesAndReturnsProfile() {
            User officer = aSecurityOfficer();
            UpdatePersonalInfoRequest req = new UpdatePersonalInfoRequest();
            req.setEmail("john.new@ace.lk");
            req.setMobileNumber("+94779999000");
            req.setResidentialAddress("99, New Road, Colombo 5");
            req.setEmergencyContact("New Contact - +94771111111");

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(userRepository.existsByEmail("john.new@ace.lk")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(officer);

            UserProfileResponse profile = authService.updatePersonalInfo("officer_01", req);

            assertThat(profile).isNotNull();
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("throws BusinessException when new email belongs to another user")
        void updatePersonalInfo_takenEmail_throwsBusinessException() {
            User officer = aSecurityOfficer();
            UpdatePersonalInfoRequest req = new UpdatePersonalInfoRequest();
            req.setEmail("taken@ace.lk");

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(userRepository.existsByEmail("taken@ace.lk")).thenReturn(true);

            assertThatThrownBy(() -> authService.updatePersonalInfo("officer_01", req))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Email already in use");
        }
    }

    // =========================================================================
    // getAllUsers() / getUsersByRole() / getUsersByArea()
    // =========================================================================
    @Nested
    @DisplayName("getAllUsers() / getUsersByRole() / getUsersByArea()")
    class GetUsersTests {

        @Test
        @DisplayName("getAllUsers returns mapped profiles for every user in system")
        void getAllUsers_returnsAllProfiles() {
            when(userRepository.findAll()).thenReturn(List.of(
                    aSecurityOfficer(), anAreaManager(), anAccountExecutive()));

            List<UserProfileResponse> result = authService.getAllUsers();

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("getUsersByRole returns only users with the specified role")
        void getUsersByRole_returnsMatchingRoleProfiles() {
            when(userRepository.findByRole(Role.SECURITY_OFFICER))
                    .thenReturn(List.of(aSecurityOfficer(), aFirstLoginOfficer()));

            List<UserProfileResponse> result = authService.getUsersByRole(Role.SECURITY_OFFICER);

            assertThat(result).hasSize(2);
            assertThat(result).allMatch(p -> p.getRole() == Role.SECURITY_OFFICER);
        }

        @Test
        @DisplayName("getUsersByArea returns only users assigned to specified area")
        void getUsersByArea_returnsMatchingAreaProfiles() {
            when(userRepository.findByAssignedArea("Colombo-North"))
                    .thenReturn(List.of(aSecurityOfficer()));

            List<UserProfileResponse> result = authService.getUsersByArea("Colombo-North");

            assertThat(result).hasSize(1);
        }
    }

    // =========================================================================
    // deactivateUser()
    // =========================================================================
    @Nested
    @DisplayName("deactivateUser()")
    class DeactivateUserTests {

        @Test
        @DisplayName("sets active=false and persists user record")
        void deactivateUser_activeUser_deactivatesSuccessfully() {
            User officer = aSecurityOfficer();
            when(userRepository.findById(1L)).thenReturn(Optional.of(officer));
            when(userRepository.save(any(User.class))).thenReturn(officer);

            authService.deactivateUser(1L);

            verify(userRepository).save(argThat(u -> !u.isActive()));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for non-existent user ID")
        void deactivateUser_unknownId_throwsResourceNotFoundException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.deactivateUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }
}