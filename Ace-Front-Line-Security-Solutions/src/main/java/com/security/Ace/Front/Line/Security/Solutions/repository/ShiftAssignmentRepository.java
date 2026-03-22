package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {
    
    @Query("SELECT COUNT(sa) FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.id = :scheduleId")
    long countBySecurityOfficerIdAndScheduleId(@Param("officerId") Long officerId, @Param("scheduleId") Long scheduleId);

    @Query("SELECT sa.shift.date FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.month = :month AND sa.shift.schedule.year = :year ORDER BY sa.shift.date ASC")
    List<LocalDate> findWorkingDatesByOfficerAndMonthAndYear(@Param("officerId") Long officerId, @Param("month") Integer month, @Param("year") Integer year);
    
    List<ShiftAssignment> findByShift_Schedule_Id(Long scheduleId);
    
    @Query("SELECT sa FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.schedule.status = 'APPROVED'")
    List<ShiftAssignment> findApprovedAssignmentsByOfficerId(@Param("officerId") Long officerId);

    // Get assignments by date directly for 7-day rule check
    @Query("SELECT sa.shift.date FROM ShiftAssignment sa WHERE sa.securityOfficer.id = :officerId AND sa.shift.date BETWEEN :startDate AND :endDate ORDER BY sa.shift.date ASC")
    List<LocalDate> findWorkingDatesByOfficerAndDateRange(@Param("officerId") Long officerId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    boolean existsByShift_IdAndSecurityOfficer_Id(Long shiftId, Long officerId);

    List<ShiftAssignment> findBySecurityOfficer_IdAndShift_DateBetween(Long officerId, LocalDate startDate, LocalDate endDate);
}
