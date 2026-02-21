package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Attendance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findBySecurityOfficerId(Long securityOfficerId);

    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);

    List<Attendance> findBySecurityOfficerIdAndAttendanceDateBetween(
            Long securityOfficerId, LocalDate startDate, LocalDate endDate);

    Optional<Attendance> findBySecurityOfficerAndAttendanceDate(
            SecurityOfficer securityOfficer, LocalDate attendanceDate);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate AND a.isShiftCounted = true")
    Integer countShiftsByOfficerInPeriod(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(a.overtimeHours) FROM Attendance a WHERE a.securityOfficer.id = :officerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate")
    Double sumOvertimeHoursByOfficerInPeriod(
            @Param("officerId") Long officerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM Attendance a WHERE a.securityOfficer.areaManager.id = :managerId " +
            "AND a.attendanceDate BETWEEN :startDate AND :endDate")
    List<Attendance> findByAreaManagerInPeriod(
            @Param("managerId") Long managerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
