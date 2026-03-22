package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftSchedule;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftScheduleRepository extends JpaRepository<ShiftSchedule, Long> {

    Optional<ShiftSchedule> findByClientCompany_IdAndMonthAndYear(Long clientCompanyId, Integer month, Integer year);

    List<ShiftSchedule> findByStatus(ScheduleStatus status);

    List<ShiftSchedule> findByStatusAndClientCompany_Id(ScheduleStatus status, Long clientCompanyId);

    List<ShiftSchedule> findByStatusAndClientCompany_Branch_Id(ScheduleStatus status, Long branchId);

    List<ShiftSchedule> findByClientCompany_Branch_IdAndMonthAndYearAndStatusIn(
            Long branchId,
            Integer month,
            Integer year,
            List<ScheduleStatus> statuses
    );

    List<ShiftSchedule> findByClientCompany_Branch_IdAndStatusOrderByApprovedDateDesc(
            Long branchId,
            ScheduleStatus status
    );
}