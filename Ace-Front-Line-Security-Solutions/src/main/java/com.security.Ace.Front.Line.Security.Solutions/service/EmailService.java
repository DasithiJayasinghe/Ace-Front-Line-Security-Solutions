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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailLogRepository emailLogRepository;
    private final JavaMailSender mailSender;

    private static final String FROM_EMAIL = "acefrontlines@gmail.com";
    private static final String FROM_NAME  = "Ace Front Line Security";
    private static final String PORTAL_URL = "http://localhost:8082";

    // ── Welcome / Credentials ────────────────────────���────────────────────────

    @Transactional
    public void sendCredentialsEmail(Client client, String password) {
        String subject = "Your Ace Front Line Security Portal — Login Credentials";
        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#111827;'>Welcome, " + esc(client.getContactPersonName()) + "!</h2>"
                + "<p style='color:#6b7280;'>Your client account has been created on the "
                + "Ace Front Line Security Management Portal. Use the credentials below to log in.</p>"
                + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;"
                + "padding:20px;margin:24px 0;'>"
                + row("Company",            esc(client.getCompanyName()))
                + row("Username",           code(esc(client.getUsername())))
                + row("Temporary Password", code(esc(password)))
                + "</div>"
                + warn("You will be required to change your password on first login. "
                + "Please keep your credentials secure.")
                + cta("Login to Portal", PORTAL_URL + "/client-login")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CREDENTIALS, client.getClientId());
    }

    // ── Invoice Issued ────────────────────────────────────────────────────────

    @Transactional
    public void sendInvoiceEmail(Client client, Invoice invoice) {
        String subject = "Invoice " + invoice.getInvoiceNumber() + " Issued — Ace Front Line Security";
        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#111827;'>New Invoice Issued</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ", a new invoice has been issued to your account.</p>"
                + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;"
                + "padding:20px;margin:24px 0;'>"
                + row("Invoice Number", esc(invoice.getInvoiceNumber()))
                + row("Billing Period",
                invoice.getPeriodFrom() + " to " + invoice.getPeriodTo())
                + row("Invoice Amount",
                "LKR " + fmt(invoice.getInvoiceAmount()))
                + row("SSCL (2.5%)",
                "LKR " + fmt(invoice.getSsclAmount()))
                + row("VAT (18%)",
                "LKR " + fmt(invoice.getVatAmount()))
                + rowBold("Total Payable",
                "LKR " + fmt(invoice.getTotalAmount()))
                + row("Payment Due Date", invoice.getDueDate() != null
                ? invoice.getDueDate().toString() : "—")
                + "</div>"
                + "<div style='background:#fefce8;border:1px solid #fde047;border-radius:8px;"
                + "padding:16px;margin-bottom:24px;'>"
                + "<p style='margin:0;color:#854d0e;font-size:14px;'>"
                + "<strong>Payment Instructions:</strong><br>"
                + "Bank: Bank of Ceylon &nbsp;|&nbsp; "
                + "Branch: Lake View Branch (612) &nbsp;|&nbsp; "
                + "A/C: 79289055<br>"
                + "Cheque payable to: <strong>Ace Front Line Security Solutions (PVT) Ltd</strong><br>"
                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>"
                + "</p></div>"
                + cta("View Invoice &amp; Upload Payment Proof",
                PORTAL_URL + "/client/payments")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.INVOICE_ISSUED, invoice.getInvoiceId());
    }

    // ── Payment Reminder — 10th of month (5 days remaining) ──────────────────

    @Transactional
    public void sendPaymentReminderEmail(Client client, Invoice invoice, int daysRemaining) {
        boolean urgent = daysRemaining <= 1;
        String subject = urgent
                ? "⚠ Payment Due Tomorrow — " + invoice.getInvoiceNumber()
                : "Payment Reminder — " + daysRemaining + " Days Remaining — "
                + invoice.getInvoiceNumber();

        String urgentBanner = urgent
                ? "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"
                + "padding:12px;margin-bottom:16px;'>"
                + "<p style='margin:0;color:#dc2626;font-weight:bold;'>⚠ Payment is due tomorrow! "
                + "Please upload your payment proof today.</p></div>"
                : "";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#111827;'>Payment Reminder</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName()) + ",</p>"
                + "<p style='color:#6b7280;'>This is a reminder that payment for invoice "
                + "<strong>" + esc(invoice.getInvoiceNumber()) + "</strong> is due in "
                + "<strong>" + daysRemaining + " day(s)</strong>.</p>"
                + urgentBanner
                + "<div style='background:#fefce8;border:1px solid #fde047;border-radius:8px;"
                + "padding:20px;margin:16px 0;'>"
                + row("Invoice Number",  esc(invoice.getInvoiceNumber()))
                + rowBold("Amount Due", "LKR " + fmt(invoice.getBalanceAmount()))
                + row("Due Date", invoice.getDueDate() != null
                ? invoice.getDueDate().toString() : "—")
                + "</div>"
                + "<p style='color:#374151;'>"
                + "Pay via bank transfer: <strong>Bank of Ceylon</strong>, "
                + "A/C: <strong>79289055</strong>, Lake View Branch (612)<br>"
                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>"
                + "</p>"
                + cta("Upload Payment Proof", PORTAL_URL + "/client/payments")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.PAYMENT_REMINDER, invoice.getInvoiceId());
    }

    // ── Overdue Notice — 20th of month, grace period ended ───────────────────

    @Transactional
    public void sendOverdueNoticeEmail(Client client, Invoice invoice) {
        String subject = "OVERDUE: Invoice " + invoice.getInvoiceNumber()
                + " — Late Fee of 1.5% Applied";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#dc2626;'>Invoice Overdue — Immediate Action Required</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName()) + ",</p>"
                + "<p style='color:#374151;'>Your invoice <strong>"
                + esc(invoice.getInvoiceNumber())
                + "</strong> is overdue. The 5-day grace period has passed and a late fee of "
                + "<strong>1.5%</strong> has been applied to your outstanding balance.</p>"
                + "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"
                + "padding:20px;margin:24px 0;'>"
                + row("Invoice Number",    esc(invoice.getInvoiceNumber()))
                + row("Original Amount",   "LKR " + fmt(invoice.getTotalAmount()))
                + row("Late Fee (1.5%)",   "LKR " + fmt(invoice.getLateFee()))
                + rowBold("Total Now Owed",
                "LKR " + fmt(invoice.getBalanceAmount()))
                + "</div>"
                + "<p style='color:#374151;'>Please settle this amount immediately to avoid "
                + "further late fees. A second 1.5% charge will be applied if still unpaid "
                + "after 30 days.</p>"
                + "<p style='color:#374151;'>If you believe this is in error or wish to "
                + "discuss a payment plan, please contact us immediately.</p>"
                + cta("Pay Now", PORTAL_URL + "/client/payments")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.OVERDUE_NOTICE, invoice.getInvoiceId());
    }

    // ── Payment Verified ──────────────────────────────────────────────────────

    @Transactional
    public void sendPaymentVerifiedEmail(Client client, Payment payment) {
        String subject = "✓ Payment Confirmed — Ace Front Line Security";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;text-align:center;'>"
                + "<div style='width:72px;height:72px;background:#dcfce7;border-radius:50%;"
                + "display:inline-flex;align-items:center;justify-content:center;"
                + "font-size:36px;margin-bottom:16px;'>✓</div>"
                + "<h2 style='color:#111827;'>Payment Verified!</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ", your payment has been successfully verified by our accounts team.</p>"
                + "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;"
                + "padding:20px;margin:24px 0;text-align:left;'>"
                + row("Invoice",        esc(payment.getInvoice().getInvoiceNumber()))
                + row("Amount Paid",    "LKR " + fmt(payment.getAmountPaid()))
                + row("Payment Date",   payment.getPaymentDate().toString())
                + row("Method",         payment.getPaymentMethod().toString())
                + row("Reference",      payment.getTransactionReference() != null
                ? esc(payment.getTransactionReference()) : "N/A")
                + row("Verified On",    payment.getVerifiedAt() != null
                ? payment.getVerifiedAt().toLocalDate().toString() : "—")
                + "</div>"
                + "<p style='color:#6b7280;'>Thank you for your prompt payment.</p>"
                + cta("View Payment History", PORTAL_URL + "/client/payments")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.PAYMENT_VERIFIED, payment.getPaymentId());
    }

    // ── Payment Rejected ──────────────────────────────────────────────────────

    @Transactional
    public void sendPaymentRejectedEmail(Client client, Payment payment) {
        String subject = "⚠ Payment Proof Rejected — Re-upload Required";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#dc2626;'>Payment Proof Rejected</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ", your payment proof for invoice <strong>"
                + esc(payment.getInvoice().getInvoiceNumber())
                + "</strong> has been rejected.</p>"
                + "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"
                + "padding:16px;margin:24px 0;'>"
                + "<p style='margin:0 0 8px;color:#374151;'><strong>Rejection Reason:</strong></p>"
                + "<p style='margin:0;color:#dc2626;'>"
                + esc(payment.getRejectionReason() != null
                ? payment.getRejectionReason() : "Not specified")
                + "</p></div>"
                + "<p style='color:#374151;'><strong>What to do next:</strong></p>"
                + "<ol style='color:#374151;padding-left:20px;'>"
                + "<li>Log in to the client portal</li>"
                + "<li>Navigate to <strong>Invoices &amp; Payments</strong></li>"
                + "<li>Upload a valid payment proof (JPG, PNG, or PDF)</li>"
                + "<li>Ensure the document clearly shows the bank, amount, date, "
                + "and transaction reference</li>"
                + "</ol>"
                + "<p style='color:#6b7280;margin-top:16px;'>If you need assistance, "
                + "please contact us at " + FROM_EMAIL + "</p>"
                + cta("Re-upload Payment Proof", PORTAL_URL + "/client/payments")
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.PAYMENT_REJECTED, payment.getPaymentId());
    }

    // ── Feedback Approved ─────────────────────────────────────────────────────

    @Transactional
    public void sendFeedbackApprovedEmail(Client client) {
        String subject = "Your Testimonial is Now Published — Thank You!";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;text-align:center;'>"
                + "<div style='font-size:48px;margin-bottom:16px;'>⭐</div>"
                + "<h2 style='color:#111827;'>Your Feedback Has Been Published!</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ", thank you for taking the time to share your experience with us.</p>"
                + "<p style='color:#374151;'>Your testimonial is now live on our homepage. "
                + "We truly value your feedback as it helps us improve our services.</p>"
                + cta("View Our Homepage", PORTAL_URL)
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.FEEDBACK_APPROVED, client.getClientId());
    }

    // ── Contract Renewal Reminder (60 / 30 / 7 days) ─────────────────────────

    @Transactional
    public void sendContractRenewalEmail(Client client, long daysToExpiry) {
        boolean urgent = daysToExpiry <= 7;
        String subject = urgent
                ? "🚨 URGENT: Your Contract Expires in " + daysToExpiry + " Days"
                : "Contract Renewal Reminder — " + daysToExpiry + " Days to Expiry";

        String badgeColor = urgent ? "#dc2626" : daysToExpiry <= 30 ? "#f59e0b" : "#3b82f6";
        String badgeText  = urgent ? "URGENT" : daysToExpiry <= 30 ? "ACTION REQUIRED" : "REMINDER";

        String expiryDate = client.getContractEndDate() != null
                ? client.getContractEndDate().toString() : "—";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<div style='display:inline-block;background:" + badgeColor
                + ";color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;"
                + "font-weight:bold;margin-bottom:16px;'>" + badgeText + "</div>"
                + "<h2 style='color:#111827;'>Contract Renewal Reminder</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ",</p>"
                + "<p style='color:#374151;'>Your security service contract with "
                + "Ace Front Line Security Solutions is due to expire in "
                + "<strong>" + daysToExpiry + " day(s)</strong>.</p>"
                + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;"
                + "padding:20px;margin:24px 0;'>"
                + row("Company",         esc(client.getCompanyName()))
                + row("Contract Expiry", expiryDate)
                + row("Days Remaining",  daysToExpiry + " days")
                + "</div>"
                + (urgent
                ? "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"
                + "padding:12px;margin-bottom:16px;'>"
                + "<p style='margin:0;color:#dc2626;'><strong>If your contract is not "
                + "renewed by the expiry date, your portal access will be suspended and "
                + "officer deployment will be paused.</strong></p></div>"
                : "")
                + "<p style='color:#374151;'>Please contact your operations manager to "
                + "discuss renewal terms. Once agreed and signed, your account will be "
                + "updated with the new contract period.</p>"
                + cta("Contact Us to Renew", "mailto:" + FROM_EMAIL)
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CONTRACT_RENEWAL, client.getClientId());
    }

    // ── Contract Expired ──────────────────────────────────────────────────────

    @Transactional
    public void sendContractExpiredEmail(Client client) {
        String subject = "Your Contract Has Expired — Account Suspended";

        String body = buildHeader()
                + "<div style='padding:32px;background:#fff;border:1px solid #e5e7eb;'>"
                + "<h2 style='color:#dc2626;'>Contract Expired — Account Suspended</h2>"
                + "<p style='color:#6b7280;'>Dear " + esc(client.getContactPersonName())
                + ",</p>"
                + "<p style='color:#374151;'>Your security service contract with "
                + "Ace Front Line Security Solutions has expired as of "
                + (client.getContractEndDate() != null
                ? "<strong>" + client.getContractEndDate() + "</strong>" : "the expiry date")
                + ".</p>"
                + "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"
                + "padding:16px;margin:24px 0;'>"
                + "<p style='margin:0;color:#dc2626;'>"
                + "<strong>Your portal access has been suspended.</strong> "
                + "All historical data — invoices, payment records, officer logs, and feedback "
                + "— is preserved and will be restored upon renewal.</p></div>"
                + "<p style='color:#374151;'>To renew your contract and restore access, "
                + "please contact us as soon as possible:</p>"
                + "<p style='color:#374151;'>"
                + "📧 " + FROM_EMAIL + "<br>"
                + "📞 0114848177"
                + "</p>"
                + cta("Contact Us to Renew", "mailto:" + FROM_EMAIL)
                + "</div>"
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CONTRACT_EXPIRED, client.getClientId());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PRIVATE — HTML TEMPLATE HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    private String buildHeader() {
        return "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>"
                + "<div style='background:#1a1a1a;padding:24px;text-align:center;'>"
                + "<h1 style='color:#EAB308;margin:0;font-size:24px;letter-spacing:2px;'>"
                + "ACE FRONT LINE</h1>"
                + "<p style='color:#d1d5db;margin:4px 0 0;font-size:13px;'>"
                + "Security Solutions</p>"
                + "</div>";
    }

    private String buildFooter() {
        return "<div style='padding:16px;text-align:center;background:#f9fafb;"
                + "border-top:1px solid #e5e7eb;'>"
                + "<p style='color:#9ca3af;font-size:12px;margin:0;'>"
                + "Ace Front Line Security Solutions (PVT) Ltd &nbsp;|&nbsp; "
                + "VAT: 101127788-7000 &nbsp;|&nbsp; "
                + "Tel: 0114848177<br>"
                + "This is an automated email — please do not reply directly. "
                + "Contact us at " + FROM_EMAIL
                + "</p></div></div>";
    }

    /** Standard label: value row */
    private String row(String label, String value) {
        return "<p style='margin:0 0 8px;color:#374151;'>"
                + "<strong>" + label + ":</strong>&nbsp;" + value + "</p>";
    }

    /** Bold value row — for totals */
    private String rowBold(String label, String value) {
        return "<p style='margin:0 0 8px;color:#111827;font-size:15px;'>"
                + "<strong>" + label + ":</strong>&nbsp;"
                + "<strong style='color:#EAB308;'>" + value + "</strong></p>";
    }

    /** Inline code-style display for credentials */
    private String code(String text) {
        return "<code style='background:#111827;color:#EAB308;padding:2px 8px;"
                + "border-radius:4px;font-size:14px;'>" + text + "</code>";
    }

    /** Yellow warning banner */
    private String warn(String message) {
        return "<div style='background:#fefce8;border:1px solid #fde047;border-radius:8px;"
                + "padding:12px 16px;margin-bottom:24px;'>"
                + "<p style='margin:0;color:#854d0e;font-size:13px;'>⚠ " + message + "</p>"
                + "</div>";
    }

    /** Call-to-action button */
    private String cta(String label, String url) {
        return "<a href='" + url + "' style='display:inline-block;background:#EAB308;"
                + "color:#000000;font-weight:bold;padding:12px 28px;border-radius:8px;"
                + "text-decoration:none;font-size:14px;margin-top:8px;'>"
                + label + " →</a>";
    }

    /** Format BigDecimal as comma-separated currency string */
    private String fmt(BigDecimal value) {
        if (value == null) return "0.00";
        return String.format("%,.2f", value.doubleValue());
    }

    /** Escape HTML special characters to prevent XSS in email bodies */
    private String esc(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PRIVATE — SEND + LOG
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Sends an HTML email and saves the result to the email_logs table.
     *
     * @param toEmail     Recipient email address
     * @param toName      Recipient display name
     * @param subject     Email subject line
     * @param htmlBody    Full HTML body string
     * @param type        EmailType enum value for logging
     * @param relatedId   ID of the related entity (invoiceId, paymentId, clientId)
     */
    private void sendAndLog(String toEmail, String toName, String subject,
                            String htmlBody, EmailType type, Integer relatedId) {
        boolean sent = sendHtmlEmail(toEmail, toName, subject, htmlBody);
        saveEmailLog(toEmail, toName, subject, htmlBody, type, relatedId, sent,
                sent ? null : "Failed to send email via SMTP");
    }

    /**
     * Sends a MIME HTML email via JavaMailSender.
     * Returns true on success, false on any failure — never throws.
     */
    private boolean sendHtmlEmail(String toEmail, String toName,
                                  String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL, FROM_NAME);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);
            log.info("✅ Email sent [{}] → {}", subject, toEmail);
            return true;

        } catch (MessagingException e) {
            log.error("❌ MessagingException sending to {}: {}", toEmail, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Persists email send result to email_logs table.
     * Failure to log must never crash the calling flow — errors are swallowed here.
     */
    private void saveEmailLog(String recipientEmail, String recipientName,
                              String subject, String body,
                              EmailType type, Integer relatedId,
                              boolean sent, String errorMessage) {
        try {
            EmailLog log = new EmailLog();
            log.setRecipientEmail(recipientEmail);
            log.setRecipientName(recipientName);
            log.setSubject(subject);
            log.setBody(body);
            log.setEmailType(type);
            log.setRelatedId(relatedId);
            log.setStatus(sent ? EmailStatus.SENT : EmailStatus.FAILED);
            log.setSentAt(LocalDateTime.now());
            log.setErrorMessage(errorMessage);
            emailLogRepository.save(log);
        } catch (Exception e) {
            // Log to console only — never let audit logging break email flow
            this.log.error("⚠ Failed to save email log for {}: {}", recipientEmail, e.getMessage());
        }
    }
}