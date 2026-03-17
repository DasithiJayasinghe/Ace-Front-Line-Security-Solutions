package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.DuplicateResourceException;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final ClientFeedbackRepository feedbackRepository;
    private final ClientRepository clientRepository;

    @Transactional
    public FeedbackResponse submitFeedback(Integer clientId, FeedbackSubmissionRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear  = now.getYear();

        // Enforce once-per-month rule — guide Phase 14
        feedbackRepository.findByClientClientIdAndSubmissionMonthAndSubmissionYear(
                clientId, currentMonth, currentYear).ifPresent(existing -> {
            throw new DuplicateResourceException(
                    "You have already submitted feedback for this month. One submission per month is allowed.");
        });

        ClientFeedback feedback = new ClientFeedback();
        feedback.setClient(client);
        feedback.setOverallRating(request.getOverallRating());
        feedback.setOfficerConductRating(request.getOfficerConductRating());
        feedback.setResponseTimeRating(request.getResponseTimeRating());
        feedback.setCommunicationRating(request.getCommunicationRating());
        feedback.setComments(request.getComments());
        feedback.setImprovements(request.getImprovements());
        feedback.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false);
        feedback.setSubmissionMonth(currentMonth);
        feedback.setSubmissionYear(currentYear);
        feedback.setStatus(FeedbackStatus.PENDING);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setCreatedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse approveFeedback(Integer feedbackId, boolean displayOnHomepage) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.APPROVED);
        feedback.setIsApproved(true);
        // Only show on homepage if: non-anonymous (or anonymous consented) AND rating >= 4
        boolean canDisplay = displayOnHomepage
                && feedback.getOverallRating() != null
                && feedback.getOverallRating() >= 4;
        feedback.setDisplayOnHomepage(canDisplay);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse rejectFeedback(Integer feedbackId, String adminResponse) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.REJECTED);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setAdminResponse(adminResponse);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional
    public FeedbackResponse flagFeedback(Integer feedbackId, String adminResponse) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setStatus(FeedbackStatus.FLAGGED);
        feedback.setIsApproved(false);
        feedback.setDisplayOnHomepage(false);
        feedback.setAdminResponse(adminResponse);
        feedback.setReviewedAt(LocalDateTime.now());

        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getAllFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackById(Integer feedbackId) {
        return mapToResponse(feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId)));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getFeedbackByClient(Integer clientId) {
        return feedbackRepository.findByClientClientIdOrderByCreatedAtDesc(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getPendingFeedback() {
        return feedbackRepository.findPendingReview()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getApprovedForHomepage() {
        // Guide Phase 16: top 6 only
        return feedbackRepository.findApprovedForHomepage()
                .stream().limit(6).map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getAverageRating() {
        Double avg = feedbackRepository.getOverallAverageRating();
        return avg != null ? avg : 0.0;
    }

    @Transactional
    public FeedbackResponse replyToFeedback(Integer feedbackId, String replyMessage) {
        ClientFeedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        feedback.setAdminResponse(replyMessage);
        feedback.setReviewedAt(LocalDateTime.now());
        return mapToResponse(feedbackRepository.save(feedback));
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> getApprovedFeedback() {
        return feedbackRepository.findByIsApprovedTrueOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public byte[] generateFeedbackReportPdf() {
        List<ClientFeedback> all = feedbackRepository.findAll();
        BaseColor YELLOW  = new BaseColor(255, 193, 7);
        BaseColor DARK    = new BaseColor(31, 31, 31);
        BaseColor MUTED   = new BaseColor(107, 114, 128);
        BaseColor ROW_ALT = new BaseColor(249, 250, 251);

        Font titleFont   = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.WHITE);
        Font subFont     = new Font(Font.FontFamily.HELVETICA, 9,  Font.NORMAL, BaseColor.WHITE);
        Font headerFont  = new Font(Font.FontFamily.HELVETICA, 8,  Font.BOLD, BaseColor.WHITE);
        Font cellFont    = new Font(Font.FontFamily.HELVETICA, 8,  Font.NORMAL, DARK);
        Font mutedFont   = new Font(Font.FontFamily.HELVETICA, 7,  Font.NORMAL, MUTED);
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, DARK);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
        DateTimeFormatter mf  = DateTimeFormatter.ofPattern("MMM yyyy");

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Header band ──────────────────────────────────────────────────
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{6f, 2f});
            headerTable.setSpacingAfter(16);

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBackgroundColor(DARK);
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setPadding(12);
            leftCell.addElement(new Phrase("ACE FRONT LINE SECURITY SOLUTIONS", titleFont));
            leftCell.addElement(new Phrase("Client Feedback Report  \u2022  Generated: " +
                    LocalDateTime.now().format(dtf), subFont));
            headerTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBackgroundColor(YELLOW);
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setPadding(12);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            Font bigFont = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, DARK);
            rightCell.addElement(new Phrase("FEEDBACK\nREPORT", bigFont));
            headerTable.addCell(rightCell);
            doc.add(headerTable);

            // ── Summary stats ────────────────────────────────────────────────
            long total    = all.size();
            long pending  = all.stream().filter(f -> f.getStatus() == FeedbackStatus.PENDING).count();
            long approved = all.stream().filter(f -> f.getStatus() == FeedbackStatus.APPROVED).count();
            long rejected = all.stream().filter(f -> f.getStatus() == FeedbackStatus.REJECTED).count();
            long flagged  = all.stream().filter(f -> f.getStatus() == FeedbackStatus.FLAGGED).count();
            double avgRating = all.stream().filter(f -> f.getOverallRating() != null)
                    .mapToInt(ClientFeedback::getOverallRating).average().orElse(0);

            PdfPTable statsTable = new PdfPTable(5);
            statsTable.setWidthPercentage(100);
            statsTable.setSpacingAfter(16);
            for (String[] s : new String[][]{
                    {"Total", String.valueOf(total), "#1F1F1F"},
                    {"Pending", String.valueOf(pending), "#F59E0B"},
                    {"Approved", String.valueOf(approved), "#10B981"},
                    {"Rejected", String.valueOf(rejected), "#EF4444"},
                    {"Avg Rating", String.format("%.1f / 5", avgRating), "#3B82F6"}
            }) {
                PdfPCell sc = new PdfPCell();
                sc.setBorder(Rectangle.BOX);
                sc.setBorderColor(new BaseColor(229, 231, 235));
                sc.setPadding(8);
                sc.setHorizontalAlignment(Element.ALIGN_CENTER);
                Font valFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, DARK);
                sc.addElement(new Phrase(s[1], valFont));
                sc.addElement(new Phrase(s[0], mutedFont));
                statsTable.addCell(sc);
            }
            doc.add(statsTable);

            // ── Accent bar ───────────────────────────────────────────────────
            PdfPTable bar = new PdfPTable(1);
            bar.setWidthPercentage(100);
            bar.setSpacingAfter(10);
            PdfPCell barCell = new PdfPCell(new Phrase(" "));
            barCell.setFixedHeight(3);
            barCell.setBackgroundColor(YELLOW);
            barCell.setBorder(Rectangle.NO_BORDER);
            bar.addCell(barCell);
            doc.add(bar);

            // ── Feedback table ───────────────────────────────────────────────
            Paragraph sectionTitle = new Paragraph("All Feedback Records", sectionFont);
            sectionTitle.setSpacingAfter(6);
            doc.add(sectionTitle);

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.8f, 2f, 1f, 1f, 1f, 1f, 1.5f, 2.5f, 1f});

            for (String h : new String[]{"#","Company","Overall","Officer","Response","Comms","Month","Comment","Status"}) {
                PdfPCell hc = new PdfPCell(new Phrase(h, headerFont));
                hc.setBackgroundColor(DARK);
                hc.setBorder(Rectangle.NO_BORDER);
                hc.setPadding(5);
                table.addCell(hc);
            }

            int rowNum = 1;
            for (ClientFeedback f : all) {
                BaseColor bg = (rowNum % 2 == 0) ? ROW_ALT : BaseColor.WHITE;
                String period = (f.getSubmissionMonth() != null && f.getSubmissionYear() != null)
                        ? LocalDate.of(f.getSubmissionYear(), f.getSubmissionMonth(), 1).format(mf)
                        : (f.getCreatedAt() != null ? f.getCreatedAt().toLocalDate().format(mf) : "-");
                String name   = Boolean.TRUE.equals(f.getIsAnonymous()) ? "Anonymous"
                        : (f.getClient() != null ? f.getClient().getCompanyName() : "-");
                String comment = f.getComments() != null
                        ? (f.getComments().length() > 60 ? f.getComments().substring(0, 57) + "..." : f.getComments())
                        : "-";
                for (String val : new String[]{
                        String.valueOf(rowNum), name,
                        stars(f.getOverallRating()), stars(f.getOfficerConductRating()),
                        stars(f.getResponseTimeRating()), stars(f.getCommunicationRating()),
                        period, comment, f.getStatus() != null ? f.getStatus().toString() : "-"
                }) {
                    PdfPCell tc = new PdfPCell(new Phrase(val, cellFont));
                    tc.setBackgroundColor(bg);
                    tc.setBorder(Rectangle.NO_BORDER);
                    tc.setBorderWidthBottom(0.5f);
                    tc.setBorderColorBottom(new BaseColor(229, 231, 235));
                    tc.setPadding(5);
                    table.addCell(tc);
                }
                rowNum++;
            }
            doc.add(table);
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate feedback report PDF: " + e.getMessage(), e);
        }
    }

    private String stars(Integer rating) {
        if (rating == null) return "-";
        return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating) + " (" + rating + ")";
    }

    private FeedbackResponse mapToResponse(ClientFeedback f) {
        FeedbackResponse r = new FeedbackResponse();
        r.setFeedbackId(f.getFeedbackId());
        r.setClientId(f.getClient().getClientId());
        // Hide company name if anonymous — guide Phase 16
        r.setCompanyName(Boolean.TRUE.equals(f.getIsAnonymous()) ? "Anonymous" : f.getClient().getCompanyName());
        r.setOverallRating(f.getOverallRating());
        r.setOfficerConductRating(f.getOfficerConductRating());
        r.setResponseTimeRating(f.getResponseTimeRating());
        r.setCommunicationRating(f.getCommunicationRating());
        r.setComments(f.getComments());
        r.setImprovements(f.getImprovements());
        r.setIsAnonymous(f.getIsAnonymous());
        r.setSubmissionMonth(f.getSubmissionMonth());
        r.setSubmissionYear(f.getSubmissionYear());
        r.setStatus(f.getStatus().toString());
        r.setIsApproved(f.getIsApproved());
        r.setDisplayOnHomepage(f.getDisplayOnHomepage());
        r.setAdminResponse(f.getAdminResponse());
        r.setCreatedAt(f.getCreatedAt());
        r.setReviewedAt(f.getReviewedAt());
        return r;
    }
}