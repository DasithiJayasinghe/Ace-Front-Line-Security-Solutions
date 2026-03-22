package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

    List<LeaveRequest> findByEmployee_IdAndStatusIn(Long employeeId, List<LeaveRequestStatus> statuses);

    List<LeaveRequest> findByClientCompany_Branch_IdOrderByCreatedAtDesc(Long branchId);

    List<LeaveRequest> findByClientCompany_Branch_IdAndStatusOrderByCreatedAtDesc(Long branchId, LeaveRequestStatus status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId " +
           "AND lr.status IN :statuses " +
           "AND ((lr.startDate <= :endDate) AND (lr.endDate >= :startDate))")
    List<LeaveRequest> findOverlappingLeaves(@Param("employeeId") Long employeeId,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate,
                                             @Param("statuses") List<LeaveRequestStatus> statuses);
}
