package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AttendanceDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SecurityOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private SecurityOfficerRepository securityOfficerRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    @Lazy
    private WeeklyReportService weeklyReportService;

    private static final int MAX_SHIFTS_PER_MONTH = 60;
    private static final double STANDARD_SHIFT_HOURS = 8.0;

    @Transactional
    public AttendanceDTO createAttendance(AttendanceDTO dto, Long managerId) {
        SecurityOfficer officer = securityOfficerRepository.findById(dto.getSecurityOfficerId())
                .orElseThrow(() -> new RuntimeException("Security Officer not found"));

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Check if attendance already exists for this date
        if (attendanceRepository.findBySecurityOfficerAndAttendanceDate(officer, dto.getAttendanceDate()).isPresent()) {
            throw new RuntimeException("Attendance already recorded for this date");
        }

        Attendance attendance = new Attendance();
        attendance.setSecurityOfficer(officer);
        attendance.setAttendanceDate(dto.getAttendanceDate());
        attendance.setCheckInTime(dto.getCheckInTime());
        attendance.setCheckOutTime(dto.getCheckOutTime());
        attendance.setStatus(dto.getStatus());
        attendance.setRemarks(dto.getRemarks());
        attendance.setRecordedBy(manager);
        attendance.setIsShiftCounted(dto.getIsShiftCounted() != null ? dto.getIsShiftCounted() : true);

        // Calculate hours worked and overtime from times
        calculateHours(attendance);

        // Check monthly shift limit only if this record will count as a shift
        YearMonth yearMonth = YearMonth.from(dto.getAttendanceDate());
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        Integer currentShifts = attendanceRepository.countShiftsByOfficerInPeriod(
                officer.getId(), monthStart, monthEnd);

        if (currentShifts != null
                && currentShifts >= MAX_SHIFTS_PER_MONTH
                && Boolean.TRUE.equals(attendance.getIsShiftCounted())) {
            throw new RuntimeException("Officer has reached maximum shifts for the month (60 shifts)");
        }

        // If OT hours were provided explicitly, override calculated OT
        if (dto.getOvertimeHours() != null) {
            attendance.setOvertimeHours(dto.getOvertimeHours());
        }

        Attendance saved = attendanceRepository.save(attendance);
        updateWeeklyReportForAttendance(saved, managerId);
        return convertToDTO(saved);
    }

    @Transactional
    public AttendanceDTO updateAttendance(Long id, AttendanceDTO dto) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        attendance.setCheckInTime(dto.getCheckInTime());
        attendance.setCheckOutTime(dto.getCheckOutTime());
        attendance.setStatus(dto.getStatus());
        attendance.setRemarks(dto.getRemarks());
        attendance.setIsShiftCounted(dto.getIsShiftCounted());

        // Recalculate hours and OT from times
        calculateHours(attendance);

        // If OT hours were provided explicitly, override calculated OT
        if (dto.getOvertimeHours() != null) {
            attendance.setOvertimeHours(dto.getOvertimeHours());
        }

        Attendance updated = attendanceRepository.save(attendance);
        Long managerId = updated.getRecordedBy() != null
                ? updated.getRecordedBy().getId()
                : (updated.getSecurityOfficer().getAreaManager() != null
                ? updated.getSecurityOfficer().getAreaManager().getId()
                : null);
        if (managerId != null) {
            updateWeeklyReportForAttendance(updated, managerId);
        }
        return convertToDTO(updated);
    }

    /**
     * Refresh the weekly report for this officer and week so the Weekly Report area reflects
     * the latest attendance. Only attendances with "Count as Shift" = true are included in the report.
     */
    private void updateWeeklyReportForAttendance(Attendance attendance, Long managerId) {
        try {
            weeklyReportService.generateWeeklyReport(
                    attendance.getSecurityOfficer().getId(),
                    managerId,
                    attendance.getAttendanceDate()
            );
        } catch (Exception e) {
            // Log but do not fail the attendance save
        }
    }

    private void calculateHours(Attendance attendance) {
        if (attendance.getCheckInTime() != null && attendance.getCheckOutTime() != null) {
            Duration duration = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime());
            double hours = duration.toMinutes() / 60.0;
            attendance.setHoursWorked(hours);

            // Calculate overtime (hours over 8)
            if (hours > STANDARD_SHIFT_HOURS) {
                attendance.setOvertimeHours(hours - STANDARD_SHIFT_HOURS);
            } else {
                attendance.setOvertimeHours(0.0);
            }

            // Business rule: if working hours < 12, do NOT count this as a shift
            if (hours < 12.0) {
                attendance.setIsShiftCounted(false);
            }
        } else {
            attendance.setHoursWorked(0.0);
            attendance.setOvertimeHours(0.0);
            // No working hours -> never count as a shift
            attendance.setIsShiftCounted(false);
        }
    }

    public List<AttendanceDTO> getAttendanceByOfficer(Long officerId) {
        return attendanceRepository.findBySecurityOfficerId(officerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDateRange(LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByAttendanceDateBetween(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByManagerInPeriod(Long managerId, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByAreaManagerInPeriod(managerId, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteAttendance(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
        Long officerId = attendance.getSecurityOfficer().getId();
        LocalDate attendanceDate = attendance.getAttendanceDate();
        Long managerId = attendance.getRecordedBy() != null
                ? attendance.getRecordedBy().getId()
                : (attendance.getSecurityOfficer().getAreaManager() != null
                ? attendance.getSecurityOfficer().getAreaManager().getId()
                : null);
        attendanceRepository.deleteById(id);
        if (managerId != null) {
            try {
                weeklyReportService.generateWeeklyReport(officerId, managerId, attendanceDate);
            } catch (Exception ignored) { }
        }
    }

    private AttendanceDTO convertToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setSecurityOfficerId(attendance.getSecurityOfficer().getId());
        dto.setSecurityOfficerName(attendance.getSecurityOfficer().getFullName());
        dto.setSecurityId(attendance.getSecurityOfficer().getSecurityId());
        dto.setAttendanceDate(attendance.getAttendanceDate());
        dto.setCheckInTime(attendance.getCheckInTime());
        dto.setCheckOutTime(attendance.getCheckOutTime());
        dto.setStatus(attendance.getStatus());
        dto.setRemarks(attendance.getRemarks());
        dto.setHoursWorked(attendance.getHoursWorked());
        dto.setOvertimeHours(attendance.getOvertimeHours());
        dto.setIsShiftCounted(attendance.getIsShiftCounted());
        if (attendance.getRecordedBy() != null) {
            dto.setRecordedByName(attendance.getRecordedBy().getFullName());
        }
        return dto;
    }
}
