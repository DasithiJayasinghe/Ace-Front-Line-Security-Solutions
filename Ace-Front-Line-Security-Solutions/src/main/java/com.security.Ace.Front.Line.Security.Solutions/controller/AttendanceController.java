package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.AttendanceDTO;
import com.security.Ace.Front.Line.Security.Solutions.service.AttendanceService;
//import lk.acefrontline.dto.AttendanceDTO;
//import lk.acefrontline.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // For demo purposes, using manager ID 1
    private static final Long DEMO_MANAGER_ID = 1L;

    @PostMapping
    public ResponseEntity<?> createAttendance(@RequestBody AttendanceDTO dto) {
        try {
            AttendanceDTO created = attendanceService.createAttendance(dto, DEMO_MANAGER_ID);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAttendance(@PathVariable Long id, @RequestBody AttendanceDTO dto) {
        try {
            AttendanceDTO updated = attendanceService.updateAttendance(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/officer/{officerId}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByOfficer(@PathVariable Long officerId) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByOfficer(officerId);
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByDateRange(startDate, endDate);
        return ResponseEntity.ok(attendance);
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByManager(
            @PathVariable Long managerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDTO> attendance = attendanceService.getAttendanceByManagerInPeriod(managerId, startDate, endDate);
        return ResponseEntity.ok(attendance);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }
}

