package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.BulkInterviewScheduleDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.InterviewDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Announcement;
import com.security.Ace.Front.Line.Security.Solutions.entity.Interview;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobApplication;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.repository.AnnouncementRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InterviewRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobApplicationRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private JobApplicationRepository applicationRepository;

    @Autowired
    private EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Get all interviews with their applicants
     */
    public List<InterviewDTO> getAllInterviews() {
        List<Interview> interviews = interviewRepository.findAllByOrderByInterviewDateDescInterviewTimeDesc();
        return interviews.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Get interviews by vacancy
     */
    public List<InterviewDTO> getInterviewsByVacancy(Long vacancyId) {
        List<Interview> interviews = interviewRepository.findByVacancyId(vacancyId);
        return interviews.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private InterviewDTO convertToDTO(Interview interview) {
        InterviewDTO dto = new InterviewDTO();
        dto.setId(interview.getId());
        dto.setVacancyId(interview.getVacancyId());
        dto.setInterviewDate(interview.getInterviewDate().format(DATE_FMT));
        dto.setInterviewTime(interview.getInterviewTime().format(TIME_FMT));
        dto.setInterviewLocation(interview.getInterviewLocation());
        if (interview.getCreatedAt() != null) {
            dto.setCreatedAt(interview.getCreatedAt().format(DATETIME_FMT));
        }

        // Resolve vacancy title
        if (interview.getJobVacancy() != null) {
            dto.setVacancyTitle(interview.getJobVacancy().getJobTitle());
        } else {
            vacancyRepository.findById(interview.getVacancyId())
                    .ifPresent(v -> dto.setVacancyTitle(v.getJobTitle()));
        }

        // Map applications to applicant DTOs
        List<InterviewDTO.InterviewApplicantDTO> applicants = interview.getApplications()
                .stream()
                .map(app -> {
                    InterviewDTO.InterviewApplicantDTO a = new InterviewDTO.InterviewApplicantDTO();
                    a.setApplicationId(app.getId());
                    a.setFullName(app.getFullName());
                    a.setEmail(app.getEmail());
                    a.setPhoneNumber(app.getPhoneNumber());
                    a.setApplicationStatus(app.getApplicationStatus().toString());
                    return a;
                })
                .collect(Collectors.toList());
        dto.setApplicants(applicants);

        // Look up interviewer roles from announcements matching this interview
        List<Announcement> matchingAnnouncements = announcementRepository
                .findByInterviewDateAndInterviewTimeAndInterviewLocation(
                        interview.getInterviewDate(), interview.getInterviewTime(), interview.getInterviewLocation());
        List<String> interviewerRoles = matchingAnnouncements.stream()
                .map(Announcement::getTargetRole)
                .distinct()
                .collect(Collectors.toList());
        dto.setInterviewerRoles(interviewerRoles);

        return dto;
    }

    /**
     * Schedule interviews in bulk — supports applicants from multiple vacancies.
     * Groups applications by vacancy, creates/finds an interview per vacancy,
     * sends invitation emails and returns created interview DTOs.
     */
    public List<InterviewDTO> scheduleBulk(BulkInterviewScheduleDTO dto) {
        LocalDate date = LocalDate.parse(dto.getInterviewDate());
        LocalTime time = LocalTime.parse(dto.getInterviewTime());
        LocalDateTime dateTime = LocalDateTime.of(date, time);
        String location = dto.getInterviewLocation();

        // Fetch all requested applications
        List<JobApplication> apps = applicationRepository.findAllById(dto.getApplicationIds());
        if (apps.isEmpty()) {
            throw new ResourceNotFoundException("No applications found for the given IDs");
        }

        // Group by vacancyId
        Map<Long, List<JobApplication>> byVacancy = apps.stream()
                .collect(Collectors.groupingBy(JobApplication::getVacancyId));

        Set<Long> touchedInterviewIds = new LinkedHashSet<>();

        for (Map.Entry<Long, List<JobApplication>> entry : byVacancy.entrySet()) {
            Long vacancyId = entry.getKey();
            List<JobApplication> vacApps = entry.getValue();

            // Resolve vacancy title for email
            String vacancyTitle = vacancyRepository.findById(vacancyId)
                    .map(JobVacancy::getJobTitle)
                    .orElse("the applied position");

            // Find or create interview record for this vacancy + date/time/location
            Interview interview = interviewRepository
                    .findByVacancyIdAndInterviewDateAndInterviewTimeAndInterviewLocation(
                            vacancyId, date, time, location)
                    .orElseGet(() -> {
                        Interview newInterview = new Interview();
                        newInterview.setVacancyId(vacancyId);
                        newInterview.setInterviewDate(date);
                        newInterview.setInterviewTime(time);
                        newInterview.setInterviewLocation(location);
                        return interviewRepository.save(newInterview);
                    });

            touchedInterviewIds.add(interview.getId());

            for (JobApplication app : vacApps) {
                // Send email invitation
                try {
                    emailService.sendInterviewInvitationEmail(
                            app.getEmail(),
                            app.getFullName(),
                            vacancyTitle,
                            dto.getInterviewDate(),
                            dto.getInterviewTime(),
                            location
                    );
                } catch (Exception e) {
                    // Log but don't fail the whole batch
                    System.err.println("Failed to send interview email to " + app.getEmail() + ": " + e.getMessage());
                }

                // Update application
                app.setApplicationStatus(JobApplication.ApplicationStatus.INTERVIEW_SENT);
                app.setInterviewDateTime(dateTime);
                app.setInterviewLocation(location);
                app.setInterviewId(interview.getId());
                applicationRepository.save(app);
            }
        }

        // Return the interview DTOs for all touched interviews
        return touchedInterviewIds.stream()
                .map(id -> interviewRepository.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Delete an interview by ID
     */
    public void deleteInterview(Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));

        // Unlink applications from this interview before deleting
        for (JobApplication app : interview.getApplications()) {
            app.setInterviewId(null);
            app.setInterview(null);
            applicationRepository.save(app);
        }

        interviewRepository.delete(interview);
    }
}
