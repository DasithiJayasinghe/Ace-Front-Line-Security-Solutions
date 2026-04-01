package com.security.Ace.Front.Line.Security.Solutions.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendSalaryEmail(String toEmail, String employeeName, String month, byte[] payslipPdf, String companyName) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(toEmail);
        helper.setSubject("Payslip for " + month);

        String emailBody = String.format(
                "Dear %s,\n\n" +
                "I hope you are doing well.\n\n" +
                "This is to inform you that your salary for the month of %s has been successfully processed and credited to your bank account.\n\n" +
                "Please review your account at your convenience and let us know if you have any questions or require further clarification.\n\n" +
                "Thank you for your continued contribution and dedication.\n\n" +
                "Best regards,\n\n" +
                "%s",
                employeeName, month, companyName
        );

        helper.setText(emailBody);

        helper.addAttachment("Payslip_" + month + ".pdf", new ByteArrayResource(payslipPdf));

        mailSender.send(message);
    }
}
