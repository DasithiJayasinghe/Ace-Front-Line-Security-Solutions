package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ClientAuthService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public ClientLoginResponse login(ClientLoginRequest request) {
        Client client = clientRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid Credentials"));

        if (!passwordEncoder.matches(request.getPassword(), client.getPasswordHash())) {
            throw new RuntimeException("Invalid Credentials");
        }

        if (!client.getStatus().toString().equals("ACTIVE")) {
            throw new RuntimeException("Account is suspended or terminated");
        }

        // Update last login
        client.setLastLoginAt(LocalDateTime.now());
        clientRepository.save(client);

        // Generate JWT token
        String token = jwtUtil.generateToken(client.getUsername(), "CLIENT");

        return new ClientLoginResponse(
                "Login Successful",
                "CLIENT",
                "/client/dashboard",
                token,
                client.getClientId(),
                client.getCompanyName(),
                client.getIsFirstLogin()
        );
    }
}