package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.exception.AuthenticationException;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            throw new AuthenticationException("Invalid credentials");
        }

        User user = userOptional.get();

        // Reject disabled staff accounts
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AuthenticationException("Your account has been deactivated. Please contact the administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthenticationException("Invalid credentials");
        }

        // Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT — staff token uses email as subject
        String token = jwtUtil.generateStaffToken(user.getEmail(), user.getRole());
        String redirectUrl = getRedirectUrl(user.getRole());

        return new LoginResponse("Login successful", user.getRole(), redirectUrl, token);
    }

    private String getRedirectUrl(String role) {
        switch (role) {
            case "OPERATIONAL_MANAGER": return "/operational-manager";
            case "EXECUTIVE":           return "/executive-officer";
            case "CHAIRMAN":            return "/chairman";
            case "DIRECTOR":            return "/director";
            case "ACCOUNTANT":          return "/accountant";
            default:                    return "/";
        }
    }
}