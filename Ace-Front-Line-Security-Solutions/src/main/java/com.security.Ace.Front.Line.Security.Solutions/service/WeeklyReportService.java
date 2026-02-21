package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.WeeklyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.WeeklyReport;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.WeeklyReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WeeklyReportService {

    @Autowired
    private WeeklyReportRepository weeklyReportRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Transactional
    public WeeklyReportDTO generateWeeklyReport(Long officerId, Long managerId, LocalDate weekDate) {
        SecurityOfficer officer = securityOfficerRepository.findById(officerId)
                .orElseThrow(() -> new RuntimeException("Security Officer not found"));

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Week of month: 1 = 1-7, 2 = 8-14, 3 = 15-21, 4 = 22 to end of month (same for every month)
        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        int weekStartDay = (weekNumber - 1) * 7 + 1;
        int lastDayOfMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        int weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDayOfMonth;
        LocalDate weekStart = LocalDate.of(year, month, weekStartDay);
        LocalDate weekEnd = LocalDate.of(year, month, weekEndDay);

        // Get attendance records for the week
        List<Attendance> attendances = attendanceRepository
                .findBySecurityOfficerIdAndAttendanceDateBetween(officerId, weekStart, weekEnd);

        // Calculate totals
        int totalShifts = (int) attendances.stream()
                .filter(Attendance::getIsShiftCounted)
                .count();

        double totalOvertimeHours = attendances.stream()
                .mapToDouble(a -> a.getOvertimeHours() != null ? a.getOvertimeHours() : 0.0)
                .sum();
        // Cap weekly OT at 42 hours
        if (totalOvertimeHours > 42.0) {
            totalOvertimeHours = 42.0;
        }

        double totalHoursWorked = attendances.stream()
                .mapToDouble(a -> a.getHoursWorked() != null ? a.getHoursWorked() : 0.0)
                .sum();

        // Check if report already exists (by officer, year, month, week of month)
        WeeklyReport report = weeklyReportRepository
                .findBySecurityOfficerIdAndYearAndMonthAndWeekNumber(officerId, year, month, weekNumber)
                .orElse(new WeeklyReport());

        report.setSecurityOfficer(officer);
        report.setAreaManager(manager);
        report.setWeekNumber(weekNumber);
        report.setMonth(month);
        report.setYear(year);
        report.setWeekStartDate(weekStart);
        report.setWeekEndDate(weekEnd);
        report.setTotalShifts(totalShifts);
        report.setTotalOvertimeHours(totalOvertimeHours);
        report.setTotalHoursWorked(totalHoursWorked);
        report.setGeneratedDate(LocalDate.now());

        WeeklyReport saved = weeklyReportRepository.save(report);
        return convertToDTO(saved);
    }

    /**
     * Generate weekly reports for all active officers in a given company for the specified manager and week.
     * This still stores one WeeklyReport per officer, but the caller treats it as a "company report"
     * consisting of multiple officer-level rows.
     */
    @Transactional
    public List<WeeklyReportDTO> generateWeeklyReportsForCompany(Long managerId,
                                                                 String companyName,
                                                                 LocalDate weekDate) {
        List<SecurityOfficer> officers = securityOfficerRepository
                .findActiveByManagerAndCompany(managerId, companyName);

        return officers.stream()
                .map(officer -> generateWeeklyReport(officer.getId(), managerId, weekDate))
                .collect(Collectors.toList());
    }

    public List<WeeklyReportDTO> getReportsByManager(Long managerId) {
        return weeklyReportRepository.findByAreaManagerId(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<WeeklyReportDTO> getReportsByManagerAndYear(Long managerId, Integer year) {
        return weeklyReportRepository.findByManagerAndYear(managerId, year).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get weekly reports for a specific company and week (for the CRUD section).
     * If weekDate is null, returns all reports for that company (all weeks).
     */
    public List<WeeklyReportDTO> getReportsByManagerCompanyAndWeek(Long managerId, String companyName, LocalDate weekDate) {
        List<WeeklyReportDTO> all = getReportsByManager(managerId);
        java.util.function.Predicate<WeeklyReportDTO> byCompany = dto ->
                companyName != null && companyName.equals(dto.getCompanyName());
        if (weekDate == null) {
            return all.stream().filter(byCompany).collect(Collectors.toList());
        }
        // Week of month: 1-7 -> 1, 8-14 -> 2, 15-21 -> 3, 22-end -> 4
        int year = weekDate.getYear();
        int month = weekDate.getMonthValue();
        int dayOfMonth = weekDate.getDayOfMonth();
        int weekNumber = Math.min(4, (dayOfMonth - 1) / 7 + 1);
        final int filterYear = year;
        final int filterMonth = month;
        final int filterWeek = weekNumber;
        return all.stream()
                .filter(byCompany)
                .filter(dto -> dto.getYear() != null && dto.getYear() == filterYear
                        && dto.getMonth() != null && dto.getMonth() == filterMonth
                        && dto.getWeekNumber() != null && dto.getWeekNumber() == filterWeek)
                .collect(Collectors.toList());
    }

    public WeeklyReportDTO getReportById(Long id) {
        WeeklyReport report = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Weekly report not found"));
        return convertToDTO(report);
    }

    @Transactional
    public WeeklyReportDTO updateWeeklyReport(Long id, WeeklyReportDTO dto) {
        WeeklyReport report = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Weekly report not found"));
        if (dto.getTotalShifts() != null) {
            int shifts = dto.getTotalShifts();
            if (shifts < 0) shifts = 0;
            if (shifts > 14) shifts = 14; // max 2 shifts/day * 7 days = 14
            report.setTotalShifts(shifts);
        }
        if (dto.getTotalOvertimeHours() != null) {
            double ot = dto.getTotalOvertimeHours();
            if (ot < 0.0) ot = 0.0;
            if (ot > 42.0) ot = 42.0; // max 42 OT hours per week
            report.setTotalOvertimeHours(ot);
        }
        if (dto.getTotalHoursWorked() != null) report.setTotalHoursWorked(dto.getTotalHoursWorked());
        if (dto.getRemarks() != null) report.setRemarks(dto.getRemarks());
        WeeklyReport saved = weeklyReportRepository.save(report);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteWeeklyReport(Long id) {
        if (!weeklyReportRepository.existsById(id)) {
            throw new RuntimeException("Weekly report not found");
        }
        weeklyReportRepository.deleteById(id);
    }

    private WeeklyReportDTO convertToDTO(WeeklyReport report) {
        WeeklyReportDTO dto = new WeeklyReportDTO();
        dto.setId(report.getId());
        dto.setSecurityOfficerName(report.getSecurityOfficer().getFullName());
        dto.setSecurityId(report.getSecurityOfficer().getSecurityId());
        dto.setCompanyName(report.getSecurityOfficer().getAssignedCompany());
        dto.setBranch(report.getSecurityOfficer().getBranch());
        dto.setTotalShifts(report.getTotalShifts());
        dto.setTotalOvertimeHours(report.getTotalOvertimeHours());
        dto.setTotalHoursWorked(report.getTotalHoursWorked());
        dto.setAreaManagerName(report.getAreaManager().getFullName());
        dto.setAreaManagerEmployeeId(report.getAreaManager().getEmployeeId());
        dto.setWeekStartDate(report.getWeekStartDate());
        dto.setWeekEndDate(report.getWeekEndDate());
        dto.setWeekNumber(report.getWeekNumber());
        dto.setMonth(report.getMonth());
        dto.setYear(report.getYear());
        dto.setRemarks(report.getRemarks());
        return dto;
    }
}
