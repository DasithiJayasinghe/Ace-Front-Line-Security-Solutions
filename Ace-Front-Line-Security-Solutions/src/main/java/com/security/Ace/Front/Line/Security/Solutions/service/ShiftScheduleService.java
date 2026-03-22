package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ShiftScheduleService {

    private final ShiftScheduleRepository scheduleRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftAssignmentRepository assignmentRepository;
    private final ClientCompanyRepository clientCompanyRepository;
    private final UserRepository userRepository;

    // 1. createSchedule
    @Transactional
    public ShiftScheduleDTO createSchedule(CreateScheduleRequest request, Long createdByUserId) {
        // prevent duplicate schedule
        Optional<ShiftSchedule> existing = scheduleRepository.findByClientCompany_IdAndMonthAndYear(
                request.getClientCompanyId(), request.getMonth(), request.getYear());
        if (existing.isPresent()) {
            throw new RuntimeException("Schedule already exists for this client, month, and year.");
        }

        ClientCompany client = clientCompanyRepository.findById(request.getClientCompanyId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        User creator = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ShiftSchedule schedule = ShiftSchedule.builder()
                .clientCompany(client)
                .month(request.getMonth())
                .year(request.getYear())
                .status(ScheduleStatus.DRAFT)
                .createdBy(creator)
                .build();

        schedule = scheduleRepository.save(schedule);
        return mapToDTO(schedule);
    }

    // 2. getScheduleById
    public ShiftScheduleDTO getScheduleById(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        return mapToDTO(schedule);
    }

    // 3. assignOfficersToShift
    @Transactional
    public void assignOfficersToShift(Long scheduleId, AssignOfficerRequest request) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Cannot edit assignments. Schedule is not in DRAFT status.");
        }

        // find or create the Shift
        Shift shift = shiftRepository
                .findBySchedule_IdAndDateAndShiftType(scheduleId, request.getDate(), request.getShiftType())
                .orElseGet(() -> shiftRepository.save(Shift.builder()
                        .schedule(schedule)
                        .date(request.getDate())
                        .shiftType(request.getShiftType())
                        .build()));

        Set<Long> uniqueOfficerIds = new HashSet<>(request.getSecurityOfficerIds());

        for (Long officerId : uniqueOfficerIds) {
            User officer = userRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Officer not found: " + officerId));

            // Prevent duplicate assignment
            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officerId)) {
                throw new RuntimeException("Officer " + officerId + " is already assigned to this shift.");
            }

            // validate max 60 shifts
            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(officerId, scheduleId);
            if (currentMonthShifts >= 60) {
                throw new RuntimeException(
                        "Officer " + officerId + " has exceeded the maximum of 60 shifts for the month.");
            }

            // validate 7-day rule
            validateConsecutiveWorkingDays(officerId, request.getDate(), null);

            ShiftAssignment assignment = ShiftAssignment.builder()
                    .shift(shift)
                    .securityOfficer(officer)
                    .build();
            assignmentRepository.save(assignment);
        }
    }

    // 4. removeAssignment
    @Transactional
    public void removeAssignment(Long assignmentId) {
        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getShift().getSchedule().getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Cannot remove assignment. Schedule is not in DRAFT status.");
        }

        assignmentRepository.delete(assignment);
        assignmentRepository.flush();
    }

    // 5. submitSchedule
    @Transactional
    public void submitSchedule(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT schedules can be submitted");
        }
        schedule.setStatus(ScheduleStatus.SUBMITTED);
        schedule.setSubmittedDate(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    // 6. approveSchedule
    @Transactional
    public void approveSchedule(Long scheduleId, Long areaManagerUserId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        User areaManager = userRepository.findById(areaManagerUserId)
                .orElseThrow(() -> new RuntimeException("Area manager not found"));
        if (schedule.getStatus() != ScheduleStatus.SUBMITTED) {
            throw new RuntimeException("Only SUBMITTED schedules can be approved");
        }
        if (areaManager.getBranch() == null) {
            throw new RuntimeException("Area manager is not assigned to any branch");
        }
        if (schedule.getClientCompany() == null || schedule.getClientCompany().getBranch() == null) {
            throw new RuntimeException("Client company branch is not assigned");
        }
        if (!"AREA_MANAGER".equals(areaManager.getRole())) {
            throw new RuntimeException("Only AREA_MANAGER can approve schedules");
        }
        if (!areaManager.getBranch().getId().equals(schedule.getClientCompany().getBranch().getId())) {
            throw new RuntimeException("You can approve only schedules from your own branch");
        }

        schedule.setStatus(ScheduleStatus.APPROVED);
        schedule.setApprovedDate(LocalDateTime.now());
        scheduleRepository.save(schedule);
    }

    // 7. autoGenerateSchedule
    @Transactional
    public void autoGenerateSchedule(Long scheduleId) {
        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (schedule.getStatus() != ScheduleStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT schedules can be auto-generated");
        }

        // if regenerating, clear existing draft assignments safely first
        List<ShiftAssignment> existingAssignments = assignmentRepository.findByShift_Schedule_Id(scheduleId);
        assignmentRepository.deleteAll(existingAssignments);
        assignmentRepository.flush();

        // Get available officers specifically for this client if possible
        List<User> availableOfficers = getAvailableOfficersForClient(schedule.getClientCompany().getId());
        if (availableOfficers.isEmpty()) {
            throw new RuntimeException("No available security officers found");
        }

        LocalDate startDate = LocalDate.of(schedule.getYear(), schedule.getMonth(), 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        int officerIndex = 0;
        int maxShiftsPerDay = 2; // TODO: make this configurable (currently fixed to 2 officers per shift)

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            final LocalDate currentDate = date;

            for (ShiftType type : ShiftType.values()) {
                Shift shift = shiftRepository.findBySchedule_IdAndDateAndShiftType(scheduleId, currentDate, type)
                        .orElseGet(() -> shiftRepository.save(Shift.builder()
                                .schedule(schedule)
                                .date(currentDate)
                                .shiftType(type)
                                .build()));

                int assignmentsAdded = 0;
                int attempts = 0;

                while (assignmentsAdded < maxShiftsPerDay && attempts < availableOfficers.size()) {
                    User officer = availableOfficers.get(officerIndex);
                    officerIndex = (officerIndex + 1) % availableOfficers.size();
                    attempts++;

                    try {
                        long currentMonthShifts = assignmentRepository
                                .countBySecurityOfficerIdAndScheduleId(officer.getId(), scheduleId);
                        if (currentMonthShifts >= 60)
                            continue;

                        validateConsecutiveWorkingDays(officer.getId(), currentDate, null);

                        if (!assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(),
                                officer.getId())) {
                            ShiftAssignment assignment = ShiftAssignment.builder()
                                    .shift(shift)
                                    .securityOfficer(officer)
                                    .build();
                            assignmentRepository.save(assignment);
                            assignmentRepository.flush();
                            assignmentRepository.flush();
                            assignmentsAdded++;
                        }
                    } catch (RuntimeException e) {
                        // ignore validation exception and try next available officer
                    }
                }
            }
        }
    }

    // private helper methods

    /**
     * Isolates logic to fetch relevant security officers.
     * Currently fetches all SECURITY_OFFICER roles.
     * Can be updated to filter by clientCompanyId when the data model supports it.
     */
    private List<User> getAvailableOfficersForClient(Long clientCompanyId) {
        return userRepository.findByRoleAndClientCompany_Id("SECURITY_OFFICER", clientCompanyId);
    }

    public void validateConsecutiveWorkingDays(Long officerId, LocalDate newDate, Long excludeAssignmentId) {
        LocalDate startDate = newDate.minusDays(6);
        LocalDate endDate = newDate.plusDays(6);
        
        List<ShiftAssignment> assignments = assignmentRepository.findBySecurityOfficer_IdAndShift_DateBetween(officerId, startDate, endDate);

        Set<LocalDate> workingDates = new HashSet<>();
        for (ShiftAssignment sa : assignments) {
            if (excludeAssignmentId != null && sa.getId().equals(excludeAssignmentId)) {
                continue; // exclude the assignment being removed/replaced
            }
            workingDates.add(sa.getShift().getDate());
        }
        
        workingDates.add(newDate);

        List<LocalDate> sortedDates = new ArrayList<>(workingDates);
        Collections.sort(sortedDates);

        int maxStreak = 1;
        int currentStreak = 1;
        for (int i = 1; i < sortedDates.size(); i++) {
            if (sortedDates.get(i).equals(sortedDates.get(i - 1).plusDays(1))) {
                currentStreak++;
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else {
                currentStreak = 1;
            }
        }
        
        if (maxStreak > 6) {
            throw new RuntimeException("Officer cannot work more than 6 consecutive days. 7th day must be OFF.");
        }
    }

    public List<ShiftScheduleDTO> getSubmittedSchedules(Long areaManagerUserId) {
        User areaManager = userRepository.findById(areaManagerUserId)
                .orElseThrow(() -> new RuntimeException("Area manager not found"));

        if (!"AREA_MANAGER".equals(areaManager.getRole())) {
            throw new RuntimeException("Only AREA_MANAGER can view submitted schedules");
        }

        if (areaManager.getBranch() == null) {
            throw new RuntimeException("Area manager is not assigned to any branch");
        }

        return scheduleRepository
                .findByStatusAndClientCompany_Branch_Id(
                        ScheduleStatus.SUBMITTED,
                        areaManager.getBranch().getId()
                )
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private ShiftScheduleDTO mapToDTO(ShiftSchedule schedule) {

        List<ShiftDTO> shiftDTOs = shiftRepository.findBySchedule_Id(schedule.getId())
                .stream()
                .map(this::mapShiftToDTO)
                .toList();

        return ShiftScheduleDTO.builder()
                .id(schedule.getId())
                .clientCompanyId(schedule.getClientCompany().getId())
                .clientCompanyName(schedule.getClientCompany().getName())
                .month(schedule.getMonth())
                .year(schedule.getYear())
                .status(schedule.getStatus())
                .submittedDate(schedule.getSubmittedDate())
                .approvedDate(schedule.getApprovedDate())
                .createdByUserName(schedule.getCreatedBy().getEmail())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .editedByAreaManager(schedule.isEditedByAreaManager())
                .areaManagerEditedAt(schedule.getAreaManagerEditedAt())
                .shifts(shiftDTOs)
                .build();
    }

    private ShiftDTO mapShiftToDTO(Shift shift) {
        List<ShiftAssignmentDTO> assignments = shift.getAssignments() == null
                ? List.of()
                : shift.getAssignments().stream()
                .map(this::mapAssignmentToDTO)
                .toList();

        return ShiftDTO.builder()
                .id(shift.getId())
                .scheduleId(shift.getSchedule().getId())
                .date(shift.getDate())
                .shiftType(shift.getShiftType())
                .assignments(assignments)
                .build();
    }

    private ShiftAssignmentDTO mapAssignmentToDTO(ShiftAssignment assignment) {
        return ShiftAssignmentDTO.builder()
                .id(assignment.getId())
                .shiftId(assignment.getShift().getId())
                .securityOfficerId(assignment.getSecurityOfficer().getId())
                .securityOfficerName(assignment.getSecurityOfficer().getEmail())
                .build();
    }

    public ShiftScheduleDTO getScheduleByCompanyAndMonthAndYear(Long clientCompanyId, Integer month, Integer year) {
        ShiftSchedule schedule = scheduleRepository
                .findByClientCompany_IdAndMonthAndYear(clientCompanyId, month, year)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        return mapToDTO(schedule);
    }

    private User validateAreaManager(Long areaManagerUserId) {
        User areaManager = userRepository.findById(areaManagerUserId)
                .orElseThrow(() -> new RuntimeException("Area manager not found"));

        if (!"AREA_MANAGER".equals(areaManager.getRole())) {
            throw new RuntimeException("Only AREA_MANAGER can perform this action");
        }

        if (areaManager.getBranch() == null) {
            throw new RuntimeException("Area manager is not assigned to any branch");
        }

        return areaManager;
    }

    private ShiftSchedule validateAreaManagerScheduleAccess(Long scheduleId, Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);

        ShiftSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (schedule.getClientCompany() == null || schedule.getClientCompany().getBranch() == null) {
            throw new RuntimeException("Client company branch is not assigned");
        }

        if (!areaManager.getBranch().getId().equals(schedule.getClientCompany().getBranch().getId())) {
            throw new RuntimeException("You can access only schedules from your own branch");
        }

        return schedule;
    }

    @Transactional
    public void assignOfficersToShiftAsAreaManager(Long scheduleId, AssignOfficerRequest request, Long areaManagerUserId) {
        ShiftSchedule schedule = validateAreaManagerScheduleAccess(scheduleId, areaManagerUserId);

        // Area manager can edit SUBMITTED and APPROVED schedules
        if (schedule.getStatus() != ScheduleStatus.SUBMITTED && schedule.getStatus() != ScheduleStatus.APPROVED) {
            throw new RuntimeException("Area manager can edit only SUBMITTED or APPROVED schedules");
        }

        Shift shift = shiftRepository
                .findBySchedule_IdAndDateAndShiftType(scheduleId, request.getDate(), request.getShiftType())
                .orElseGet(() -> shiftRepository.save(Shift.builder()
                        .schedule(schedule)
                        .date(request.getDate())
                        .shiftType(request.getShiftType())
                        .build()));

        Set<Long> uniqueOfficerIds = new HashSet<>(request.getSecurityOfficerIds());

        for (Long officerId : uniqueOfficerIds) {
            User officer = userRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Officer not found: " + officerId));

            if (assignmentRepository.existsByShift_IdAndSecurityOfficer_Id(shift.getId(), officerId)) {
                throw new RuntimeException("Officer " + officerId + " is already assigned to this shift.");
            }

            long currentMonthShifts = assignmentRepository.countBySecurityOfficerIdAndScheduleId(officerId, scheduleId);
            if (currentMonthShifts >= 60) {
                throw new RuntimeException("Officer " + officerId + " has exceeded the maximum of 60 shifts for the month.");
            }

            validateConsecutiveWorkingDays(officerId, request.getDate(), null);

            ShiftAssignment assignment = ShiftAssignment.builder()
                    .shift(shift)
                    .securityOfficer(officer)
                    .build();

            assignmentRepository.save(assignment);
        }

        schedule.setEditedByAreaManager(true);
        schedule.setAreaManagerEditedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);

    }

    @Transactional
    public void removeAssignmentAsAreaManager(Long assignmentId, Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);

        ShiftAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        ShiftSchedule schedule = assignment.getShift().getSchedule();

        if (!areaManager.getBranch().getId().equals(schedule.getClientCompany().getBranch().getId())) {
            throw new RuntimeException("You can access only schedules from your own branch");
        }

        if (schedule.getStatus() != ScheduleStatus.SUBMITTED && schedule.getStatus() != ScheduleStatus.APPROVED) {
            throw new RuntimeException("Area manager can edit only SUBMITTED or APPROVED schedules");
        }

        assignmentRepository.delete(assignment);

        schedule.setEditedByAreaManager(true);
        schedule.setAreaManagerEditedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);

    }

    public List<ShiftScheduleDTO> getAreaManagerSchedulesForMonth(Long areaManagerUserId, Integer month, Integer year) {
        User areaManager = validateAreaManager(areaManagerUserId);

        return scheduleRepository
                .findByClientCompany_Branch_IdAndMonthAndYearAndStatusIn(
                        areaManager.getBranch().getId(),
                        month,
                        year,
                        List.of(ScheduleStatus.SUBMITTED, ScheduleStatus.APPROVED)
                )
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getAreaManagerApprovedHistory(Long areaManagerUserId) {
        User areaManager = validateAreaManager(areaManagerUserId);

        return scheduleRepository
                .findByClientCompany_Branch_IdAndStatusOrderByApprovedDateDesc(
                        areaManager.getBranch().getId(),
                        ScheduleStatus.APPROVED
                )
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getApprovedSchedules() {
        return scheduleRepository.findByStatus(ScheduleStatus.APPROVED)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getClientCurrentSchedules(Long companyId) {
        return scheduleRepository.findByStatusAndClientCompany_Id(ScheduleStatus.APPROVED, companyId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getFilteredSchedules(String branch, String company, String month) {
        List<ShiftSchedule> schedules = scheduleRepository.findAll();

        return schedules.stream()
                .filter(schedule -> schedule.getStatus() == ScheduleStatus.APPROVED)
                .filter(schedule -> branch == null || branch.isBlank()
                        || (schedule.getClientCompany().getBranch() != null
                        && String.valueOf(schedule.getClientCompany().getBranch().getId()).equals(branch)))
                .filter(schedule -> company == null || company.isBlank()
                        || String.valueOf(schedule.getClientCompany().getId()).equals(company))
                .filter(schedule -> month == null || month.isBlank()
                        || String.valueOf(schedule.getMonth()).equals(month))
                .map(this::mapToDTO)
                .toList();
    }

    public List<ShiftScheduleDTO> getApprovedSchedulesForOfficer(Long officerId) {
        return scheduleRepository.findByStatus(ScheduleStatus.APPROVED)
                .stream()
                .filter(schedule -> assignmentRepository.findByShift_Schedule_Id(schedule.getId())
                        .stream()
                        .anyMatch(a -> a.getSecurityOfficer().getId().equals(officerId)))
                .map(this::mapToDTO)
                .toList();
    }

}
