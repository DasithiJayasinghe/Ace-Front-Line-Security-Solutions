package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.LeaveRequestDto;
import com.security.Ace.Front.Line.Security.Solutions.dto.ReviewRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.LeaveRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.LeaveStatus;
import com.security.Ace.Front.Line.Security.Solutions.exception.BusinessException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.LeaveRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveService – Unit Tests")
class LeaveServiceTest extends BaseServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private UserRepository         userRepository;

    @InjectMocks
    private LeaveService leaveService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private LeaveRequest pendingLeave(User officer) {
        return LeaveRequest.builder()
                .id(100L)
                .user(officer)
                .startDate(LocalDate.now().plusDays(3))
                .endDate(LocalDate.now().plusDays(5))
                .reason("Medical appointment")
                .status(LeaveStatus.PENDING)
                .build();
    }

    private LeaveRequest leaveWithStatus(User officer, LeaveStatus status) {
        LeaveRequest l = pendingLeave(officer);
        l.setStatus(status);
        return l;
    }

    private ReviewRequest approve() {
        ReviewRequest r = new ReviewRequest();
        r.setApproved(true);
        return r;
    }

    private ReviewRequest reject(String reason) {
        ReviewRequest r = new ReviewRequest();
        r.setApproved(false);
        r.setRejectionReason(reason);
        return r;
    }

    // =========================================================================
    // applyLeave()
    // =========================================================================
    @Nested
    @DisplayName("applyLeave()")
    class ApplyLeaveTests {

        @Test
        @DisplayName("creates leave request with PENDING status for valid date range")
        void applyLeave_validDates_returnsPendingRequest() {
            User officer = aSecurityOfficer();
            LeaveRequestDto dto = new LeaveRequestDto();
            dto.setStartDate(LocalDate.now().plusDays(3));
            dto.setEndDate(LocalDate.now().plusDays(5));
            dto.setReason("Medical appointment");

            LeaveRequest saved = pendingLeave(officer);
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(saved);

            LeaveRequest result = leaveService.applyLeave("officer_01", dto);

            assertThat(result.getStatus()).isEqualTo(LeaveStatus.PENDING);
            assertThat(result.getUser()).isEqualTo(officer);
            verify(leaveRequestRepository).save(any(LeaveRequest.class));
        }

        @Test
        @DisplayName("creates leave request when start and end date are the same day")
        void applyLeave_sameDayLeave_createsRequest() {
            User officer = aSecurityOfficer();
            LocalDate today = LocalDate.now().plusDays(1);
            LeaveRequestDto dto = new LeaveRequestDto();
            dto.setStartDate(today);
            dto.setEndDate(today);
            dto.setReason("Personal errand");

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(pendingLeave(officer));

            LeaveRequest result = leaveService.applyLeave("officer_01", dto);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("throws BusinessException when end date is before start date")
        void applyLeave_endBeforeStart_throwsBusinessException() {
            User officer = aSecurityOfficer();
            LeaveRequestDto dto = new LeaveRequestDto();
            dto.setStartDate(LocalDate.now().plusDays(10));
            dto.setEndDate(LocalDate.now().plusDays(3));   // before start
            dto.setReason("Invalid");

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));

            assertThatThrownBy(() -> leaveService.applyLeave("officer_01", dto))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("End date must be after start date");

            verify(leaveRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when username not found")
        void applyLeave_unknownUser_throwsResourceNotFoundException() {
            LeaveRequestDto dto = new LeaveRequestDto();
            dto.setStartDate(LocalDate.now().plusDays(1));
            dto.setEndDate(LocalDate.now().plusDays(2));
            dto.setReason("Test");

            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> leaveService.applyLeave("ghost", dto))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    // =========================================================================
    // getMyLeaves() / getAllLeaves() / getLeavesByArea() / getPendingLeaves()
    // =========================================================================
    @Nested
    @DisplayName("Query methods")
    class QueryTests {

        @Test
        @DisplayName("getMyLeaves returns all leave requests belonging to the caller")
        void getMyLeaves_returnsCallerLeaves() {
            User officer = aSecurityOfficer();
            List<LeaveRequest> leaves = List.of(
                    leaveWithStatus(officer, LeaveStatus.PENDING),
                    leaveWithStatus(officer, LeaveStatus.APPROVED));

            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));
            when(leaveRequestRepository.findByUser(officer)).thenReturn(leaves);

            List<LeaveRequest> result = leaveService.getMyLeaves("officer_01");

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("getAllLeaves returns every leave in the system")
        void getAllLeaves_returnsAll() {
            when(leaveRequestRepository.findAll()).thenReturn(List.of(
                    leaveWithStatus(aSecurityOfficer(), LeaveStatus.PENDING),
                    leaveWithStatus(aSecurityOfficer(), LeaveStatus.APPROVED),
                    leaveWithStatus(aSecurityOfficer(), LeaveStatus.REJECTED)));

            assertThat(leaveService.getAllLeaves()).hasSize(3);
        }

        @Test
        @DisplayName("getLeavesByArea returns only leaves for the specified area")
        void getLeavesByArea_returnsAreaLeaves() {
            when(leaveRequestRepository.findByUserAssignedArea("Colombo-North"))
                    .thenReturn(List.of(leaveWithStatus(aSecurityOfficer(), LeaveStatus.PENDING)));

            assertThat(leaveService.getLeavesByArea("Colombo-North")).hasSize(1);
        }

        @Test
        @DisplayName("getPendingLeaves returns only PENDING leaves")
        void getPendingLeaves_returnsPendingOnly() {
            when(leaveRequestRepository.findByStatus(LeaveStatus.PENDING))
                    .thenReturn(List.of(leaveWithStatus(aSecurityOfficer(), LeaveStatus.PENDING)));

            List<LeaveRequest> result = leaveService.getPendingLeaves();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo(LeaveStatus.PENDING);
        }
    }

    // =========================================================================
    // areaManagerReview()
    // =========================================================================
    @Nested
    @DisplayName("areaManagerReview()")
    class AreaManagerReviewTests {

        @Test
        @DisplayName("approval sets status to APPROVED_BY_AREA_MANAGER and records reviewer")
        void areaManagerReview_approve_setsApprovedByAreaManager() {
            User officer = aSecurityOfficer();
            User manager = anAreaManager();
            LeaveRequest leave = pendingLeave(officer);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leave);

            LeaveRequest result = leaveService.areaManagerReview(100L, "area_mgr_01", approve());

            assertThat(result.getStatus()).isEqualTo(LeaveStatus.APPROVED_BY_AREA_MANAGER);
            assertThat(result.getReviewedBy()).isEqualTo(manager);
        }

        @Test
        @DisplayName("rejection sets REJECTED status and persists rejection reason")
        void areaManagerReview_reject_setsRejectedWithReason() {
            User officer = aSecurityOfficer();
            User manager = anAreaManager();
            LeaveRequest leave = pendingLeave(officer);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leave);

            LeaveRequest result = leaveService.areaManagerReview(
                    100L, "area_mgr_01", reject("Understaffed this week"));

            assertThat(result.getStatus()).isEqualTo(LeaveStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Understaffed this week");
        }

        @Test
        @DisplayName("throws BusinessException when reviewer does not have AREA_MANAGER role")
        void areaManagerReview_nonAreaManager_throwsBusinessException() {
            when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(aSecurityOfficer()));

            assertThatThrownBy(() -> leaveService.areaManagerReview(100L, "officer_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Only area managers");
        }

        @Test
        @DisplayName("throws BusinessException when leave status is not PENDING")
        void areaManagerReview_leaveNotPending_throwsBusinessException() {
            User officer = aSecurityOfficer();
            User manager = anAreaManager();
            LeaveRequest leave = leaveWithStatus(officer, LeaveStatus.APPROVED_BY_AREA_MANAGER);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));

            assertThatThrownBy(() -> leaveService.areaManagerReview(100L, "area_mgr_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("not in PENDING status");
        }

        @Test
        @DisplayName("throws BusinessException when leave officer is outside manager's area")
        void areaManagerReview_differentArea_throwsBusinessException() {
            User officer = aSecurityOfficer();
            officer.setAssignedArea("Gampaha");              // different area
            User manager = anAreaManager();                  // manages Colombo-North
            LeaveRequest leave = pendingLeave(officer);

            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));

            assertThatThrownBy(() -> leaveService.areaManagerReview(100L, "area_mgr_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("your assigned area");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when leave request ID does not exist")
        void areaManagerReview_unknownLeaveId_throwsResourceNotFoundException() {
            when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(anAreaManager()));
            when(leaveRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> leaveService.areaManagerReview(999L, "area_mgr_01", approve()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Leave request not found");
        }
    }

    // =========================================================================
    // finalReview()
    // =========================================================================
    @Nested
    @DisplayName("finalReview()")
    class FinalReviewTests {

        @Test
        @DisplayName("director final-approval sets status to APPROVED")
        void finalReview_approve_setsApproved() {
            User officer = aSecurityOfficer();
            User director = aDirector();
            LeaveRequest leave = leaveWithStatus(officer, LeaveStatus.APPROVED_BY_AREA_MANAGER);

            when(userRepository.findByUsername("director_01")).thenReturn(Optional.of(director));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leave);

            LeaveRequest result = leaveService.finalReview(100L, "director_01", approve());

            assertThat(result.getStatus()).isEqualTo(LeaveStatus.APPROVED);
        }

        @Test
        @DisplayName("chairman final-rejection sets REJECTED with reason")
        void finalReview_reject_setsRejectedWithReason() {
            User officer = aSecurityOfficer();
            User chairman = aChairman();
            LeaveRequest leave = leaveWithStatus(officer, LeaveStatus.APPROVED_BY_AREA_MANAGER);

            when(userRepository.findByUsername("chairman_01")).thenReturn(Optional.of(chairman));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));
            when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leave);

            LeaveRequest result = leaveService.finalReview(
                    100L, "chairman_01", reject("Company-wide freeze"));

            assertThat(result.getStatus()).isEqualTo(LeaveStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Company-wide freeze");
        }

        @Test
        @DisplayName("throws BusinessException when leave is still PENDING (area review skipped)")
        void finalReview_pendingLeave_throwsBusinessException() {
            User officer = aSecurityOfficer();
            LeaveRequest leave = pendingLeave(officer);

            when(userRepository.findByUsername("director_01")).thenReturn(Optional.of(aDirector()));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));

            assertThatThrownBy(() -> leaveService.finalReview(100L, "director_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("area manager first");
        }

        @Test
        @DisplayName("throws BusinessException when leave is already fully APPROVED")
        void finalReview_alreadyApproved_throwsBusinessException() {
            User officer = aSecurityOfficer();
            LeaveRequest leave = leaveWithStatus(officer, LeaveStatus.APPROVED);

            when(userRepository.findByUsername("director_01")).thenReturn(Optional.of(aDirector()));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));

            assertThatThrownBy(() -> leaveService.finalReview(100L, "director_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already finalized");
        }

        @Test
        @DisplayName("throws BusinessException when leave is already REJECTED")
        void finalReview_alreadyRejected_throwsBusinessException() {
            User officer = aSecurityOfficer();
            LeaveRequest leave = leaveWithStatus(officer, LeaveStatus.REJECTED);

            when(userRepository.findByUsername("director_01")).thenReturn(Optional.of(aDirector()));
            when(leaveRequestRepository.findById(100L)).thenReturn(Optional.of(leave));

            assertThatThrownBy(() -> leaveService.finalReview(100L, "director_01", approve()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already finalized");
        }
    }
}