package com.security.Ace.Front.Line.Security.Solutions.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUser;

    private boolean isMailDisabled() {
        // Skip sending when disabled or using placeholder credentials
        return !mailEnabled || mailUser == null || mailUser.contains("your_email");
    }

    @Async
    public void sendOtpEmail(String toEmail, String otp, String fullName) {
        if (isMailDisabled()) {
            log.debug("Mail disabled; skipping OTP email to {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("ACE Front Line Security - OTP for Password Change");
            message.setText(
                    "Dear " + fullName + ",\n\n" +
                            "Your OTP for password change is: " + otp + "\n\n" +
                            "This OTP is valid for 10 minutes.\n\n" +
                            "If you did not request this, please contact your administrator immediately.\n\n" +
                            "Regards,\nACE Front Line Security Solutions"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName, String username) {
        if (isMailDisabled()) {
            log.debug("Mail disabled; skipping welcome email to {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to ACE Front Line Security Solutions");
            message.setText(
                    "Dear " + fullName + ",\n\n" +
                            "Welcome to ACE Front Line Security Solutions!\n\n" +
                            "Your account has been created.\n" +
                            "Username: " + username + "\n\n" +
                            "Please login and change your password on first login.\n\n" +
                            "Regards,\nACE Front Line Security Solutions"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }
}