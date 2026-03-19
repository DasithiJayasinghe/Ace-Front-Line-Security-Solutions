package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.LoanDeduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.RequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanDeductionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.LoanRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanDeductionService {

    private final LoanDeductionRepository loanDeductionRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final UserRepository userRepository;

    /**
     * Generates a deduction schedule after a loan is approved.
     * Splits the loan amount equally across repayment months.
     * Called automatically when ExecutiveOfficer approves a loan.
     */
    @Transactional
    public List<LoanDeduction> generateSchedule(Long loanId) {
        LoanRequest loan = loanRequestRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan request not found"));

        if (loan.getStatus() != RequestStatus.APPROVED) {
            throw new BusinessException("Can only generate schedule for approved loans");
        }

        // Prevent duplicate schedules
        if (loanDeductionRepository.existsByLoanRequest(loan)) {
            throw new BusinessException("Deduction schedule already exists for this loan");
        }

        int months = loan.getRepaymentMonths() != null ? loan.getRepaymentMonths() : 1;
        double totalAmount = loan.getAmount();
        double monthlyAmount = Math.floor(totalAmount / months * 100) / 100; // round down to 2 decimals
        double lastMonthAmount = totalAmount - (monthlyAmount * (months - 1)); // remainder goes to last month

        List<LoanDeduction> schedule = new ArrayList<>();
        LocalDate startMonth = LocalDate.now().plusMonths(1).withDayOfMonth(1); // start deductions next month

        for (int i = 0; i < months; i++) {
            LocalDate deductionDate = startMonth.plusMonths(i);
            String monthStr = deductionDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            double amount = (i == months - 1) ? lastMonthAmount : monthlyAmount;

            LoanDeduction deduction = LoanDeduction.builder()
                    .loanRequest(loan)
                    .user(loan.getUser())
                    .deductionMonth(monthStr)
                    .amount(amount)
                    .status("PENDING")
                    .build();

            schedule.add(deduction);
        }

        return loanDeductionRepository.saveAll(schedule);
    }

    /**
     * Get the full deduction schedule for a specific loan.
     */
    public List<LoanDeduction> getScheduleForLoan(Long loanId) {
        return loanDeductionRepository.findByLoanRequestId(loanId);
    }

    /**
     * Get all deductions for a specific user.
     */
    public List<LoanDeduction> getDeductionsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanDeductionRepository.findByUser(user);
    }

    /**
     * Get all pending deductions (for accountant dashboard).
     */
    public List<LoanDeduction> getAllPendingDeductions() {
        return loanDeductionRepository.findByStatus("PENDING");
    }

    /**
     * Get pending deductions for a specific month (for payroll processing).
     */
    public List<LoanDeduction> getPendingDeductionsForMonth(String month) {
        return loanDeductionRepository.findByDeductionMonthAndStatus(month, "PENDING");
    }

    /**
     * Get all deductions (pending + paid) for all loans.
     */
    public List<LoanDeduction> getAllDeductions() {
        return loanDeductionRepository.findAll();
    }

    /**
     * Mark a deduction as paid (when accountant processes payroll).
     */
    @Transactional
    public LoanDeduction markAsPaid(Long deductionId, String processedByUsername) {
        LoanDeduction deduction = loanDeductionRepository.findById(deductionId)
                .orElseThrow(() -> new ResourceNotFoundException("Deduction not found"));

        if ("PAID".equals(deduction.getStatus())) {
            throw new BusinessException("Deduction is already paid");
        }

        User processedBy = userRepository.findByUsername(processedByUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        deduction.setStatus("PAID");
        deduction.setProcessedBy(processedBy);
        deduction.setProcessedAt(LocalDateTime.now());

        return loanDeductionRepository.save(deduction);
    }

    /**
     * Get total pending loan deduction amount for a user in a given month.
     * Used by PaysheetService to auto-calculate deductions.
     */
    public Double getPendingLoanDeductionForUserMonth(String username, String month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanDeductionRepository.sumPendingDeductionsForUserAndMonth(user, month);
    }

    /**
     * Get remaining balance for a loan.
     */
    public Double getRemainingBalance(Long loanId) {
        LoanRequest loan = loanRequestRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        return loanDeductionRepository.sumPendingForLoan(loan);
    }
}
