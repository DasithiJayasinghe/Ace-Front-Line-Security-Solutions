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

    private final ClientRepository  clientRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;

    @Transactional
    public ClientLoginResponse login(ClientLoginRequest request) {

        Client client = clientRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), client.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        // ── Status checks ─────────────────────────────────────────────────────
        switch (client.getStatus()) {
            case SUSPENDED  -> throw new AuthenticationException(
                    "Your account has been suspended. Please contact Ace Front Line Security.");
            case TERMINATED -> throw new AuthenticationException(
                    "Your account has been terminated.");
            case EXPIRED    -> throw new AuthenticationException(
                    "Your contract has expired. Please contact us to renew your service.");
            default         -> { /* ACTIVE — continue */ }
        }

        // ── Update last login ─────────────────────────────────────────────────
        client.setLastLoginAt(LocalDateTime.now());
        clientRepository.save(client);

        // ── Generate JWT — subject = "CLIENT:<clientId>" ──────────────────────
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