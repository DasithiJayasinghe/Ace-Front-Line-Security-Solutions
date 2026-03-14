package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            // Extract the first role from the authenticated user
            String role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_USER");

            // Remove ROLE_ prefix if present for cleaner response
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }

            LoginResponse response = new LoginResponse(
                    true,
                    "Login successful",
                    authentication.getName(),
                    role);

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            LoginResponse response = new LoginResponse(
                    false,
                    "Invalid username or password",
                    null,
                    null);
            return ResponseEntity.status(401).body(response);
        }
    }
}
