package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private String role;
    private String redirectUrl;
    private Long userId;
    private String fullName;
}
