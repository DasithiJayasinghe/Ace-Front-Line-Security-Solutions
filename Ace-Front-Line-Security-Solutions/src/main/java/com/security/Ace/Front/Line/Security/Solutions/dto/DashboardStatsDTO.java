package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;

public class DashboardStatsDTO {
    private long totalOfficers;
    private long pendingPayrolls;
    private long paidThisMonth;
    private BigDecimal totalPayout;

    // Getters and Setters
    public long getTotalOfficers() {
        return totalOfficers;
    }

    public void setTotalOfficers(long totalOfficers) {
        this.totalOfficers = totalOfficers;
    }

    public long getPendingPayrolls() {
        return pendingPayrolls;
    }

    public void setPendingPayrolls(long pendingPayrolls) {
        this.pendingPayrolls = pendingPayrolls;
    }

    public long getPaidThisMonth() {
        return paidThisMonth;
    }

    public void setPaidThisMonth(long paidThisMonth) {
        this.paidThisMonth = paidThisMonth;
    }

    public BigDecimal getTotalPayout() {
        return totalPayout;
    }

    public void setTotalPayout(BigDecimal totalPayout) {
        this.totalPayout = totalPayout;
    }
}
