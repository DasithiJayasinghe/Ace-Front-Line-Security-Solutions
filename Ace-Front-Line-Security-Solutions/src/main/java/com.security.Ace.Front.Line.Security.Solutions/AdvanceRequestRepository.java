package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
/**
 * ADMIN FINANCE
 */

@Repository
public interface AdvanceRequestRepository extends JpaRepository<AdvanceRequest, Long> {

    List<AdvanceRequest> findByUser(User user);

    List<AdvanceRequest> findByStatus(RequestStatus status);

    List<AdvanceRequest> findByUserAssignedArea(String area);

    List<AdvanceRequest> findByUserAssignedAreaAndStatus(String area, RequestStatus status);

    boolean existsByUserAndForMonthAndStatusNot(User user, String forMonth, RequestStatus status);

    List<AdvanceRequest> findByUserAndForMonthAndStatus(User user, String forMonth, RequestStatus status);
}