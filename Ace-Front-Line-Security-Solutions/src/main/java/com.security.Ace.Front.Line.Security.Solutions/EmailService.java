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
            log.info("=== [DEV MODE] OTP EMAIL ===");
            log.info("To: {}", toEmail);
            log.info("Dear {}, your OTP is: {}", fullName, otp);
            log.info("(This OTP is valid for 10 minutes)");
            log.info("============================");
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
                            "Regards,\nACE Front Line Security Solutions");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetLinkEmail(String toEmail, String fullName, String resetLink) {
        if (isMailDisabled()) {
            log.info("=== [DEV MODE] PASSWORD RESET LINK ===");
            log.info("To: {}", toEmail);
            log.info("Dear {}, your password reset link is:", fullName);
            log.info("{}", resetLink);
            log.info("(This link is valid for 1 hour)");
            log.info("======================================");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("ACE Front Line Security - Password Reset Request");
            message.setText(
                    "Dear " + fullName + ",\n\n" +
                            "We received a request to reset your password.\n\n" +
                            "Click the link below to reset your password:\n" +
                            resetLink + "\n\n" +
                            "This link is valid for 1 hour.\n\n" +
                            "If you did not request a password reset, please ignore this email.\n\n" +
                            "Regards,\nACE Front Line Security Solutions");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send password reset link email to {}: {}", toEmail, e.getMessage());
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
                            "Regards,\nACE Front Line Security Solutions");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetConfirmationEmail(String toEmail, String fullName) {
        if (isMailDisabled()) {
            log.debug("Mail disabled; skipping password reset confirmation email to {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset Successful - ACE Front Line Security");
            message.setText(
                    "Dear " + fullName + ",\n\n" +
                            "Your password has been successfully reset.\n\n" +
                            "You can now login to your account with your new password.\n\n" +
                            "If you did not make this change, please contact your administrator immediately.\n\n" +
                            "Regards,\nACE Front Line Security Solutions");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send password reset confirmation email to {}: {}", toEmail, e.getMessage());
        }
    }
}