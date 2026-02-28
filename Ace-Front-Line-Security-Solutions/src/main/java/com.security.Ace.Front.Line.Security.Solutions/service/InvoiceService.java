package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final BigDecimal SSCL_RATE = new BigDecimal("0.025");  // 2.5%
    private static final BigDecimal VAT_RATE  = new BigDecimal("0.18");   // 18%
    private static final BigDecimal LATE_FEE_RATE = new BigDecimal("0.015"); // 1.5%

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final DeductionRepository deductionRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;

    // ── Manual invoice creation (Phase 13) ──────────────────────────────────

    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        // For AUTO invoices — prevent duplicate per billing period
        InvoiceType type = request.getInvoiceType() != null
                ? InvoiceType.valueOf(request.getInvoiceType()) : InvoiceType.AUTO;

        if (type == InvoiceType.AUTO &&
                invoiceRepository.existsByClientClientIdAndBillingMonthAndBillingYear(
                        request.getClientId(), request.getBillingMonth(), request.getBillingYear())) {
            throw new InvalidOperationException(
                    "Invoice already exists for " + request.getBillingMonth() + "/" + request.getBillingYear());
        }

        // MANUAL invoices require a reason — audit trail
        if (type == InvoiceType.MANUAL &&
                (request.getManualReason() == null || request.getManualReason().isBlank())) {
            throw new InvalidOperationException("Manual invoices require a reason for audit trail");
        }

        String invoiceNumber = generateInvoiceNumber(request.getBillingYear(), request.getBillingMonth());

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setClient(client);
        invoice.setBillingMonth(request.getBillingMonth());
        invoice.setBillingYear(request.getBillingYear());
        invoice.setPeriodFrom(request.getPeriodFrom());
        invoice.setPeriodTo(request.getPeriodTo());
        invoice.setIssueDate(request.getIssueDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setInvoiceType(type);
        invoice.setManualReason(request.getManualReason());
        invoice.setNotes(request.getNotes());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setCreatedAt(LocalDateTime.now());

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Save line items
        if (request.getItems() != null) {
            for (InvoiceItemRequest itemReq : request.getItems()) {
                InvoiceItem item = new InvoiceItem();
                item.setInvoice(savedInvoice);
                item.setItemType(ItemType.valueOf(itemReq.getItemType()));
                item.setDescription(itemReq.getDescription());
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
                item.setTaxPercentage(itemReq.getTaxPercentage() != null
                        ? BigDecimal.valueOf(itemReq.getTaxPercentage()) : BigDecimal.ZERO);
                // Persist line total
                item.setLineTotal(item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP));
                invoiceItemRepository.save(item);
            }
        }

        recalculateInvoiceTotals(savedInvoice.getInvoiceId());
        return mapToResponse(invoiceRepository.findById(savedInvoice.getInvoiceId()).orElseThrow());
    }

    // ── Auto-generate invoices for all active clients (1st of month) ─────────

    @Transactional
    public void generateMonthlyInvoices(int month, int year) {
        List<Client> activeClients = clientRepository.findByStatus(ClientStatus.ACTIVE);
        YearMonth ym = YearMonth.of(year, month);
        LocalDate periodFrom = ym.atDay(1);
        LocalDate periodTo   = ym.atEndOfMonth();
        LocalDate issueDate  = LocalDate.of(year, month, 1);
        // Due date = 15th of the current month (invoice is issued for the previous month)
        LocalDate dueDate    = issueDate.plusMonths(1).withDayOfMonth(10);
        int billingMonth     = month;
        int billingYear      = year;

        for (Client client : activeClients) {
            // Skip if invoice already exists for this period
            if (invoiceRepository.existsByClientClientIdAndBillingMonthAndBillingYear(
                    client.getClientId(), billingMonth, billingYear)) {
                continue;
            }

            String invoiceNumber = generateInvoiceNumber(billingYear, billingMonth);

            Invoice invoice = new Invoice();
            invoice.setInvoiceNumber(invoiceNumber);
            invoice.setClient(client);
            invoice.setBillingMonth(billingMonth);
            invoice.setBillingYear(billingYear);
            invoice.setPeriodFrom(periodFrom);
            invoice.setPeriodTo(periodTo);
            invoice.setIssueDate(issueDate);
            invoice.setDueDate(dueDate);
            invoice.setInvoiceType(InvoiceType.AUTO);
            invoice.setStatus(InvoiceStatus.DRAFT);
            invoice.setCreatedAt(LocalDateTime.now());

            Invoice savedInvoice = invoiceRepository.save(invoice);

            // Calculate number of shifts in the billing month (31 days = 31 shifts for 12-hr)
            int shiftsInMonth = ym.lengthOfMonth();

            // OIC line item
            if (client.getOicCount() != null && client.getOicRatePerShift() != null) {
                InvoiceItem oicItem = new InvoiceItem();
                oicItem.setInvoice(savedInvoice);
                oicItem.setItemType(ItemType.OIC_SERVICE);
                oicItem.setDescription("OIC Officers — " + client.getOicCount() + " officers × "
                        + shiftsInMonth + " shifts");
                oicItem.setQuantity((double) (client.getOicCount() * shiftsInMonth));
                oicItem.setUnitPrice(client.getOicRatePerShift());
                oicItem.setTaxPercentage(BigDecimal.ZERO);
                oicItem.setLineTotal(client.getOicRatePerShift()
                        .multiply(BigDecimal.valueOf(client.getOicCount() * shiftsInMonth))
                        .setScale(2, RoundingMode.HALF_UP));
                invoiceItemRepository.save(oicItem);
            }

            // JSO line item
            if (client.getJsoCount() != null && client.getJsoRatePerShift() != null) {
                InvoiceItem jsoItem = new InvoiceItem();
                jsoItem.setInvoice(savedInvoice);
                jsoItem.setItemType(ItemType.JSO_SERVICE);
                jsoItem.setDescription("JSO Officers — " + client.getJsoCount() + " officers × "
                        + shiftsInMonth + " shifts");
                jsoItem.setQuantity((double) (client.getJsoCount() * shiftsInMonth));
                jsoItem.setUnitPrice(client.getJsoRatePerShift());
                jsoItem.setTaxPercentage(BigDecimal.ZERO);
                jsoItem.setLineTotal(client.getJsoRatePerShift()
                        .multiply(BigDecimal.valueOf(client.getJsoCount() * shiftsInMonth))
                        .setScale(2, RoundingMode.HALF_UP));
                invoiceItemRepository.save(jsoItem);
            }

            // Link approved deductions for this billing period
            List<Deduction> deductions = deductionRepository
                    .findByClientClientIdAndTargetBillingMonthAndTargetBillingYear(
                            client.getClientId(), billingMonth, billingYear);
            for (Deduction d : deductions) {
                if (d.getAccountantApprovalStatus() == DeductionApprovalStatus.APPROVED
                        && !d.getAppliedToInvoice()) {
                    d.setInvoice(savedInvoice);
                    deductionRepository.save(d);
                }
            }

            recalculateInvoiceTotals(savedInvoice.getInvoiceId());
        }
    }

    // ── DRAFT → APPROVED ────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse approveInvoice(Integer invoiceId, Integer accountantUserId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvalidOperationException("Only DRAFT invoices can be approved. Current status: "
                    + invoice.getStatus());
        }

        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setApprovedAt(LocalDateTime.now());
        invoice.setApprovedBy(accountantUserId);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── APPROVED → ISSUED ────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse issueInvoice(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() != InvoiceStatus.APPROVED) {
            throw new InvalidOperationException(
                    "Only APPROVED invoices can be issued. Current status: " + invoice.getStatus()
                            + ". Please approve the invoice first.");
        }

        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setIssuedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // Send invoice email with PDF to client
        emailService.sendInvoiceEmail(invoice.getClient(), invoice);

        return mapToResponse(invoice);
    }

    // ── CANCEL ────────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse cancelInvoice(Integer invoiceId, String cancellationReason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvalidOperationException("PAID invoices cannot be cancelled. Raise a credit note instead.");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidOperationException("Invoice is already cancelled.");
        }
        if (cancellationReason == null || cancellationReason.isBlank()) {
            throw new InvalidOperationException("Cancellation reason is required.");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setCancellationReason(cancellationReason);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── DISPUTE ───────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse disputeInvoice(Integer invoiceId, String disputeReason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID
                || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidOperationException("Cannot dispute a " + invoice.getStatus() + " invoice.");
        }

        invoice.setStatus(InvoiceStatus.DISPUTED);
        invoice.setDisputeReason(disputeReason);
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── WAIVE ─────────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse waiveInvoice(Integer invoiceId, String waivedReason, Double waivedAmount) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (waivedReason == null || waivedReason.isBlank()) {
            throw new InvalidOperationException("Waiver reason is required for audit trail.");
        }

        invoice.setStatus(InvoiceStatus.WAIVED);
        invoice.setWaivedReason(waivedReason);
        invoice.setWaivedAmount(BigDecimal.valueOf(waivedAmount));
        return mapToResponse(invoiceRepository.save(invoice));
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getDraftInvoices() {
        return invoiceRepository.findAllDraftInvoices().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Integer invoiceId) {
        return mapToResponse(invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId)));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByClient(Integer clientId) {
        return invoiceRepository.findByClientClientIdOrderByIssueDateDesc(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getClientInvoiceHistory(Integer clientId) {
        return invoiceRepository.findClientInvoiceHistory(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPendingInvoicesByClient(Integer clientId) {
        return invoiceRepository.findPendingInvoicesByClient(clientId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findOverdueInvoices()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ── Recalculate totals — SSCL + VAT split ────────────────────────────────

    @Transactional
    public void recalculateInvoiceTotals(Integer invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoiceId);

        BigDecimal oicTotal = BigDecimal.ZERO;
        BigDecimal jsoTotal = BigDecimal.ZERO;
        BigDecimal otTotal  = BigDecimal.ZERO;
        BigDecimal otherChargesTotal = BigDecimal.ZERO;
        BigDecimal deductionsTotal   = BigDecimal.ZERO;

        for (InvoiceItem item : items) {
            BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            // Update persisted line total
            item.setLineTotal(lineTotal);
            invoiceItemRepository.save(item);

            switch (item.getItemType()) {
                case OIC_SERVICE:   oicTotal = oicTotal.add(lineTotal); break;
                case JSO_SERVICE:   jsoTotal = jsoTotal.add(lineTotal); break;
                case OVERTIME:      otTotal  = otTotal.add(lineTotal);  break;
                case OTHER_CHARGE:  otherChargesTotal = otherChargesTotal.add(lineTotal); break;
                case DEDUCTION:     deductionsTotal   = deductionsTotal.add(lineTotal);   break;
                default: break; // SSCL, VAT, LATE_FEE handled below
            }
        }

        // Also sum deductions linked to this invoice from the deductions table
        List<Deduction> linkedDeductions = deductionRepository
                .findByClientClientIdAndAppliedToInvoiceFalse(invoice.getClient().getClientId())
                .stream()
                .filter(d -> d.getInvoice() != null
                        && d.getInvoice().getInvoiceId().equals(invoiceId)
                        && d.getAccountantApprovalStatus() == DeductionApprovalStatus.APPROVED)
                .collect(Collectors.toList());

        for (Deduction d : linkedDeductions) {
            deductionsTotal = deductionsTotal.add(d.getAmount());
        }

        // Subtotal = OIC + JSO + OT
        BigDecimal subtotal = oicTotal.add(jsoTotal).add(otTotal);

        // Net Subtotal = Subtotal − Deductions
        BigDecimal netSubtotal = subtotal.subtract(deductionsTotal)
                .max(BigDecimal.ZERO); // never negative

        // Invoice Amount = Net Subtotal + Other Charges (pre-tax)
        BigDecimal invoiceAmount = netSubtotal.add(otherChargesTotal);

        // SSCL = 2.5% of Invoice Amount
        BigDecimal ssclAmount = invoiceAmount.multiply(SSCL_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // VAT = 18% of Invoice Amount
        BigDecimal vatAmount = invoiceAmount.multiply(VAT_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        // TOTAL PAYABLE = Invoice Amount + SSCL + VAT
        BigDecimal totalAmount = invoiceAmount.add(ssclAmount).add(vatAmount);

        // Paid amount from verified payments
        Double paidDouble = paymentRepository.getTotalVerifiedAmountForInvoice(invoiceId);
        BigDecimal paidAmount = paidDouble != null
                ? BigDecimal.valueOf(paidDouble).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal balanceAmount = totalAmount.subtract(paidAmount).max(BigDecimal.ZERO);

        // Persist all calculated fields
        invoice.setSubtotal(subtotal);
        invoice.setDeductionsTotal(deductionsTotal);
        invoice.setNetSubtotal(netSubtotal);
        invoice.setOtherCharges(otherChargesTotal);
        invoice.setInvoiceAmount(invoiceAmount);
        invoice.setSsclAmount(ssclAmount);
        invoice.setVatAmount(vatAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setPaidAmount(paidAmount);
        invoice.setBalanceAmount(balanceAmount);

        invoiceRepository.save(invoice);
    }

    // ── Invoice number generation ─────────────────────────────────────────────

    private String generateInvoiceNumber(Integer year, Integer month) {
        long count = invoiceRepository.countInvoicesForMonth(month, year);
        return String.format("INV-%d-%02d-%04d", year, month, count + 1);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private InvoiceResponse mapToResponse(Invoice invoice) {
        InvoiceResponse r = new InvoiceResponse();
        r.setInvoiceId(invoice.getInvoiceId());
        r.setInvoiceNumber(invoice.getInvoiceNumber());
        r.setClientId(invoice.getClient().getClientId());
        r.setCompanyName(invoice.getClient().getCompanyName());
        r.setClientVatNumber(invoice.getClient().getVatNumber());
        r.setServiceLocation(invoice.getClient().getServiceLocation());
        r.setBillingMonth(invoice.getBillingMonth());
        r.setBillingYear(invoice.getBillingYear());
        r.setPeriodFrom(invoice.getPeriodFrom());
        r.setPeriodTo(invoice.getPeriodTo());
        r.setIssueDate(invoice.getIssueDate());
        r.setDueDate(invoice.getDueDate());
        r.setSubtotal(bd(invoice.getSubtotal()));
        r.setDeductionsTotal(bd(invoice.getDeductionsTotal()));
        r.setNetSubtotal(bd(invoice.getNetSubtotal()));
        r.setOtherCharges(bd(invoice.getOtherCharges()));
        r.setInvoiceAmount(bd(invoice.getInvoiceAmount()));
        r.setSsclAmount(bd(invoice.getSsclAmount()));
        r.setVatAmount(bd(invoice.getVatAmount()));
        r.setTotalAmount(bd(invoice.getTotalAmount()));
        r.setPaidAmount(bd(invoice.getPaidAmount()));
        r.setBalanceAmount(bd(invoice.getBalanceAmount()));
        r.setLateFee(bd(invoice.getLateFee()));
        r.setInvoiceType(invoice.getInvoiceType() != null ? invoice.getInvoiceType().toString() : null);
        r.setStatus(invoice.getStatus().toString());
        r.setNotes(invoice.getNotes());
        r.setManualReason(invoice.getManualReason());
        r.setDisputeReason(invoice.getDisputeReason());
        r.setApprovedAt(invoice.getApprovedAt());
        r.setIssuedAt(invoice.getIssuedAt());
        r.setVerifiedAt(invoice.getVerifiedAt());
        r.setCreatedAt(invoice.getCreatedAt());

        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceInvoiceId(invoice.getInvoiceId());
        r.setItems(items.stream().map(this::mapItemToResponse).collect(Collectors.toList()));

        List<Payment> payments = paymentRepository
                .findByInvoiceInvoiceIdOrderByPaymentDateDesc(invoice.getInvoiceId());
        r.setPayments(payments.stream().map(this::mapPaymentToResponse).collect(Collectors.toList()));

        return r;
    }

    private InvoiceItemResponse mapItemToResponse(InvoiceItem item) {
        InvoiceItemResponse r = new InvoiceItemResponse();
        r.setItemId(item.getItemId());
        r.setItemType(item.getItemType().toString());
        r.setDescription(item.getDescription());
        r.setQuantity(item.getQuantity());
        r.setUnitPrice(item.getUnitPrice());
        r.setLineTotal(item.getLineTotal());
        r.setTaxPercentage(item.getTaxPercentage());
        return r;
    }

    private PaymentResponse mapPaymentToResponse(Payment payment) {
        PaymentResponse r = new PaymentResponse();
        r.setPaymentId(payment.getPaymentId());
        r.setInvoiceId(payment.getInvoice().getInvoiceId());
        r.setInvoiceNumber(payment.getInvoice().getInvoiceNumber());
        r.setClientId(payment.getClient().getClientId());
        r.setCompanyName(payment.getClient().getCompanyName());
        r.setAmountPaid(payment.getAmountPaid().doubleValue());
        r.setPaymentDate(payment.getPaymentDate());
        r.setPaymentMethod(payment.getPaymentMethod().toString());
        r.setTransactionReference(payment.getTransactionReference());
        r.setPaymentProofPath(payment.getPaymentProofPath());
        r.setVerificationStatus(payment.getVerificationStatus().toString());
        r.setRemarks(payment.getRemarks());
        r.setRejectionReason(payment.getRejectionReason());
        r.setProofUploadedAt(payment.getProofUploadedAt());
        r.setVerifiedAt(payment.getVerifiedAt());
        r.setVerifiedBy(payment.getVerifiedBy());
        return r;
    }

    private Double bd(BigDecimal val) {
        return val != null ? val.doubleValue() : 0.0;
    }
}