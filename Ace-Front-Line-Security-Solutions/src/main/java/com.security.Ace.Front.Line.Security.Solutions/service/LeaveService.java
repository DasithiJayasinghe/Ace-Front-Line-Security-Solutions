package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LeaveRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.LeaveStatus;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.LeaveRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
/**
 * STAFF AUTHENTICATION
 */
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public LeaveRequest applyLeave(String username, LeaveRequestDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new BusinessException("End date must be after start date");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .user(user)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        return leaveRequestRepository.save(leaveRequest);
    }

    public List<LeaveRequest> getMyLeaves(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return leaveRequestRepository.findByUser(user);
    }

    public List<LeaveRequest> getAllLeaves() {
        return leaveRequestRepository.findAll();
    }

    public List<LeaveRequest> getLeavesByArea(String area) {
        return leaveRequestRepository.findByUserAssignedArea(area);
    }

    public List<LeaveRequest> getPendingLeaves() {
        return leaveRequestRepository.findByStatus(LeaveStatus.PENDING);
    }

    // Area manager reviews (first level)
    @Transactional
    public LeaveRequest areaManagerReview(Long leaveId, String managerUsername, ReviewRequest reviewRequest) {
        User manager = userRepository.findByUsername(managerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        if (manager.getRole() != Role.AREA_MANAGER) {
            throw new BusinessException("Only area managers can do first-level review");
        }

        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException("Leave request is not in PENDING status");
        }

        if (!leave.getUser().getAssignedArea().equals(manager.getAssignedArea())) {
            throw new BusinessException("You can only review leaves for your assigned area");
        }

        if (reviewRequest.isApproved()) {
            leave.setStatus(LeaveStatus.APPROVED_BY_AREA_MANAGER);
        } else {
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setRejectionReason(reviewRequest.getRejectionReason());
        }

        leave.setReviewedBy(manager);
        leave.setReviewedAt(LocalDateTime.now());
        return leaveRequestRepository.save(leave);
    }

    // Final approval (admin/director/chairman)
    @Transactional
    public LeaveRequest finalReview(Long leaveId, String adminUsername, ReviewRequest reviewRequest) {
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getStatus() == LeaveStatus.PENDING) {
            throw new BusinessException("Leave must be reviewed by area manager first");
        }
        if (leave.getStatus() == LeaveStatus.REJECTED || leave.getStatus() == LeaveStatus.APPROVED) {
            throw new BusinessException("Leave is already finalized");
        }

        if (reviewRequest.isApproved()) {
            leave.setStatus(LeaveStatus.APPROVED);
        } else {
            leave.setStatus(LeaveStatus.REJECTED);
            leave.setRejectionReason(reviewRequest.getRejectionReason());
        }

        leave.setReviewedBy(admin);
        leave.setReviewedAt(LocalDateTime.now());
        return leaveRequestRepository.save(leave);
    }
}