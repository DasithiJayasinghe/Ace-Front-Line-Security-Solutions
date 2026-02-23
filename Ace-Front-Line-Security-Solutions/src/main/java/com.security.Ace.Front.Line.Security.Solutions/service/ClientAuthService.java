package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientLoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.AuthenticationException;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClientAuthService {

    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public ClientLoginResponse login(ClientLoginRequest request) {
        Client client = clientRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), client.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        // Check account status
        if (client.getStatus() == ClientStatus.SUSPENDED) {
            throw new AuthenticationException("Your account has been suspended. Please contact Ace Front Line Security.");
        }
        if (client.getStatus() == ClientStatus.TERMINATED) {
            throw new AuthenticationException("Your account has been terminated.");
        }
        if (client.getStatus() == ClientStatus.EXPIRED) {
            throw new AuthenticationException("Your contract has expired. Please contact us to renew your service.");
        }

        // Update last login timestamp
        client.setLastLoginAt(LocalDateTime.now());
        clientRepository.save(client);

        // Generate JWT — client token subject = "CLIENT:<clientId>"
        String token = jwtUtil.generateClientToken(client.getClientId(), "CLIENT");

        return new ClientLoginResponse(
                "Login successful",
                "CLIENT",
                "/client/dashboard",
                token,
                client.getClientId(),
                client.getCompanyName(),
                client.getIsFirstLogin()
        );
    }
}