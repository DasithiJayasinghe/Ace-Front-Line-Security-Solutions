package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.util.EmailSendingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send interview invitation email to candidate
     */
    public void sendInterviewInvitationEmail(String toEmail, String applicantName, String jobTitle,
                                             String interviewDate, String interviewTime, String interviewLocation) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Interview Invitation - " + jobTitle);

            String htmlContent = buildInterviewEmailTemplate(applicantName, jobTitle, interviewDate, interviewTime, interviewLocation);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailSendingException("Failed to send interview invitation email: " + e.getMessage(), e);
        }
    }

    /**
     * Build HTML template for interview invitation email
     */
    private String buildInterviewEmailTemplate(String applicantName, String jobTitle,
                                               String interviewDate, String interviewTime, String interviewLocation) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }" +
                "        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }" +
                "        .footer { background-color: #f0f0f0; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }" +
                "        .details { margin: 20px 0; }" +
                "        .detail-label { font-weight: bold; color: #007bff; }" +
                "        .detail-value { margin-left: 10px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h1>Interview Invitation</h1>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Dear <strong>" + applicantName + "</strong>,</p>" +
                "            <p>Congratulations! We are pleased to invite you for an interview for the position of <strong>" + jobTitle + "</strong>.</p>" +
                "            <div class=\"details\">" +
                "                <p><span class=\"detail-label\">Interview Date:</span> <span class=\"detail-value\">" + interviewDate + "</span></p>" +
                "                <p><span class=\"detail-label\">Interview Time:</span> <span class=\"detail-value\">" + interviewTime + "</span></p>" +
                "                <p><span class=\"detail-label\">Interview Location:</span> <span class=\"detail-value\">" + interviewLocation + "</span></p>" +
                "            </div>" +
                "            <p>Please confirm your attendance by replying to this email.</p>" +
                "            <p>We look forward to meeting you!</p>" +
                "            <p>Best regards,<br/>Ace Front Line Security Solutions<br/>Operational Management Team</p>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>This is an automated email. Please do not reply with sensitive information.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send simple text email
     */
    public void sendSimpleEmail(String toEmail, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
        } catch (Exception e) {
            throw new EmailSendingException("Failed to send email: " + e.getMessage(), e);
        }
    }

    /**
     * Send inquiry reply email
     */
    public void sendInquiryReplyEmail(String toEmail, String inquirerName, String originalSubject, String replyBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Re: " + originalSubject + " - Ace Front Line Security Solutions");

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "    <style>" +
                    "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                    "        .header { background-color: #1a365d; color: white; padding: 20px; border-radius: 5px 5px 0 0; }" +
                    "        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }" +
                    "        .footer { background-color: #f0f0f0; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }" +
                    "        .reply-body { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #007bff; border-radius: 4px; }" +
                    "    </style>" +
                    "</head>" +
                    "<body>" +
                    "    <div class=\"container\">" +
                    "        <div class=\"header\">" +
                    "            <h1>Ace Front Line Security Solutions</h1>" +
                    "            <p style=\"margin:0;opacity:0.8;\">Response to Your Inquiry</p>" +
                    "        </div>" +
                    "        <div class=\"content\">" +
                    "            <p>Dear <strong>" + inquirerName + "</strong>,</p>" +
                    "            <p>Thank you for reaching out to us regarding: <strong>" + originalSubject + "</strong></p>" +
                    "            <div class=\"reply-body\">" + replyBody.replace("\n", "<br/>") + "</div>" +
                    "            <p>If you have any further questions, please don't hesitate to contact us.</p>" +
                    "            <p>Best regards,<br/><strong>Ace Front Line Security Solutions</strong><br/>Operational Management Team<br/>Phone: 0114848177 / 0112867359</p>" +
                    "        </div>" +
                    "        <div class=\"footer\">" +
                    "            <p>189/2, Sandatenna Mawatha, Battaramulla | acefrontline@gmail.com</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailSendingException("Failed to send inquiry reply email: " + e.getMessage(), e);
        }
    }

    /**
     * Send rejection email to candidate
     */
    public void sendRejectionEmail(String toEmail, String applicantName, String jobTitle) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Application Status - " + jobTitle);

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "    <style>" +
                    "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                    "        .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }" +
                    "        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }" +
                    "        .footer { background-color: #f0f0f0; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }" +
                    "    </style>" +
                    "</head>" +
                    "<body>" +
                    "    <div class=\"container\">" +
                    "        <div class=\"header\">" +
                    "            <h1>Application Status</h1>" +
                    "        </div>" +
                    "        <div class=\"content\">" +
                    "            <p>Dear <strong>" + applicantName + "</strong>,</p>" +
                    "            <p>Thank you for your interest in the position of <strong>" + jobTitle + "</strong>.</p>" +
                    "            <p>After careful consideration, we regret to inform you that we have decided to proceed with other candidates whose qualifications more closely match our requirements.</p>" +
                    "            <p>We appreciate your interest and encourage you to apply for future opportunities.</p>" +
                    "            <p>Best regards,<br/>Ace Front Line Security Solutions<br/>Operational Management Team</p>" +
                    "        </div>" +
                    "        <div class=\"footer\">" +
                    "            <p>This is an automated email. Please do not reply with sensitive information.</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailSendingException("Failed to send rejection email: " + e.getMessage(), e);
        }
    }

    /**
     * Send selection email to candidate
     */
    public void sendSelectionEmail(String toEmail, String applicantName, String jobTitle, String reportDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Congratulations! You Have Been Selected - " + jobTitle);

            String dateSection = "";
            if (reportDate != null && !reportDate.isEmpty()) {
                dateSection =
                    "            <div style=\"margin: 20px 0; padding: 15px; background: #e8f5e9; border-left: 4px solid #28a745; border-radius: 4px;\">" +
                    "                <p style=\"margin:0; font-weight: bold; color: #2e7d32;\">Please report on:</p>" +
                    "                <p style=\"margin: 5px 0 0 0; font-size: 18px; color: #1b5e20;\">" + reportDate + "</p>" +
                    "            </div>";
            }

            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "    <style>" +
                    "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                    "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                    "        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }" +
                    "        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }" +
                    "        .footer { background-color: #f0f0f0; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666; }" +
                    "    </style>" +
                    "</head>" +
                    "<body>" +
                    "    <div class=\"container\">" +
                    "        <div class=\"header\">" +
                    "            <h1>Congratulations!</h1>" +
                    "            <p style=\"margin:0; opacity:0.9;\">You Have Been Selected</p>" +
                    "        </div>" +
                    "        <div class=\"content\">" +
                    "            <p>Dear <strong>" + applicantName + "</strong>,</p>" +
                    "            <p>We are delighted to inform you that you have been <strong>selected</strong> for the position of <strong>" + jobTitle + "</strong> at Ace Front Line Security Solutions.</p>" +
                    dateSection +
                    "            <p>Please bring the following documents when you report:</p>" +
                    "            <ul>" +
                    "                <li>National Identity Card (Original & Copy)</li>" +
                    "                <li>Educational Certificates (Originals & Copies)</li>" +
                    "                <li>Two Passport-Size Photographs</li>" +
                    "            </ul>" +
                    "            <p>If you have any questions, please contact us at <strong>0114848177 / 0112867359</strong>.</p>" +
                    "            <p>We look forward to welcoming you to our team!</p>" +
                    "            <p>Best regards,<br/><strong>Ace Front Line Security Solutions</strong><br/>Operational Management Team</p>" +
                    "        </div>" +
                    "        <div class=\"footer\">" +
                    "            <p>189/2, Sandatenna Mawatha, Battaramulla | acefrontline@gmail.com</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new EmailSendingException("Failed to send selection email: " + e.getMessage(), e);
        }
    }
}
