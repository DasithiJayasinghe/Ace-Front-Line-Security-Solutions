package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.repository.EmailLogRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogRepository emailLogRepository;
    private final JavaMailSender mailSender;

    // ── Send credentials email
    @Transactional
    public void sendCredentialsEmail(Client client, String password) {
        log.info("Sending credentials email to: {}", client.getContactPersonEmail());

        String subject = "Your Ace Front Line Security Portal - Login Credentials";

        String body = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<div style='background: #1a1a1a; padding: 24px; text-align: center;'>"
                + "<h1 style='color: #EAB308; margin: 0;'>ACE FRONT LINE</h1>"
                + "<p style='color: #ffffff; margin: 4px 0 0;'>Security Solutions</p>"
                + "</div>"
                + "<div style='padding: 32px; background: #ffffff; border: 1px solid #e5e7eb;'>"
                + "<h2 style='color: #111827;'>Welcome, " + client.getContactPersonName() + "!</h2>"
                + "<p style='color: #6b7280;'>Your client account has been created on the Ace Front Line Security Management Portal. Use the credentials below to log in.</p>"
                + "<div style='background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;'>"
                + "<p style='margin: 0 0 12px; color: #374151;'><strong>Company:</strong> " + client.getCompanyName() + "</p>"
                + "<p style='margin: 0 0 12px; color: #374151;'><strong>Username:</strong> "
                + "<code style='background: #111827; color: #EAB308; padding: 2px 8px; border-radius: 4px;'>" + client.getUsername() + "</code></p>"
                + "<p style='margin: 0; color: #374151;'><strong>Temporary Password:</strong> "
                + "<code style='background: #111827; color: #EAB308; padding: 2px 8px; border-radius: 4px;'>" + password + "</code></p>"
                + "</div>"
                + "<div style='background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin-bottom: 24px;'>"
                + "<p style='margin: 0; color: #854d0e; font-size: 14px;'>⚠ You will be required to change your password on first login. Please keep your credentials secure.</p>"
                + "</div>"
                + "<a href='http://localhost:8082/client-login' style='display: inline-block; background: #EAB308; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none;'>Login to Portal →</a>"
                + "</div>"
                + "<div style='padding: 16px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;'>"
                + "<p style='color: #9ca3af; font-size: 12px; margin: 0;'>Ace Front Line Security Solutions | This is an automated email, please do not reply.</p>"
                + "</div>"
                + "</div>";

        boolean sent = sendHtmlEmail(
                client.getContactPersonEmail(),
                client.getContactPersonName(),
                subject,
                body
        );

        // Log email result
        saveEmailLog(
                client.getContactPersonEmail(),
                client.getContactPersonName(),
                subject,
                body,
                EmailType.CREDENTIALS,
                sent,
                sent ? null : "Failed to send email"
        );
    }

    // ── Private: actual send logic ──────────────────────────────────────────
    private boolean sendHtmlEmail(String toEmail, String toName, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("acefrontlines@gmail.com", "Ace Front Line Security");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent successfully to: {}", toEmail);
            return true;

        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // ── Private: save email log ─────────────────────────────────────────────
    private void saveEmailLog(
            String recipientEmail,
            String recipientName,
            String subject,
            String body,
            EmailType type,
            boolean sent,
            String errorMessage
    ) {
        try {
            EmailLog emailLog = new EmailLog();
            emailLog.setRecipientEmail(recipientEmail);
            emailLog.setRecipientName(recipientName);
            emailLog.setSubject(subject);
            emailLog.setBody(body);
            emailLog.setEmailType(type);
            emailLog.setStatus(sent ? EmailStatus.SENT : EmailStatus.FAILED);
            emailLog.setSentAt(LocalDateTime.now());
            emailLog.setErrorMessage(errorMessage);
            emailLogRepository.save(emailLog);
        } catch (Exception e) {
            log.error("Failed to save email log: {}", e.getMessage());
        }
    }
}