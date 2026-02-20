package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // ✅ ADD THIS

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {

                String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
                String redirectUrl = getRedirectUrl(user.getRole());

                return new LoginResponse("Login Successful", user.getRole(), redirectUrl, token);
            }
        }
        throw new RuntimeException("Invalid Credentials");
    }

    private String getRedirectUrl(String role) {
        switch (role) {
            case "OPERATIONAL_MANAGER":
                return "/operational-manager";
            case "EXECUTIVE":
                return "/executive-officer";
            case "CHAIRMAN":
                return "/chairman";
            case "DIRECTOR":
                return "/director";
            case "ACCOUNTANT":
                return "/accountant";
            default:
                return "/";
        }
    }
}