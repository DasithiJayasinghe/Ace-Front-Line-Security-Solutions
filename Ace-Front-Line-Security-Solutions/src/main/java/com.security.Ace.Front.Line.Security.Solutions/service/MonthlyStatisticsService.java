package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyStatisticsDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyStatistics;
import com.security.Ace.Front.Line.Security.Solutions.repository.AttendanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ShiftAssignmentRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.MonthlyStatisticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MonthlyStatisticsService {

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private MonthlyStatisticsRepository monthlyStatisticsRepository;

    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public List<MonthlyStatisticsDTO> getMonthlyStatistics(Long managerId, int month, int year) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();

        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Area Manager not found: " + managerId));

        // Approved schedules only.
        Long branchId = manager.getBranch().getId();
        List<ShiftAssignment> approvedAssignments = shiftAssignmentRepository
                .findApprovedAssignmentsByBranchAndDateRange(branchId, monthStart, monthEnd);

        // Monthly shifts come from APPROVED shift assignments.
        // Monthly OT hours come from attendance overtimeHours for the same month.
        Map<Long, MonthlyStatisticsDTO> byOfficer = new LinkedHashMap<>();
        Map<Long, SecurityOfficer> officerById = new LinkedHashMap<>();

        for (ShiftAssignment a : approvedAssignments) {
            SecurityOfficer officer = a.getSecurityOfficer();
            if (officer == null) continue;

            Long officerId = officer.getId();
            MonthlyStatisticsDTO dto = byOfficer.computeIfAbsent(officerId, id -> {
                MonthlyStatisticsDTO m = new MonthlyStatisticsDTO();
                m.setSecurityId(officer.getSecurityId());
                m.setOfficerName(officer.getFullName());
                m.setMonthlyShifts(0);
                m.setMonthlyOvertimeHours(0.0);
                return m;
            });

            officerById.putIfAbsent(officerId, officer);

            // Each ShiftAssignment row corresponds to one scheduled shift (DAY or NIGHT) for the officer.
            dto.setMonthlyShifts(dto.getMonthlyShifts() + 1);
        }

        // OT hours come from attendance overtimeHours for the same month.
        List<Attendance> attendance = attendanceRepository.findByAreaManagerInPeriod(managerId, monthStart, monthEnd);
        Map<Long, Double> overtimeByOfficerId = new LinkedHashMap<>();
        for (Attendance a : attendance) {
            if (a == null || a.getSecurityOfficer() == null) continue;
            Long officerId = a.getSecurityOfficer().getId();
            Double ot = a.getOvertimeHours();
            if (ot == null) ot = 0.0;
            overtimeByOfficerId.merge(officerId, ot, Double::sum);
        }

        // Replace persisted rows for this manager+month+year.
        monthlyStatisticsRepository.deleteByAreaManagerIdAndMonthAndYear(managerId, month, year);

        LocalDateTime now = LocalDateTime.now();
        List<MonthlyStatistics> entities = new ArrayList<>();
        for (Map.Entry<Long, MonthlyStatisticsDTO> entry : byOfficer.entrySet()) {
            Long officerId = entry.getKey();
            MonthlyStatisticsDTO dto = entry.getValue();

            SecurityOfficer officer = officerById.get(officerId);
            if (officer == null) continue;

            Double monthlyOt = overtimeByOfficerId.get(officerId);
            dto.setMonthlyOvertimeHours(monthlyOt != null ? monthlyOt : 0.0);

            MonthlyStatistics stats = new MonthlyStatistics();
            stats.setAreaManager(manager);
            stats.setSecurityOfficer(officer);
            stats.setMonth(month);
            stats.setYear(year);
            stats.setMonthlyShifts(dto.getMonthlyShifts());
            stats.setMonthlyOvertimeHours(dto.getMonthlyOvertimeHours());
            stats.setGeneratedAt(now);

            entities.add(stats);
        }

        if (entities.isEmpty()) {
            return new ArrayList<>();
        }

        List<MonthlyStatistics> saved = monthlyStatisticsRepository.saveAll(entities);
        List<MonthlyStatisticsDTO> result = new ArrayList<>();

        for (MonthlyStatistics s : saved) {
            if (s.getSecurityOfficer() == null) continue;

            MonthlyStatisticsDTO dto = new MonthlyStatisticsDTO();
            dto.setId(s.getId());
            dto.setSecurityId(s.getSecurityOfficer().getSecurityId());
            dto.setOfficerName(s.getSecurityOfficer().getFullName());
            dto.setMonthlyShifts(s.getMonthlyShifts());
            dto.setMonthlyOvertimeHours(s.getMonthlyOvertimeHours());
            result.add(dto);
        }

        return result;
    }

    @Transactional
    public MonthlyStatisticsDTO updateMonthlyStatistics(Long id, Integer monthlyShifts, Double monthlyOvertimeHours) {
        MonthlyStatistics stats = monthlyStatisticsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Monthly statistics not found: " + id));

        if (monthlyShifts != null) {
            stats.setMonthlyShifts(monthlyShifts);
        }
        if (monthlyOvertimeHours != null) {
            stats.setMonthlyOvertimeHours(monthlyOvertimeHours);
        }

        stats.setGeneratedAt(LocalDateTime.now());
        MonthlyStatistics saved = monthlyStatisticsRepository.save(stats);

        MonthlyStatisticsDTO dto = new MonthlyStatisticsDTO();
        dto.setId(saved.getId());
        dto.setSecurityId(saved.getSecurityOfficer() != null ? saved.getSecurityOfficer().getSecurityId() : null);
        dto.setOfficerName(saved.getSecurityOfficer() != null ? saved.getSecurityOfficer().getFullName() : null);
        dto.setMonthlyShifts(saved.getMonthlyShifts());
        dto.setMonthlyOvertimeHours(saved.getMonthlyOvertimeHours());
        return dto;
    }

    @Transactional
    public void deleteMonthlyStatistics(Long id) {
        if (!monthlyStatisticsRepository.existsById(id)) {
            throw new IllegalArgumentException("Monthly statistics not found: " + id);
        }
        monthlyStatisticsRepository.deleteById(id);
    }

    /**
     * Used by shift scheduling approval flow. Finds the AreaManager in `area_managers`
     * by email, or creates it from `users` if missing, then recalculates stats.
     */
    @Transactional
    public void refreshMonthlyStatisticsForAreaManagerEmail(String areaManagerEmail, int month, int year) {
        if (areaManagerEmail == null || areaManagerEmail.isBlank()) return;

        AreaManager manager = areaManagerRepository.findByEmail(areaManagerEmail.trim())
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(areaManagerEmail.trim())
                            .orElseThrow(() -> new IllegalArgumentException("Area manager not found in users: " + areaManagerEmail));

                    AreaManager created = new AreaManager();
                    created.setEmail(user.getEmail());
                    created.setPassword(user.getPassword());
                    created.setBranch(user.getBranch());
                    created.setFullName(user.getFullName() != null ? user.getFullName() : user.getEmail());
                    created.setEmployeeId(user.getUsername() != null ? user.getUsername() : String.valueOf(user.getId()));
                    created.setContactNumber(user.getMobileNumber() != null ? user.getMobileNumber() : "0000000000");
                    created.setDesignation(user.getDesignation() != null ? user.getDesignation() : "Area Manager");
                    created.setStatus("ACTIVE");
                    return areaManagerRepository.save(created);
                });

        getMonthlyStatistics(manager.getId(), month, year);
    }
}

