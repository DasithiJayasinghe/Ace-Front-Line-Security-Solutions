package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.MonthlyReportDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.MonthlyReportService;
//import lk.acefrontline.dto.MonthlyReportDTO;
//import lk.acefrontline.service.MonthlyReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monthly-reports")
public class MonthlyReportController {

    @Autowired
    private MonthlyReportService monthlyReportService;

    private static final Long DEMO_MANAGER_ID = 1L;

    @PostMapping
    public ResponseEntity<?> createMonthlyReport(
            @RequestBody MonthlyReportDTO dto,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            MonthlyReportDTO created = (userEmail != null && !userEmail.isBlank())
                    ? monthlyReportService.createMonthlyReportForAreaManagerEmail(dto, userEmail)
                    : monthlyReportService.createMonthlyReport(dto, DEMO_MANAGER_ID);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMonthlyReport(@PathVariable Long id, @RequestBody MonthlyReportDTO dto) {
        try {
            MonthlyReportDTO updated = monthlyReportService.updateMonthlyReport(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<MonthlyReportDTO>> getReportsByManager(@PathVariable Long managerId) {
        List<MonthlyReportDTO> reports = monthlyReportService.getReportsByManager(managerId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/me")
    public ResponseEntity<List<MonthlyReportDTO>> getReportsForCurrentAreaManager(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        List<MonthlyReportDTO> reports = monthlyReportService.getReportsByAreaManagerEmail(userEmail);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/chairman")
    public ResponseEntity<List<MonthlyReportDTO>> getAllReportsForChairman() {
        return ResponseEntity.ok(monthlyReportService.getAllReportsForChairmanView());
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitReportForChairmanReview(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            return ResponseEntity.ok(monthlyReportService.submitReport(id, userEmail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/decision")
    public ResponseEntity<?> chairmanDecision(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(monthlyReportService.reviewSubmittedReport(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        try {
            MonthlyReportDTO report = monthlyReportService.getReportById(id);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonthlyReport(@PathVariable Long id) {
        monthlyReportService.deleteMonthlyReport(id);
        return ResponseEntity.noContent().build();
    }
}

