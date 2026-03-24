package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LoginRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.LoginResponse;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testLoginOperationalManager() {
        User user = new User(1L, "ops@ace.com", "ops123", "OPERATIONAL_MANAGER", true, LocalDateTime.now(), LocalDateTime.now());
        when(userRepository.findByEmail("ops@ace.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("ops@ace.com");
        request.setPassword("ops123");

        LoginResponse response = authService.login(request);
        assertEquals("OPERATIONAL_MANAGER", response.getRole());
        assertEquals("/operational-manager", response.getRedirectUrl());
    }

    @Test
    public void testLoginExecutive() {
        User user = new User(1L, "exec1@ace.com", "exec123", "EXECUTIVE", true, LocalDateTime.now(), LocalDateTime.now());
        when(userRepository.findByEmail("exec1@ace.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("exec1@ace.com");
        request.setPassword("exec123");

        LoginResponse response = authService.login(request);
        assertEquals("EXECUTIVE", response.getRole());
        assertEquals("/executive", response.getRedirectUrl());
    }
}
