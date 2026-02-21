package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.WeeklyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.WeeklyReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/weekly-reports")
@CrossOrigin(origins = "*")
public class WeeklyReportController {

    @Autowired
    private WeeklyReportService weeklyReportService;

    private static final Long DEMO_MANAGER_ID = 1L;

    @PostMapping("/generate")
    public ResponseEntity<?> generateWeeklyReport(
            @RequestParam Long officerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekDate) {
        try {
            WeeklyReportDTO report = weeklyReportService.generateWeeklyReport(
                    officerId, DEMO_MANAGER_ID, weekDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Generate weekly reports for all officers under a given company for this manager and week.
     * Returns a list of officer-level rows, but conceptually this is a "company weekly report".
     */
    @PostMapping("/generate/company")
    public ResponseEntity<?> generateWeeklyReportsForCompany(
            @RequestParam String companyName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekDate) {
        try {
            List<WeeklyReportDTO> reports = weeklyReportService
                    .generateWeeklyReportsForCompany(DEMO_MANAGER_ID, companyName, weekDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(reports);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<WeeklyReportDTO>> getReportsByManager(@PathVariable Long managerId) {
        List<WeeklyReportDTO> reports = weeklyReportService.getReportsByManager(managerId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/manager/{managerId}/year/{year}")
    public ResponseEntity<List<WeeklyReportDTO>> getReportsByManagerAndYear(
            @PathVariable Long managerId,
            @PathVariable Integer year) {
        List<WeeklyReportDTO> reports = weeklyReportService.getReportsByManagerAndYear(managerId, year);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/manager/{managerId}/company")
    public ResponseEntity<List<WeeklyReportDTO>> getReportsByCompany(
            @PathVariable Long managerId,
            @RequestParam String companyName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekDate) {
        List<WeeklyReportDTO> reports = weeklyReportService.getReportsByManagerCompanyAndWeek(managerId, companyName, weekDate);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        try {
            WeeklyReportDTO report = weeklyReportService.getReportById(id);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWeeklyReport(@PathVariable Long id, @RequestBody WeeklyReportDTO dto) {
        try {
            WeeklyReportDTO updated = weeklyReportService.updateWeeklyReport(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWeeklyReport(@PathVariable Long id) {
        try {
            weeklyReportService.deleteWeeklyReport(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

