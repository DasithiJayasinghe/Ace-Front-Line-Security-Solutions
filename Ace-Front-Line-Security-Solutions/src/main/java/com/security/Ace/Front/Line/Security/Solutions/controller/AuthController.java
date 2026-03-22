package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.security.Ace.Front.Line.Security.Solutions.dto.UserInfoDTO;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow requests from frontend
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoDTO> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUserInfo());
    }

}
