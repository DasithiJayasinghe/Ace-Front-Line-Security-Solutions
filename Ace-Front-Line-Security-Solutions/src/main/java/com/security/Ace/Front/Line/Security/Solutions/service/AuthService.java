package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserInfoDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword().equals(loginRequest.getPassword())) {
                String token = jwtService.generateToken(user.getEmail());
                return new LoginResponse(token, user.getRole());
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
            case "AREA_MANAGER":
                return "/area-manager";
            case "SECURITY_OFFICER":
                return "/security-officer";
            default:
                return "/";
        }
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        String email = authentication.getName();

        return userRepository.findDetailedByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @Transactional(readOnly = true)
    public UserInfoDTO getCurrentUserInfo() {
        User user = getCurrentUser();

        Long clientCompanyId = null;
        String clientCompanyName = null;
        Long branchId = null;
        String branchName = null;

        if (user.getClientCompany() != null) {
            clientCompanyId = user.getClientCompany().getId();
            clientCompanyName = user.getClientCompany().getName();
        }

        if (user.getBranch() != null) {
            branchId = user.getBranch().getId();
            branchName = user.getBranch().getName();
        }

        return new UserInfoDTO(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getDesignation(),
                clientCompanyId,
                clientCompanyName,
                branchId,
                branchName
        );
    }

}
