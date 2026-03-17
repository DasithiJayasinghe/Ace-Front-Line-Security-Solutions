package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Deduction;
import com.security.Ace.Front.Line.Security.Solutions.entity.DeductionApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeductionRepository extends JpaRepository<Deduction, Integer> {

    List<Deduction> findByClientClientIdOrderByIncidentDateDesc(Integer clientId);

    // Unapplied deductions for a client (not yet on any invoice)
    List<Deduction> findByClientClientIdAndAppliedToInvoiceFalse(Integer clientId);

    // Deductions approved by accountant but not yet applied to an invoice
    List<Deduction> findByClientClientIdAndAccountantApprovalStatusAndAppliedToInvoiceFalse(
            Integer clientId, DeductionApprovalStatus approvalStatus);

    // Deductions queued for next month (invoice was already ISSUED when deduction was logged)
    List<Deduction> findByClientClientIdAndQueuedForNextMonthTrue(Integer clientId);

    // Deductions pending accountant review
    List<Deduction> findByAccountantApprovalStatus(DeductionApprovalStatus approvalStatus);

    // Deductions targeting a specific billing period
    List<Deduction> findByClientClientIdAndTargetBillingMonthAndTargetBillingYear(
            Integer clientId, Integer month, Integer year);

    // Sum of approved, unapplied deductions for a client
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deduction d " +
            "WHERE d.client.clientId = :clientId " +
            "AND d.appliedToInvoice = false " +
            "AND d.accountantApprovalStatus = 'APPROVED'")
    Double getTotalUnappliedDeductionsForClient(@Param("clientId") Integer clientId);

    // All unapplied deductions sum (regardless of approval — for admin view)
    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deduction d " +
            "WHERE d.client.clientId = :clientId AND d.appliedToInvoice = false")
    Double getTotalAllUnappliedDeductionsForClient(@Param("clientId") Integer clientId);

    @Query(value = "SELECT * FROM deductions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) " +
            "ORDER BY created_at DESC", nativeQuery = true)
    List<Deduction> findRecentDeductions();

    List<Deduction> findByOfficerIdOrderByIncidentDateDesc(Integer officerId);
}