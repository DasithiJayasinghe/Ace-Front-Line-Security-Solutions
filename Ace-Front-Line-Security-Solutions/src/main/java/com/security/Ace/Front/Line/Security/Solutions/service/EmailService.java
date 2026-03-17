package com.security.Ace.Front.Line.Security.Solutions.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailLog;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.EmailType;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.Payment;
import com.security.Ace.Front.Line.Security.Solutions.repository.EmailLogRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
                + sectionTitle("Welcome, " + esc(client.getContactPersonName()) + "!")
                + para("Your client account has been created on the <strong>Ace Front Line Security Management Portal</strong>. "
                + "Use the credentials below to access your account.")
                + card(
                        row("Company",            esc(client.getCompanyName()))
                        + row("Username",           code(esc(client.getUsername())))
                        + row("Temporary Password", code(esc(password)))
                )
                + warn("You will be required to change your password on first login. "
                + "Please keep your credentials secure and do not share them with anyone.")
                + cta("Login to Portal", PORTAL_URL + "/client-login")
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CREDENTIALS, client.getClientId());
    }

    // ── Invoice Issued ────────────────────────────────────────────────────────

    @Transactional
    public void sendInvoiceEmail(Client client, Invoice invoice) {
        String subject = "Invoice " + invoice.getInvoiceNumber() + " Issued — Ace Front Line Security";
        String body = buildHeader()
                + sectionTitle("New Invoice Issued")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, a new invoice has been issued to your account. "
                + "Please review the details below and arrange payment before the due date.")
                + card(
                        row("Invoice Number",  esc(invoice.getInvoiceNumber()))
                        + row("Billing Period", invoice.getPeriodFrom() + " to " + invoice.getPeriodTo())
                        + row("Invoice Amount", "Rs. " + fmt(invoice.getInvoiceAmount()))
                        + row("SSCL (2.5%)",    "Rs. " + fmt(invoice.getSsclAmount()))
                        + row("VAT (18%)",       "Rs. " + fmt(invoice.getVatAmount()))
                        + rowBold("Total Payable", "Rs. " + fmt(invoice.getTotalAmount()))
                        + row("Payment Due Date", invoice.getDueDate() != null
                                ? invoice.getDueDate().toString() : "\u2014")
                )
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#fefce8;border:1px solid #fde047;border-radius:10px;margin:16px 0 24px;'>"
                + "<tr><td style='padding:18px 24px;font-family:Arial,sans-serif;'>"
                + "<p style='margin:0 0 8px;color:#854d0e;font-weight:800;font-size:13px;'>&#127968; Payment Instructions</p>"
                + "<p style='margin:0;color:#78350f;font-size:13px;line-height:1.7;'>"
                + "Bank: <strong>Bank of Ceylon</strong> &nbsp;|&nbsp; Branch: <strong>Lake View Branch (612)</strong><br>"
                + "Account No: <strong>79289055</strong><br>"
                + "Cheque payable to: <strong>Ace Front Line Security Solutions (PVT) Ltd</strong><br>"
                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>"
                + "</p></td></tr></table>"
                + cta("View Invoice &amp; Upload Payment Proof", PORTAL_URL + "/client/payments")
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
                ? "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;'>"
                + "<tr><td style='padding:14px 18px;font-family:Arial,sans-serif;color:#dc2626;font-weight:800;font-size:14px;'>"
                + "&#9888; Payment is due tomorrow! Please upload your payment proof today."
                + "</td></tr></table>"
                : "";

        String body = buildHeader()
                + sectionTitle("Payment Reminder")
                + para("Dear <strong>" + esc(client.getContactPersonName()) + "</strong>, this is a reminder that payment for invoice "
                + "<strong>" + esc(invoice.getInvoiceNumber()) + "</strong> is due in "
                + "<strong>" + daysRemaining + " day(s)</strong>.")
                + urgentBanner
                + card(
                        row("Invoice Number", esc(invoice.getInvoiceNumber()))
                        + rowBold("Amount Due",   "Rs. " + fmt(invoice.getBalanceAmount()))
                        + row("Due Date",        invoice.getDueDate() != null ? invoice.getDueDate().toString() : "\u2014")
                )
                + para("Pay via bank transfer: <strong>Bank of Ceylon</strong>, A/C: <strong>79289055</strong>, Lake View Branch (612)<br>"
                + "Reference: <strong>" + esc(invoice.getInvoiceNumber()) + "</strong>")
                + cta("Upload Payment Proof", PORTAL_URL + "/client/payments")
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
                + sectionTitle("Invoice Overdue &#8212; Immediate Action Required")
                + para("Dear <strong>" + esc(client.getContactPersonName()) + "</strong>, your invoice <strong>"
                + esc(invoice.getInvoiceNumber())
                + "</strong> is overdue. The 5-day grace period has passed and a late fee of "
                + "<strong>1.5%</strong> has been applied to your outstanding balance.")
                + cardRed(
                        row("Invoice Number",   esc(invoice.getInvoiceNumber()))
                        + row("Original Amount",  "Rs. " + fmt(invoice.getTotalAmount()))
                        + row("Late Fee (1.5%)",  "Rs. " + fmt(invoice.getLateFee()))
                        + rowBold("Total Now Owed", "Rs. " + fmt(invoice.getBalanceAmount()))
                )
                + para("Please settle this amount immediately to avoid further late fees. "
                + "A second 1.5% charge will be applied if still unpaid after 30 days.")
                + para("If you believe this is in error or wish to discuss a payment plan, "
                + "please contact us immediately at <strong>0114848177</strong> or "
                + "<a href='mailto:" + FROM_EMAIL + "' style='color:#EAB308;'>" + FROM_EMAIL + "</a>.")
                + cta("Pay Now", PORTAL_URL + "/client/payments")
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.OVERDUE_NOTICE, invoice.getInvoiceId());
    }

    // ── Payment Verified ──────────────────────────────────────────────────────

    @Transactional
    public void sendPaymentVerifiedEmail(Client client, Payment payment) {
        String subject = "✓ Payment Confirmed — Ace Front Line Security";

        String body = buildHeader()
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                + "<tr><td align='center' style='padding-bottom:20px;'>"
                + "<div style='width:72px;height:72px;background:#dcfce7;border-radius:50%;"
                + "display:inline-block;text-align:center;line-height:72px;font-size:36px;'>&#10003;</div>"
                + "</td></tr></table>"
                + sectionTitle("Payment Verified!")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, your payment has been successfully verified by our accounts team. Thank you for your prompt payment.")
                + cardGreen(
                        row("Invoice",      esc(payment.getInvoice().getInvoiceNumber()))
                        + row("Amount Paid",  "Rs. " + fmt(payment.getAmountPaid()))
                        + row("Payment Date", payment.getPaymentDate().toString())
                        + row("Method",       payment.getPaymentMethod().toString().replace("_", " "))
                        + row("Reference",    payment.getTransactionReference() != null
                                ? esc(payment.getTransactionReference()) : "N/A")
                        + row("Verified On",  payment.getVerifiedAt() != null
                                ? payment.getVerifiedAt().toLocalDate().toString() : "\u2014")
                )
                + cta("View Payment History", PORTAL_URL + "/client/payments")
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.PAYMENT_VERIFIED, payment.getPaymentId());
    }

    // ── Payment Rejected ──────────────────────────────────────────────────────

    @Transactional
    public void sendPaymentRejectedEmail(Client client, Payment payment) {
        String subject = "⚠ Payment Proof Rejected — Re-upload Required";

        String body = buildHeader()
                + sectionTitle("Payment Proof Rejected")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, your payment proof for invoice <strong>"
                + esc(payment.getInvoice().getInvoiceNumber())
                + "</strong> has been reviewed and could not be accepted.")
                + cardRed(
                        row("Invoice",          esc(payment.getInvoice().getInvoiceNumber()))
                        + row("Amount",          "Rs. " + fmt(payment.getAmountPaid()))
                        + row("Rejection Reason", "<span style='color:#dc2626;'>" + esc(payment.getRejectionReason() != null
                                ? payment.getRejectionReason() : "Not specified") + "</span>")
                )
                + para("<strong>What to do next:</strong>")
                + "<ol style='font-family:Arial,sans-serif;font-size:14px;color:#4b5563;line-height:1.8;padding-left:20px;margin:8px 0 24px;'>"
                + "<li>Log in to the client portal</li>"
                + "<li>Navigate to <strong>Invoices &amp; Payments</strong></li>"
                + "<li>Upload a valid payment proof (JPG, PNG, or PDF)</li>"
                + "<li>Ensure the document clearly shows: bank name, amount, date, and transaction reference</li>"
                + "</ol>"
                + para("If you need assistance, please contact us at "
                + "<a href='mailto:" + FROM_EMAIL + "' style='color:#EAB308;'>" + FROM_EMAIL + "</a> or call <strong>0114848177</strong>.")
                + cta("Re-upload Payment Proof", PORTAL_URL + "/client/payments")
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.PAYMENT_REJECTED, payment.getPaymentId());
    }

    // ── Feedback Approved ─────────────────────────────────────────────────────

    @Transactional
    public void sendFeedbackApprovedEmail(Client client) {
        String subject = "Your Testimonial is Now Published — Thank You!";

        String body = buildHeader()
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                + "<tr><td align='center' style='padding-bottom:16px;'>"
                + "<div style='font-size:52px;'>&#11088;</div>"
                + "</td></tr></table>"
                + sectionTitle("Your Feedback Has Been Published!")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, thank you for taking the time to share your experience with us.")
                + para("Your testimonial is now <strong>live on our homepage</strong>. We truly value your feedback — it helps us continuously improve our services and motivates our team.")
                + cta("View Our Homepage", PORTAL_URL)
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
                + "<table role='presentation' cellpadding='0' cellspacing='0' style='margin-bottom:16px;'>"
                + "<tr><td style='background:" + badgeColor + ";color:#fff;padding:5px 14px;"
                + "border-radius:4px;font-family:Arial,sans-serif;font-size:11px;font-weight:800;"
                + "letter-spacing:1px;'>" + badgeText + "</td></tr></table>"
                + sectionTitle("Contract Renewal Reminder")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, your security service contract with Ace Front Line Security Solutions is due to expire in "
                + "<strong>" + daysToExpiry + " day(s)</strong>.")
                + card(
                        row("Company",         esc(client.getCompanyName()))
                        + row("Contract Expiry", expiryDate)
                        + rowBold("Days Remaining", daysToExpiry + " days")
                )
                + (urgent
                ? "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;'>"
                + "<tr><td style='padding:14px 18px;font-family:Arial,sans-serif;color:#dc2626;font-size:13px;'>"
                + "<strong>If your contract is not renewed by the expiry date, your portal access will be suspended "
                + "and officer deployment will be paused.</strong></td></tr></table>"
                : "")
                + para("Please contact your operations manager to discuss renewal terms. Once agreed and signed, "
                + "your account will be updated with the new contract period.")
                + cta("Contact Us to Renew", "mailto:" + FROM_EMAIL)
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CONTRACT_RENEWAL, client.getClientId());
    }

    // ── Contract Expired ──────────────────────────────────────────────────────

    @Transactional
    public void sendContractExpiredEmail(Client client) {
        String subject = "Your Contract Has Expired — Account Suspended";

        String body = buildHeader()
                + sectionTitle("Contract Expired &#8212; Account Suspended")
                + para("Dear <strong>" + esc(client.getContactPersonName())
                + "</strong>, your security service contract with Ace Front Line Security Solutions has expired as of "
                + (client.getContractEndDate() != null
                ? "<strong>" + client.getContractEndDate() + "</strong>" : "the expiry date")
                + ".")
                + cardRed(
                        row("Company",         esc(client.getCompanyName()))
                        + row("Expiry Date",    client.getContractEndDate() != null ? client.getContractEndDate().toString() : "—")
                        + row("Account Status", "<strong style='color:#dc2626;'>SUSPENDED</strong>")
                )
                + para("<strong>Your portal access has been suspended.</strong> All historical data &#8212; invoices, "
                + "payment records, officer logs, and feedback &#8212; is preserved and will be fully restored upon renewal.")
                + para("To renew your contract and restore access, please contact us as soon as possible:")
                + para("&#128231; <a href='mailto:" + FROM_EMAIL + "' style='color:#EAB308;'>"
                + FROM_EMAIL + "</a> &nbsp;|&nbsp; "
                + "&#128222; <strong>0114848177</strong>")
                + cta("Contact Us to Renew", "mailto:" + FROM_EMAIL)
                + buildFooter();

        sendAndLog(client.getContactPersonEmail(), client.getContactPersonName(),
                subject, body, EmailType.CONTRACT_EXPIRED, client.getClientId());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PRIVATE — HTML TEMPLATE HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    private String buildHeader() {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
                + "<body style='margin:0;padding:0;background-color:#f3f4f6;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f3f4f6;padding:20px 0;'>"
                + "<tr><td align='center'>"
                + "<table role='presentation' width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>"
                // ── Compact brand header ──
                + "<tr><td style='background:#111827;border-radius:10px 10px 0 0;padding:14px 24px;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr>"
                + "<td style='vertical-align:middle;'>"
                + "<table cellpadding='0' cellspacing='0'><tr>"
                + "<td style='width:30px;height:30px;background:#EAB308;border-radius:6px;text-align:center;vertical-align:middle;'>"
                + "<span style='font-family:Arial;font-size:14px;font-weight:900;color:#000;line-height:30px;display:block;'>A</span></td>"
                + "<td style='padding-left:10px;vertical-align:middle;'>"
                + "<span style='font-family:Arial;font-size:14px;font-weight:900;color:#ffffff;letter-spacing:1px;'>ACE FRONT LINE</span><br>"
                + "<span style='font-family:Arial;font-size:9px;color:#9ca3af;letter-spacing:0.5px;text-transform:uppercase;'>Security Solutions (PVT) Ltd</span>"
                + "</td></tr></table></td>"
                + "<td align='right' style='vertical-align:middle;'>"
                + "<span style='font-family:Arial;font-size:9px;color:#6b7280;'>acefrontlines@gmail.com</span>"
                + "</td>"
                + "</tr></table>"
                + "</td></tr>"
                // ── Yellow accent bar ──
                + "<tr><td style='background:#EAB308;height:3px;font-size:0;line-height:0;'>&nbsp;</td></tr>"
                // ── White content area begins ──
                + "<tr><td style='background:#ffffff;padding:28px 32px 20px;font-family:Arial,sans-serif;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;'>";
    }

    private String buildFooter() {
        return "</td></tr>"
                // ── Footer strip ──
                + "<tr><td style='background:#1a1a1a;border-radius:0 0 10px 10px;padding:14px 24px;font-family:Arial,sans-serif;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                + "<tr>"
                + "<td style='color:#6b7280;font-size:11px;line-height:1.6;'>"
                + "<strong style='color:#EAB308;'>Ace Front Line Security Solutions (PVT) Ltd</strong><br>"
                + "189/2 Sandatenna Mawatha, Battaramulla &nbsp;|&nbsp; Tel: 0114848177<br>"
                + "VAT: 101127788-7000 &nbsp;|&nbsp; acefrontlines@gmail.com"
                + "</td>"
                + "<td align='right' style='color:#6b7280;font-size:11px;vertical-align:top;'>"
                + "<span style='display:block;color:#9ca3af;'>This is an automated email.</span>"
                + "<span style='display:block;color:#9ca3af;'>Please do not reply directly.</span>"
                + "</td></tr></table>"
                + "</td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    /** Standard label: value row — table-based for consistent rendering */
    private String row(String label, String value) {
        return "<tr>"
                + "<td style='padding:7px 16px 7px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;width:160px;'>" + label + "</td>"
                + "<td style='padding:7px 0;color:#111827;font-size:13px;font-weight:600;vertical-align:top;'>" + value + "</td>"
                + "</tr>";
    }

    /** Bold / highlighted row — for totals, key amounts */
    private String rowBold(String label, String value) {
        return "<tr style='border-top:1px solid #e5e7eb;'>"
                + "<td style='padding:10px 16px 10px 0;color:#374151;font-size:14px;font-weight:700;vertical-align:top;width:160px;'>" + label + "</td>"
                + "<td style='padding:10px 0;color:#EAB308;font-size:16px;font-weight:800;vertical-align:top;'>" + value + "</td>"
                + "</tr>";
    }

    /** Wraps row(s) inside a styled detail card table */
    private String card(String content) {
        return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:24px 0;'>"
                + "<tr><td style='padding:20px 24px;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                + content
                + "</table></td></tr></table>";
    }

    /** Red-tinted card for overdue/rejected content */
    private String cardRed(String content) {
        return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin:24px 0;'>"
                + "<tr><td style='padding:20px 24px;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                + content
                + "</table></td></tr></table>";
    }

    /** Green-tinted card for verified/success content */
    private String cardGreen(String content) {
        return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin:24px 0;'>"
                + "<tr><td style='padding:20px 24px;'>"
                + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0'>"
                + content
                + "</table></td></tr></table>";
    }

    /** Inline code-style display for credentials */
    private String code(String text) {
        return "<code style='background:#111827;color:#EAB308;padding:2px 8px;"
                + "border-radius:4px;font-size:14px;'>" + text + "</code>";
    }

    /** Yellow warning banner — table-based for email compatibility */
    private String warn(String message) {
        return "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' "
                + "style='background:#fefce8;border:1px solid #fde047;border-radius:8px;margin-bottom:24px;'>"
                + "<tr><td style='padding:14px 18px;color:#854d0e;font-family:Arial,sans-serif;font-size:13px;'>"
                + "&#9888;&nbsp; " + message
                + "</td></tr></table>";
    }

    /** Section heading inside email body */
    private String sectionTitle(String title) {
        return "<h2 style='font-family:Arial,sans-serif;color:#111827;font-size:18px;"
                + "font-weight:800;margin:0 0 8px 0;border-bottom:3px solid #EAB308;'"
                + ">"
                + title + "</h2>";
    }

    /** Body paragraph text */
    private String para(String text) {
        return "<p style='font-family:Arial,sans-serif;font-size:14px;color:#4b5563;"
                + "line-height:1.7;margin:10px 0;'>" + text + "</p>";
    }

    /** Call-to-action button — table-based for email client compatibility */
    private String cta(String label, String url) {
        return "<table role='presentation' cellpadding='0' cellspacing='0' style='margin-top:24px;'>"
                + "<tr><td style='background:#EAB308;border-radius:8px;'>"
                + "<a href='" + url + "' style='display:inline-block;padding:14px 32px;"
                + "font-family:Arial,sans-serif;font-size:14px;font-weight:800;"
                + "color:#000000;text-decoration:none;letter-spacing:0.5px;'>"
                + label + " &#8594;"
                + "</a></td></tr></table>";
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