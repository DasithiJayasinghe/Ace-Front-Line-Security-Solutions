package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ShiftScheduleService shiftScheduleService;
    private final NotificationService notificationService;

    // 1. Create Leave Request
    @Transactional
    public LeaveRequestDTO createLeaveRequest(CreateLeaveRequestDTO dto, Long employeeId) {
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new RuntimeException("Start date cannot be after end date");
        }

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!List.of("JSO", "SSO", "LSO", "CSO", "SECURITY_OFFICER").contains(employee.getRole())) {
            throw new RuntimeException("Only security officers can request leave");
        }

        if (employee.getClientCompany() == null) {
            throw new RuntimeException("Employee is not assigned to a client company");
        }

        // Check overlapping leaves
        List<LeaveRequestStatus> activeStatuses = List.of(
                LeaveRequestStatus.PENDING,
                LeaveRequestStatus.PENDING_REASSIGNMENT,
                LeaveRequestStatus.APPROVED
        );

        List<LeaveRequest> overlaps = leaveRequestRepository.findOverlappingLeaves(
                employeeId, dto.getStartDate(), dto.getEndDate(), activeStatuses
        );

        if (!overlaps.isEmpty()) {
            throw new RuntimeException("You already have an active leave request during this period");
        }

        // Validate monthly limits month-by-month
        validateMonthlyLimit(employeeId, dto.getStartDate(), dto.getEndDate(), activeStatuses);

        LeaveRequest request = LeaveRequest.builder()
                .employee(employee)
                .clientCompany(employee.getClientCompany())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveRequestStatus.PENDING)
                .replacementHandled(false)
                .build();

        request = leaveRequestRepository.save(request);
        return mapToDTO(request);
    }

    private void validateMonthlyLimit(Long employeeId, LocalDate newStart, LocalDate newEnd, List<LeaveRequestStatus> statuses) {
        LocalDate current = newStart;
        while (!current.isAfter(newEnd)) {
            int month = current.getMonthValue();
            int year = current.getYear();

            LocalDate monthStart = LocalDate.of(year, month, 1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            LocalDate intersectionStart = newStart.isAfter(monthStart) ? newStart : monthStart;
            LocalDate intersectionEnd = newEnd.isBefore(monthEnd) ? newEnd : monthEnd;

            int newLeaveDays = calculateLeaveDaysCount(employeeId, intersectionStart, intersectionEnd);
            int existingLeaveDays = calculateUsedLeavesForMonth(employeeId, month, year, statuses);

            if (existingLeaveDays + newLeaveDays > 4) {
                throw new RuntimeException(String.format("Monthly leave limit of 4 exceeded for %02d/%d", month, year));
            }

            current = monthEnd.plusDays(1);
        }
    }

    private int calculateUsedLeavesForMonth(Long employeeId, int month, int year, List<LeaveRequestStatus> statuses) {
        List<LeaveRequest> requests = leaveRequestRepository.findByEmployee_IdAndStatusIn(employeeId, statuses);

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        int totalDays = 0;
        for (LeaveRequest req : requests) {
            // Check if request overlaps with this month
            if (req.getStartDate().isAfter(monthEnd) || req.getEndDate().isBefore(monthStart)) {
                continue; // No overlap
            }
            
            if ((req.getStatus() == LeaveRequestStatus.APPROVED || req.getStatus() == LeaveRequestStatus.PENDING_REASSIGNMENT) 
                && req.getConsumedLeaveDays() != null) {
                totalDays += req.getConsumedLeaveDays();
            } else {
                LocalDate intersectionStart = req.getStartDate().isAfter(monthStart) ? req.getStartDate() : monthStart;
                LocalDate intersectionEnd = req.getEndDate().isBefore(monthEnd) ? req.getEndDate() : monthEnd;
                totalDays += calculateLeaveDaysCount(employeeId, intersectionStart, intersectionEnd);
            }
        }
        return totalDays;
    }

    private int calculateLeaveDaysCount(Long employeeId, LocalDate start, LocalDate end) {
        if (start.isAfter(end)) return 0;
        List<LocalDate> workingDates = assignmentRepository.findWorkingDatesByOfficerAndDateRange(employeeId, start, end);
        return (int) workingDates.stream().distinct().count();
    }

    // 2. Get My Leaves
    public List<LeaveRequestDTO> getMyLeaveRequests(Long employeeId) {
        return leaveRequestRepository.findByEmployee_IdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. Get My Leave Summary
    public LeaveSummaryDTO getMyLeaveSummary(Long employeeId, Integer month, Integer year) {
        int used = calculateUsedLeavesForMonth(
                employeeId, month, year,
                List.of(LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING_REASSIGNMENT)
        );

        return LeaveSummaryDTO.builder()
                .monthlyLimit(4)
                .usedLeaves(used)
                .remainingLeaves(Math.max(0, 4 - used))
                .month(month)
                .year(year)
                .build();
    }

    // 4. Get Leaves for Branch
    public List<LeaveRequestDTO> getLeavesForBranch(Long areaManagerId, LeaveRequestStatus status) {
        User am = userRepository.findById(areaManagerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        if (!"AREA_MANAGER".equals(am.getRole()) || am.getBranch() == null) {
            throw new RuntimeException("User is not an active Area Manager");
        }

        Long branchId = am.getBranch().getId();
        if (status == null) {
            return leaveRequestRepository.findByClientCompany_Branch_IdOrderByCreatedAtDesc(branchId)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        } else {
            return leaveRequestRepository.findByClientCompany_Branch_IdAndStatusOrderByCreatedAtDesc(branchId, status)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }
    }

    // 5. Approve Leave
    @Transactional
    public void approveLeave(Long leaveId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING) {
            throw new RuntimeException("Only PENDING leaves can be approved");
        }

        req.setReviewedBy(userRepository.getReferenceById(areaManagerId));
        req.setReviewedAt(LocalDateTime.now());
        
        // Snapshot and persist the amount of actual leave days used before reassignment removes the original officer's shifts
        int consumedDays = calculateLeaveDaysCount(req.getEmployee().getId(), req.getStartDate(), req.getEndDate());
        req.setConsumedLeaveDays(consumedDays);

        // Check if there are affected shifts
        List<AffectedShiftDTO> affected = getAffectedShiftsInternal(req);

        if (affected.isEmpty()) {
            req.setStatus(LeaveRequestStatus.APPROVED);
            req.setReplacementHandled(true);
        } else {
            req.setStatus(LeaveRequestStatus.PENDING_REASSIGNMENT);
            req.setReplacementHandled(false);
        }

        leaveRequestRepository.save(req);
    }

    // 6. Reject Leave
    @Transactional
    public void rejectLeave(Long leaveId, Long areaManagerId, String reason) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING && req.getStatus() != LeaveRequestStatus.PENDING_REASSIGNMENT) {
            throw new RuntimeException("Cannot reject this leave");
        }

        req.setReviewedBy(userRepository.getReferenceById(areaManagerId));
        req.setReviewedAt(LocalDateTime.now());
        req.setStatus(LeaveRequestStatus.REJECTED);
        req.setRejectionReason(reason);

        leaveRequestRepository.save(req);
    }

    // 7. Get Affected Shifts
    public List<AffectedShiftDTO> getAffectedShifts(Long leaveId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);
        return getAffectedShiftsInternal(req);
    }

    private List<AffectedShiftDTO> getAffectedShiftsInternal(LeaveRequest req) {
        // Find assigned shifts for this user between start and end dates efficiently via DB
        List<ShiftAssignment> assignments = assignmentRepository.findBySecurityOfficer_IdAndShift_DateBetween(
                req.getEmployee().getId(), req.getStartDate(), req.getEndDate()
        );

        return assignments.stream()
                .map(a -> AffectedShiftDTO.builder()
                        .shiftId(a.getShift().getId())
                        .date(a.getShift().getDate())
                        .shiftType(a.getShift().getShiftType())
                        .currentOfficerId(req.getEmployee().getId())
                        .currentOfficerName(req.getEmployee().getEmail())
                        .assignmentId(a.getId())
                        .build())
                .collect(Collectors.toList());
    }

    // 8. Get Eligible Replacements
    public List<EligibleReplacementDTO> getEligibleReplacements(Long leaveId, Long assignmentId, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);
        
        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getSecurityOfficer().getId().equals(req.getEmployee().getId())) {
            throw new RuntimeException("This shift is not assigned to the leave applicant");
        }

        Shift shift = assignment.getShift();
        Long companyId = req.getClientCompany().getId();

        // 1. Get all officers for this client
        List<User> officers = userRepository.findByRoleAndClientCompany_Id("SECURITY_OFFICER", companyId);

        List<EligibleReplacementDTO> eligible = new ArrayList<>();

        for (User officer : officers) {
            if (officer.getId().equals(req.getEmployee().getId())) continue;

            // Validate duplicate assignment
            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officer.getId())) {
                continue;
            }

            // Validate 60 shift limit
            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(officer.getId(), shift.getSchedule().getId());
            if (currentMonthShifts >= 60) {
                continue;
            }

            // Validate consecutive days
            try {
                shiftScheduleService.validateConsecutiveWorkingDays(officer.getId(), shift.getDate(), null);
            } catch (RuntimeException e) {
                continue;
            }

            // Validate no approved leave overlap for the replacement officer
            List<LeaveRequest> officerLeaves = leaveRequestRepository.findOverlappingLeaves(
                    officer.getId(), shift.getDate(), shift.getDate(),
                    List.of(LeaveRequestStatus.APPROVED, LeaveRequestStatus.PENDING_REASSIGNMENT)
            );
            if (!officerLeaves.isEmpty()) {
                continue;
            }

            eligible.add(EligibleReplacementDTO.builder()
                    .officerId(officer.getId())
                    .officerName(officer.getEmail())
                    .build());
        }

        return eligible;
    }



    // 9. Reassign Shift
    @Transactional
    public void reassignShift(Long leaveId, Long assignmentId, ReassignShiftRequestDTO dto, Long areaManagerId) {
        LeaveRequest req = validateLeaveAccess(leaveId, areaManagerId);

        if (req.getStatus() != LeaveRequestStatus.PENDING_REASSIGNMENT) {
            throw new RuntimeException("Leave is not pending reassignment");
        }

        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getSecurityOfficer().getId().equals(req.getEmployee().getId())) {
            throw new RuntimeException("This shift is not assigned to the leave applicant");
        }

        User replacement = userRepository.findById(dto.getReplacementOfficerId())
                .orElseThrow(() -> new RuntimeException("Replacement officer not found"));

        // Validation 
        Shift shift = assignment.getShift();
        if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), replacement.getId())) {
            throw new RuntimeException("Replacement officer is already assigned to this shift");
        }
        long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(replacement.getId(), shift.getSchedule().getId());
        if (currentMonthShifts >= 60) {
            throw new RuntimeException("Replacement officer reached 60 shifts limit");
        }
        try {
            shiftScheduleService.validateConsecutiveWorkingDays(replacement.getId(), shift.getDate(), null);
        } catch (RuntimeException e) {
            throw new RuntimeException("Replacement officer would violate 6 consecutive days rule");
        }

        // Controlled replacement
        assignment.setSecurityOfficer(replacement);
        assignmentRepository.save(assignment);

        // Notify replacement officer
        String msg = String.format("You have been assigned to shift on %s (%s) at %s to cover an approved leave.",
                shift.getDate(), shift.getShiftType(), req.getClientCompany().getName());
        notificationService.createNotification(replacement.getId(), msg);

        // Check if there are any remaining affected shifts
        List<AffectedShiftDTO> remaining = getAffectedShiftsInternal(req);
        if (remaining.isEmpty()) {
            req.setStatus(LeaveRequestStatus.APPROVED);
            req.setReplacementHandled(true);
            leaveRequestRepository.save(req);
        }
    }

    private LeaveRequest validateLeaveAccess(Long leaveId, Long areaManagerId) {
        LeaveRequest req = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        User am = userRepository.findById(areaManagerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        if (!"AREA_MANAGER".equals(am.getRole()) || am.getBranch() == null) {
            throw new RuntimeException("User is not an active Area Manager");
        }

        if (!req.getClientCompany().getBranch().getId().equals(am.getBranch().getId())) {
            throw new RuntimeException("Access denied: Leave is outside your branch");
        }

        return req;
    }

    private LeaveRequestDTO mapToDTO(LeaveRequest req) {
        return LeaveRequestDTO.builder()
                .id(req.getId())
                .employeeId(req.getEmployee().getId())
                .employeeName(req.getEmployee().getEmail())
                .clientCompanyId(req.getClientCompany().getId())
                .clientCompanyName(req.getClientCompany().getName())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .reason(req.getReason())
                .status(req.getStatus())
                .rejectionReason(req.getRejectionReason())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .reviewedById(req.getReviewedBy() != null ? req.getReviewedBy().getId() : null)
                .reviewedByName(req.getReviewedBy() != null ? req.getReviewedBy().getEmail() : null)
                .replacementHandled(req.isReplacementHandled())
                .build();
    }
}
