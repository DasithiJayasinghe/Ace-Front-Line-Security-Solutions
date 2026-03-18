package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryAllowanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryDeductionRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.List;

/**
 * Core payroll service: generates salary (payroll) records,
 * stores allowances/deductions and handles mark-as-paid.
 *
 * NOTE: Controller layer will later call these methods when wiring forms.
 */
@Service
public class SalaryService {

    private final UserRepository officerRepository;
    private final SalaryRepository salaryRepository;
    private final SalaryAllowanceRepository allowanceRepository;
    private final SalaryDeductionRepository deductionRepository;
    private final AdvanceRequestRepository advanceRequestRepository;

    public SalaryService(UserRepository officerRepository,
            SalaryRepository salaryRepository,
            SalaryAllowanceRepository allowanceRepository,
            SalaryDeductionRepository deductionRepository,
            AdvanceRequestRepository advanceRequestRepository) {
        this.officerRepository = officerRepository;
        this.salaryRepository = salaryRepository;
        this.allowanceRepository = allowanceRepository;
        this.deductionRepository = deductionRepository;
        this.advanceRequestRepository = advanceRequestRepository;
    }

    @Transactional(readOnly = true)
    public SalaryTrendsDTO getSalaryTrends(Long officerId) {
        List<Salary> salaries;
        if (officerId != null && officerId > 0) {
            salaries = salaryRepository.findByOfficer_IdAndStatusPaidOnly(officerId);
        } else {
            salaries = salaryRepository.findByStatusPaidOnly();
        }

        System.out.println("DEBUG: Database returned " + salaries.size() + " records from PAID-only query.");
        for (Salary s : salaries) {
            System.out.println(
                    "DEBUG: Record ID " + s.getId() + " | Month: " + s.getMonth() + " | Status: " + s.getStatus());
        }

        SalaryTrendsDTO dto = new SalaryTrendsDTO();

        // Filter out records with null month to avoid grouping errors,
        // and add a REDUNDANT filter for PAID status to be absolutely sure
        List<Salary> validSalaries = salaries.stream()
                .filter(s -> s.getMonth() != null)
                .filter(s -> s.getStatus() != null && s.getStatus() == Salary.Status.PAID)
                .collect(Collectors.toList());

        System.out.println("DEBUG: Processed " + validSalaries.size() + " records after redundant PAID filtering.");

        if (validSalaries.isEmpty()) {
            dto.setMonthlyTrends(Collections.emptyList());
            dto.setDistribution(Collections.emptyList());
            dto.setAverageSalary(BigDecimal.ZERO);
            dto.setHighestSalary(BigDecimal.ZERO);
            dto.setLowestSalary(BigDecimal.ZERO);
            dto.setTotalYTD(BigDecimal.ZERO);
            dto.setGrowthRate(0.0);
            dto.setAllowanceBreakdown(Collections.emptyList());
            dto.setDeductionBreakdown(Collections.emptyList());
            return dto;
        }

        // 1. Monthly Trends (Average Net Salary, Total Allowances, Total Deductions per
        // Month)
        Map<String, List<Salary>> groupedByMonth = validSalaries.stream()
                .collect(Collectors.groupingBy(Salary::getMonth, TreeMap::new, Collectors.toList()));

        List<SalaryTrendsDTO.MonthTrend> trends = groupedByMonth.entrySet().stream()
                .map(e -> {
                    // Only include PAID records for the month calculation
                    List<Salary> paidInMonth = e.getValue().stream()
                            .filter(s -> s.getStatus() != null && s.getStatus() == Salary.Status.PAID)
                            .collect(Collectors.toList());

                    BigDecimal totalNet = paidInMonth.stream()
                            .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal avgNet = BigDecimal.ZERO;
                    if (!paidInMonth.isEmpty()) {
                        avgNet = totalNet.divide(BigDecimal.valueOf(paidInMonth.size()), 2, RoundingMode.HALF_UP);
                    }

                    BigDecimal totalAllowances = paidInMonth.stream()
                            .map(s -> s.getTotalAllowances() != null ? s.getTotalAllowances() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalDeductions = paidInMonth.stream()
                            .map(s -> s.getTotalDeductions() != null ? s.getTotalDeductions() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalOvertime = paidInMonth.stream()
                            .flatMap(s -> s.getSalaryAllowances().stream())
                            .filter(sa -> {
                                String name = sa.getAllowanceName();
                                return name != null
                                        && (name.toLowerCase().contains("overtime") || name.equalsIgnoreCase("ot"));
                            })
                            .map(sa -> sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return new SalaryTrendsDTO.MonthTrend(e.getKey(), avgNet, totalAllowances, totalDeductions,
                            totalOvertime);
                })
                .collect(Collectors.toList());
        dto.setMonthlyTrends(trends);

        // 2. Statistics
        BigDecimal totalNetAll = validSalaries.stream()
                .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setAverageSalary(totalNetAll.divide(BigDecimal.valueOf(validSalaries.size()), 2, RoundingMode.HALF_UP));

        validSalaries.stream()
                .filter(s -> s.getNetSalary() != null)
                .max(Comparator.comparing(Salary::getNetSalary))
                .ifPresent(s -> {
                    dto.setHighestSalary(s.getNetSalary());
                    dto.setHighestSalaryMonth(s.getMonth());
                });

        validSalaries.stream()
                .filter(s -> s.getNetSalary() != null)
                .min(Comparator.comparing(Salary::getNetSalary))
                .ifPresent(s -> {
                    dto.setLowestSalary(s.getNetSalary());
                    dto.setLowestSalaryMonth(s.getMonth());
                });

        // Calculate YTD (for current year)
        String currentYear = String.valueOf(LocalDate.now().getYear());
        BigDecimal ytd = validSalaries.stream()
                .filter(s -> s.getMonth().startsWith(currentYear))
                .map(s -> s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalYTD(ytd);

        BigDecimal totalOvertimeAll = validSalaries.stream()
                .flatMap(s -> s.getSalaryAllowances().stream())
                .filter(sa -> {
                    String name = sa.getAllowanceName();
                    return name != null && (name.toLowerCase().contains("overtime") || name.equalsIgnoreCase("ot"));
                })
                .map(sa -> sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalOvertime(totalOvertimeAll);

        // 3. Growth Rate
        if (trends.size() >= 2) {
            BigDecimal first = trends.get(0).getAmount();
            BigDecimal last = trends.get(trends.size() - 1).getAmount();
            if (first != null && first.compareTo(BigDecimal.ZERO) > 0) {
                double rate = (last.subtract(first)).doubleValue() / first.doubleValue() * 100;
                dto.setGrowthRate(Math.round(rate * 10) / 10.0);
            }
        }

        // 4. Distribution
        Map<String, Long> distMap = new LinkedHashMap<>();
        distMap.put("0-30k", 0L);
        distMap.put("30-40k", 0L);
        distMap.put("40-50k", 0L);
        distMap.put("50-60k", 0L);
        distMap.put("60-70k", 0L);
        distMap.put("70k+", 0L);

        for (Salary s : validSalaries) {
            BigDecimal netS = s.getNetSalary() != null ? s.getNetSalary() : BigDecimal.ZERO;
            double net = netS.doubleValue();
            if (net < 30000)
                distMap.put("0-30k", distMap.get("0-30k") + 1);
            else if (net < 40000)
                distMap.put("30-40k", distMap.get("30-40k") + 1);
            else if (net < 50000)
                distMap.put("40-50k", distMap.get("40-50k") + 1);
            else if (net < 60000)
                distMap.put("50-60k", distMap.get("50-60k") + 1);
            else if (net < 70000)
                distMap.put("60-70k", distMap.get("60-70k") + 1);
            else
                distMap.put("70k+", distMap.get("70k+") + 1);
        }

        List<SalaryTrendsDTO.SalaryDistribution> distribution = distMap.entrySet().stream()
                .map(e -> new SalaryTrendsDTO.SalaryDistribution(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
        dto.setDistribution(distribution);

        // 5. Breakdowns (Aggregated)
        Map<String, BigDecimal> allowancesMap = new HashMap<>();
        Map<String, BigDecimal> deductionsMap = new HashMap<>();

        for (Salary s : validSalaries) {
            // Include basic salary in allowance breakdown
            BigDecimal basic = s.getBasicSalary() != null ? s.getBasicSalary() : BigDecimal.ZERO;
            allowancesMap.merge("Basic Salary", basic, BigDecimal::add);

            if (s.getSalaryAllowances() != null) {
                for (SalaryAllowance sa : s.getSalaryAllowances()) {
                    String name = sa.getAllowanceName() != null ? sa.getAllowanceName() : "Other Allowance";
                    BigDecimal amt = sa.getAllowanceAmount() != null ? sa.getAllowanceAmount() : BigDecimal.ZERO;
                    allowancesMap.merge(name, amt, BigDecimal::add);
                }
            }
            if (s.getSalaryDeductions() != null) {
                for (SalaryDeduction sd : s.getSalaryDeductions()) {
                    String name = sd.getDeductionName() != null ? sd.getDeductionName() : "Other Deduction";
                    BigDecimal amt = sd.getDeductionAmount() != null ? sd.getDeductionAmount() : BigDecimal.ZERO;
                    deductionsMap.merge(name, amt, BigDecimal::add);
                }
            }
        }

        System.out.println("DEBUG: Allowance Breakdown Size: " + allowancesMap.size());
        allowancesMap.forEach((k, v) -> System.out.println("DEBUG: Allowance: " + k + " = " + v));

        dto.setAllowanceBreakdown(allowancesMap.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new SalaryTrendsDTO.BreakdownItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalaryTrendsDTO.BreakdownItem::getAmount).reversed())
                .collect(Collectors.toList()));

        dto.setDeductionBreakdown(deductionsMap.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> new SalaryTrendsDTO.BreakdownItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(SalaryTrendsDTO.BreakdownItem::getAmount).reversed())
                .collect(Collectors.toList()));

        return dto;
    }

    @Transactional
    public Salary generatePayroll(Long officerId,
            String month,
            LocalDate periodStart,
            LocalDate periodEnd,
            int totalShifts,
            BigDecimal basicSalary,
            BigDecimal overtimeAmount,
            List<SalaryAllowance> allowances,
            List<SalaryDeduction> deductions,
            String calculatedBy) {

        User officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + officerId));

        // Ensure only one payroll per officer per month
        Optional<Salary> existing = salaryRepository.findByOfficerAndMonth(officer, month);
        if (existing.isPresent()) {
            throw new IllegalStateException(
                    "Payroll for officer " + officerId + " and month " + month + " already exists");
        }

        // --- AUTOMATION: Detect paid undeducted advances ---
        List<AdvanceRequest> advances = advanceRequestRepository.findByOfficerAndAdvanceMonthAndStatusAndDeducted(
                officer, month, AdvanceRequest.Status.PAID, false);

        for (AdvanceRequest adv : advances) {
            SalaryDeduction d = new SalaryDeduction();
            d.setDeductionName("Salary Advance");
            d.setDeductionAmount(adv.getRequestedAmount());
            d.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
            deductions.add(d);
        }
        // ---------------------------------------------------

        // --- AUTOMATION: Calculate EPF (8% of Basic) ---
        BigDecimal epfAmount = BigDecimal.valueOf(officer.getBasicSalary() != null ? officer.getBasicSalary() : 0.0)
                .multiply(new BigDecimal("0.08"));

        // Check if EPF already exists in the provided deductions to avoid duplicates
        boolean epfExists = deductions.stream()
                .anyMatch(d -> "EPF (8%)".equalsIgnoreCase(d.getDeductionName())
                        || "EPF (3%)".equalsIgnoreCase(d.getDeductionName()));

        if (!epfExists) {
            SalaryDeduction epf = new SalaryDeduction();
            epf.setDeductionName("EPF (8%)");
            epf.setDeductionAmount(epfAmount);
            epf.setDeductionType(SalaryDeduction.DeductionType.STATUTORY);
            deductions.add(epf);
        }
        // ------------------------------------------------

        // Use passed overtimeAmount if non-zero, otherwise re-calculate based on rate
        BigDecimal calculatedOvertime;
        if (overtimeAmount != null && overtimeAmount.compareTo(BigDecimal.ZERO) != 0) {
            calculatedOvertime = overtimeAmount;
        } else {
            BigDecimal otRate = BigDecimal.valueOf(500.00); // OT Rate removed from User entity
            calculatedOvertime = otRate.multiply(BigDecimal.valueOf(totalShifts));
        }

        boolean overtimeExists = allowances.stream()
                .map(SalaryAllowance::getAllowanceName)
                .filter(n -> n != null && !n.isBlank())
                .map(n -> n.trim().toLowerCase())
                .anyMatch(n -> n.equals("ot") || n.contains("overtime"));

        if (!overtimeExists && calculatedOvertime.compareTo(BigDecimal.ZERO) != 0) {
            SalaryAllowance overtime = new SalaryAllowance();
            overtime.setAllowanceName("Overtime (OT)");
            overtime.setAllowanceAmount(calculatedOvertime);
            allowances.add(0, overtime);
        }

        BigDecimal totalAllowances = allowances.stream()
                .map(SalaryAllowance::getAllowanceAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(basicSalary != null ? basicSalary : BigDecimal.ZERO);

        BigDecimal totalDeductions = deductions.stream()
                .map(SalaryDeduction::getDeductionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal net = totalAllowances.subtract(totalDeductions);

        Salary salary = new Salary();
        salary.setOfficer(officer);
        salary.setMonth(month);
        salary.setPayPeriodStart(periodStart);
        salary.setPayPeriodEnd(periodEnd);

        // --- AUTOMATION: Schedule Payment for the 10th of the following month ---
        if (periodEnd != null) {
            salary.setPaymentDate(periodEnd.plusDays(10));
        }

        salary.setStatus(Salary.Status.CALCULATED);
        salary.setTotalShifts(totalShifts);
        salary.setBasicSalary(basicSalary);
        salary.setTotalAllowances(totalAllowances);
        salary.setTotalDeductions(totalDeductions);
        salary.setNetSalary(net);
        salary.setCalculatedBy(calculatedBy);

        Salary saved = salaryRepository.save(salary);

        // Persist allowances/deductions with back-reference
        for (SalaryAllowance a : allowances) {
            a.setPayroll(saved);
            allowanceRepository.save(a);
        }
        for (SalaryDeduction d : deductions) {
            d.setPayroll(saved);
            deductionRepository.save(d);
        }

        // --- AUTOMATION: Mark advances as deducted ---
        for (AdvanceRequest adv : advances) {
            adv.setDeducted(true);
            advanceRequestRepository.save(adv);
        }
        // ----------------------------------------------

        return saved;
    }

    public List<Salary> getCalculatedForMonth(String month) {
        return salaryRepository.findByStatusAndMonth(Salary.Status.CALCULATED, month);
    }

    public List<Salary> getCalculatedAcrossAllMonths() {
        return salaryRepository.findByStatus(Salary.Status.CALCULATED);
    }

    public List<Salary> getPaidForMonth(String month) {
        return salaryRepository.findByStatusAndMonth(Salary.Status.PAID, month);
    }

    public List<Salary> getPaidAcrossAllMonths() {
        return salaryRepository.findByStatus(Salary.Status.PAID);
    }

    @Transactional
    public Salary markAsPaid(Long payrollId,
            LocalDate paymentDate,
            String paymentMethod,
            String paymentReference,
            String adminUsername) {

        Salary salary = salaryRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found: " + payrollId));

        salary.setStatus(Salary.Status.PAID);
        salary.setPaymentDate(paymentDate);
        salary.setPaymentMethod(paymentMethod);
        salary.setPaymentReference(paymentReference);
        salary.setMarkedPaidBy(adminUsername);
        salary.setPaidAt(OffsetDateTime.now());

        return salaryRepository.save(salary);
    }

    /**
     * Find any PAID advances for this officer + month that are not yet marked as
     * deducted,
     * so they can be shown and auto-added as deductions in the UI.
     */
    public List<AdvanceRequest> getUndeductedPaidAdvances(Long officerId, String month) {
        User officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + officerId));

        if ("ALL".equalsIgnoreCase(month)) {
            return advanceRequestRepository.findByOfficerAndStatus(officer, AdvanceRequest.Status.PAID).stream()
                    .filter(a -> !a.isDeducted())
                    .toList();
        }

        return advanceRequestRepository.findByOfficerAndAdvanceMonthAndStatus(
                officer, month, AdvanceRequest.Status.PAID).stream()
                .filter(a -> !a.isDeducted())
                .toList();
    }

    @Transactional
    public void updateAdvanceStatus(Long advanceId, AdvanceRequest.Status status) {
        if (status == AdvanceRequest.Status.APPROVED) {
            int currentDay = LocalDate.now().getDayOfMonth();
            if (currentDay < 20 || currentDay > 23) {
                throw new IllegalArgumentException(
                        "Advance requests can only be approved between the 20th and 23rd of the month.");
            }
        }

        AdvanceRequest adv = advanceRequestRepository.findById(advanceId)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found: " + advanceId));
        adv.setStatus(status);
        advanceRequestRepository.save(adv);
    }

    @Transactional
    public void markAdvanceAsPaid(Long advanceId, LocalDate paymentDate) {
        int currentDay = LocalDate.now().getDayOfMonth();
        if (currentDay < 25) {
            throw new IllegalArgumentException(
                    "Approved advance requests can only be paid out on or after the 25th of the month.");
        }

        AdvanceRequest adv = advanceRequestRepository.findById(advanceId)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found: " + advanceId));
        adv.setStatus(AdvanceRequest.Status.PAID);
        adv.setPaymentDate(paymentDate);
        advanceRequestRepository.save(adv);
    }

    @Transactional
    public void markAdvanceAsDeducted(Long advanceId) {
        AdvanceRequest adv = advanceRequestRepository.findById(advanceId)
                .orElseThrow(() -> new IllegalArgumentException("Advance not found: " + advanceId));
        adv.setDeducted(true);
        advanceRequestRepository.save(adv);
    }

    public Salary getPayrollById(Long id) {
        return salaryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found: " + id));
    }

    public void deletePayroll(Long id) {
        salaryRepository.deleteById(id);
    }

    public List<Salary> getPaidPayslipsForOfficer(Long officerId) {
        return salaryRepository.findByOfficer_IdAndStatus(officerId, Salary.Status.PAID);
    }

    public com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO getDashboardStats() {
        LocalDate now = LocalDate.now();
        LocalDate firstDayOfMonth = now.withDayOfMonth(1);
        LocalDate lastDayOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO stats = new com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO();

        stats.setTotalOfficers((int) officerRepository
                .countByRole(com.security.Ace.Front.Line.Security.Solutions.enums.Role.SECURITY_OFFICER));

        // Pending Payrolls: All records with status CALCULATED (across all months)
        stats.setPendingPayrolls(salaryRepository.findByStatus(Salary.Status.CALCULATED).size());

        // Paid This Month: Records with status PAID and paymentDate within the current
        // calendar month
        List<Salary> paidThisMonth = salaryRepository.findByStatusAndPaymentDateBetween(Salary.Status.PAID,
                firstDayOfMonth, lastDayOfMonth);
        stats.setPaidThisMonth(paidThisMonth.size());

        // Total Payout: Sum of netSalary for the records paid this month
        BigDecimal totalPayout = paidThisMonth.stream()
                .map(Salary::getNetSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalPayout(totalPayout);

        return stats;
    }

    @Transactional
    public Salary updatePayroll(Long payrollId,
            int totalShifts,
            BigDecimal overtimeAmount,
            List<SalaryAllowance> allowances,
            List<SalaryDeduction> deductions,
            String updatedBy) {
        Salary salary = salaryRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found: " + payrollId));

        if (salary.getStatus() == Salary.Status.PAID) {
            throw new IllegalStateException("Cannot edit a payroll that is already marked as PAID");
        }

        salary.setTotalShifts(totalShifts);

        // Use passed overtimeAmount if non-zero, otherwise re-calculate based on rate
        BigDecimal actualOvertime;
        if (overtimeAmount != null && overtimeAmount.compareTo(BigDecimal.ZERO) != 0) {
            actualOvertime = overtimeAmount;
        } else {
            BigDecimal otRate = BigDecimal.valueOf(500.00); // OT Rate removed from User entity
            actualOvertime = otRate.multiply(BigDecimal.valueOf(totalShifts));
        }

        // Clear and replace allowances
        salary.getSalaryAllowances().clear();
        BigDecimal totalAllowancesAmount = salary.getBasicSalary();

        SalaryAllowance overtime = new SalaryAllowance();
        overtime.setPayroll(salary);
        overtime.setAllowanceName("Overtime (OT)");
        overtime.setAllowanceAmount(actualOvertime);
        salary.getSalaryAllowances().add(overtime);
        totalAllowancesAmount = totalAllowancesAmount.add(actualOvertime);

        for (SalaryAllowance a : allowances) {
            if (a.getAllowanceName() != null && a.getAllowanceName().toLowerCase().contains("overtime")) {
                continue;
            }
            a.setPayroll(salary);
            salary.getSalaryAllowances().add(a);
            totalAllowancesAmount = totalAllowancesAmount.add(a.getAllowanceAmount());
        }

        // Clear and replace deductions
        salary.getSalaryDeductions().clear();

        // --- AUTOMATION: Calculate EPF (8% of Basic) ---
        BigDecimal epfAmount = salary.getBasicSalary().multiply(new BigDecimal("0.08"));
        SalaryDeduction epf = new SalaryDeduction();
        epf.setPayroll(salary);
        epf.setDeductionName("EPF (8%)");
        epf.setDeductionAmount(epfAmount);
        epf.setDeductionType(SalaryDeduction.DeductionType.STATUTORY);
        salary.getSalaryDeductions().add(epf);
        // ------------------------------------------------

        BigDecimal totalDeductionsAmount = epfAmount;
        for (SalaryDeduction d : deductions) {
            // Skip EPF if it was manually sent in the request to avoid duplicates
            if ("EPF (8%)".equalsIgnoreCase(d.getDeductionName())
                    || "EPF (3%)".equalsIgnoreCase(d.getDeductionName())) {
                continue;
            }
            d.setPayroll(salary);
            salary.getSalaryDeductions().add(d);
            totalDeductionsAmount = totalDeductionsAmount.add(d.getDeductionAmount());
        }

        salary.setTotalAllowances(totalAllowancesAmount);
        salary.setTotalDeductions(totalDeductionsAmount);
        salary.setNetSalary(totalAllowancesAmount.subtract(totalDeductionsAmount));
        salary.setCalculatedBy(updatedBy);

        return salaryRepository.save(salary);
    }
}
