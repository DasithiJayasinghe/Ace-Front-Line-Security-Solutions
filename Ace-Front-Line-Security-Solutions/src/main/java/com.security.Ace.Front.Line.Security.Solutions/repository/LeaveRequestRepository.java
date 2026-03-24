package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
/**
 * STAFF AUTHENTCATION
 */
@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByUser(User user);

    List<LeaveRequest> findByStatus(LeaveStatus status);

    List<LeaveRequest> findByUserAssignedArea(String area);

    List<LeaveRequest> findByUserAssignedAreaAndStatus(String area, LeaveStatus status);
}