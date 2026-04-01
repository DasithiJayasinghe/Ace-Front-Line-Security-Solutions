package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword().equals(loginRequest.getPassword())) { // In a real app, use BCrypt
                String redirectUrl = getRedirectUrl(user.getRole() != null ? user.getRole().name() : "");
                return new LoginResponse("Login Successful", user.getRole() != null ? user.getRole().name() : "",
                        redirectUrl, user.getId(),
                        user.getFullName());
            }
        }
        throw new RuntimeException("Invalid Credentials");
    }

    private String getRedirectUrl(String role) {
        if (role == null)
            return "/";
        switch (role) {
            case "OPERATION_MANAGER":
                return "/operational-manager";
            case "EXECUTIVE_OFFICER":
                return "/executive-officer";
            case "CHAIRMAN":
                return "/chairman";
            case "DIRECTOR":
                return "/director";
            case "ACCOUNT_EXECUTIVE":
                return "/accountant";
            case "SECURITY_OFFICER":
                return "/security-officer";
            case "AREA_MANAGER":
                return "/area-manager";
            default:
                return "/";
        }
    }
}
