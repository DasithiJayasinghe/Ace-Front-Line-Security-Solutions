package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import com.security.Ace.Front.Line.Security.Solutions.entity.MonthlyReport;
import com.security.Ace.Front.Line.Security.Solutions.repository.AreaManagerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.MonthlyReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MonthlyReportService {

    @Autowired
    private MonthlyReportRepository monthlyReportRepository;

    @Autowired
    private AreaManagerRepository areaManagerRepository;

    @Transactional
    public MonthlyReportDTO createMonthlyReport(MonthlyReportDTO dto, Long managerId) {
        AreaManager manager = areaManagerRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Area Manager not found"));

        // Check if report already exists
        if (monthlyReportRepository.findByAreaManagerIdAndYearAndMonth(managerId, dto.getYear(), dto.getMonth()).isPresent()) {
            throw new RuntimeException("Monthly report already exists for this period");
        }

        MonthlyReport report = new MonthlyReport();
        report.setAreaManager(manager);
        report.setMonth(dto.getMonth());
        report.setYear(dto.getYear());
        report.setProblemsFaced(dto.getProblemsFaced());
        report.setRootCauses(dto.getRootCauses());
        report.setMitigationSteps(dto.getMitigationSteps());
        report.setComplaintsReceived(dto.getComplaintsReceived());
        report.setAdditionalNotes(dto.getAdditionalNotes());
        report.setGeneratedDate(LocalDate.now());
        report.setStatus(dto.getStatus() != null ? dto.getStatus() : "DRAFT");

        MonthlyReport saved = monthlyReportRepository.save(report);
        return convertToDTO(saved);
    }

    @Transactional
    public MonthlyReportDTO updateMonthlyReport(Long id, MonthlyReportDTO dto) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));

        report.setProblemsFaced(dto.getProblemsFaced());
        report.setRootCauses(dto.getRootCauses());
        report.setMitigationSteps(dto.getMitigationSteps());
        report.setComplaintsReceived(dto.getComplaintsReceived());
        report.setAdditionalNotes(dto.getAdditionalNotes());
        report.setStatus(dto.getStatus());

        MonthlyReport updated = monthlyReportRepository.save(report);
        return convertToDTO(updated);
    }

    public List<MonthlyReportDTO> getReportsByManager(Long managerId) {
        return monthlyReportRepository.findByManagerOrderByDate(managerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MonthlyReportDTO getReportById(Long id) {
        MonthlyReport report = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly report not found"));
        return convertToDTO(report);
    }

    public void deleteMonthlyReport(Long id) {
        monthlyReportRepository.deleteById(id);
    }

    private MonthlyReportDTO convertToDTO(MonthlyReport report) {
        MonthlyReportDTO dto = new MonthlyReportDTO();
        dto.setId(report.getId());
        dto.setMonth(report.getMonth());
        dto.setYear(report.getYear());
        dto.setMonthName(Month.of(report.getMonth()).name());
        dto.setProblemsFaced(report.getProblemsFaced());
        dto.setRootCauses(report.getRootCauses());
        dto.setMitigationSteps(report.getMitigationSteps());
        dto.setComplaintsReceived(report.getComplaintsReceived());
        dto.setAdditionalNotes(report.getAdditionalNotes());
        dto.setAreaManagerName(report.getAreaManager().getFullName());
        dto.setAreaManagerEmployeeId(report.getAreaManager().getEmployeeId());
        dto.setBranch(report.getAreaManager().getBranch());
        dto.setGeneratedDate(report.getGeneratedDate());
        dto.setStatus(report.getStatus());
        return dto;
    }
}
