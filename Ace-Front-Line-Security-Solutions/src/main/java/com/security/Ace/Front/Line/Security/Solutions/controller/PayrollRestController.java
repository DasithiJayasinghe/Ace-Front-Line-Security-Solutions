package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollDetailDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PayrollResponseDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryAllowance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryDeduction;
import com.security.Ace.Front.Line.Security.Solutions.service.SalaryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.repository.AdvanceRequestRepository;
import com.security.Ace.Front.Line.Security.Solutions.util.PdfGenerator;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*")
public class PayrollRestController {

    private final SalaryService salaryService;
    private final AdvanceRequestRepository advanceRequestRepository;
    private final PdfGenerator pdfGenerator;

    public PayrollRestController(SalaryService salaryService,
            AdvanceRequestRepository advanceRequestRepository,
            PdfGenerator pdfGenerator) {
        this.salaryService = salaryService;
        this.advanceRequestRepository = advanceRequestRepository;
        this.pdfGenerator = pdfGenerator;
    }

    @GetMapping("/stats")
    public ResponseEntity<com.security.Ace.Front.Line.Security.Solutions.dto.DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(salaryService.getDashboardStats());
    }

    @GetMapping("/trends")
    public ResponseEntity<SalaryTrendsDTO> getSalaryTrends(@RequestParam(required = false) Long officerId) {
        return ResponseEntity.ok(salaryService.getSalaryTrends(officerId));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generatePayroll(@RequestBody PayrollRequestDTO request) {
        try {
            List<SalaryAllowance> allowances = new ArrayList<>();
            if (request.getAllowances() != null) {
                for (PayrollRequestDTO.AllowanceDTO a : request.getAllowances()) {
                    SalaryAllowance sa = new SalaryAllowance();
                    sa.setAllowanceName(a.getName());
                    sa.setAllowanceAmount(a.getAmount());
                    allowances.add(sa);
                }
            }

            List<SalaryDeduction> deductions = new ArrayList<>();
            if (request.getDeductions() != null) {
                for (PayrollRequestDTO.DeductionDTO d : request.getDeductions()) {
                    SalaryDeduction sd = new SalaryDeduction();
                    sd.setDeductionName(d.getName());
                    sd.setDeductionAmount(d.getAmount());
                    sd.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
                    deductions.add(sd);
                }
            }

            Salary saved = salaryService.generatePayroll(
                    request.getOfficerId(),
                    request.getMonth(),
                    request.getPayPeriodStart(),
                    request.getPayPeriodEnd(),
                    request.getTotalShifts(),
                    request.getBasicSalary(),
                    request.getOvertimeAmount(),
                    allowances,
                    deductions,
                    "SYSTEM_ADMIN" // Hardcoded for now, should come from auth
            );

            return ResponseEntity.ok(convertToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PayrollResponseDTO>> getPayrollList(@RequestParam String month) {
        System.out.println("Processing Payroll List request for month: " + month);
        List<Salary> salaries;
        if ("ALL".equalsIgnoreCase(month)) {
            salaries = salaryService.getCalculatedAcrossAllMonths();
        } else {
            salaries = salaryService.getCalculatedForMonth(month);
        }
        System.out.println("Found " + salaries.size() + " calculated records.");
        return ResponseEntity.ok(salaries.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/history")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PayrollResponseDTO>> getPayrollHistory(@RequestParam String month) {
        System.out.println("Processing Payroll History request for month: " + month);
        List<Salary> salaries;
        if ("ALL".equalsIgnoreCase(month)) {
            salaries = salaryService.getPaidAcrossAllMonths();
        } else {
            salaries = salaryService.getPaidForMonth(month);
        }
        System.out.println("Found " + salaries.size() + " paid records.");
        return ResponseEntity.ok(salaries.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/export")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportBankCSV(@RequestParam String month) {
        List<Salary> salaries = "ALL".equalsIgnoreCase(month)
                ? salaryService.getCalculatedAcrossAllMonths()
                : salaryService.getCalculatedForMonth(month);

        StringBuilder csv = new StringBuilder();
        csv.append("Officer Name,Bank Name,Branch Name,Account Number,Net Salary\n");

        for (Salary s : salaries) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f\n",
                    s.getOfficer().getFullName(),
                    s.getOfficer().getBankName() != null ? s.getOfficer().getBankName() : "N/A",
                    s.getOfficer().getBankBranch() != null ? s.getOfficer().getBankBranch() : "N/A",
                    s.getOfficer().getBankAccountNumber() != null ? s.getOfficer().getBankAccountNumber() : "N/A",
                    s.getNetSalary().doubleValue()));
        }

        byte[] output = csv.toString().getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "Bank_Export_" + month + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(output);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPayrollDetail(@PathVariable Long id) {
        try {
            Salary s = salaryService.getPayrollById(id);
            return ResponseEntity.ok(convertToDetailDTO(s));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayroll(@PathVariable Long id, @RequestBody PayrollRequestDTO request) {
        try {
            List<SalaryAllowance> allowances = new ArrayList<>();
            if (request.getAllowances() != null) {
                for (PayrollRequestDTO.AllowanceDTO a : request.getAllowances()) {
                    SalaryAllowance sa = new SalaryAllowance();
                    sa.setAllowanceName(a.getName());
                    sa.setAllowanceAmount(a.getAmount());
                    allowances.add(sa);
                }
            }

            List<SalaryDeduction> deductions = new ArrayList<>();
            if (request.getDeductions() != null) {
                for (PayrollRequestDTO.DeductionDTO d : request.getDeductions()) {
                    SalaryDeduction sd = new SalaryDeduction();
                    sd.setDeductionName(d.getName());
                    sd.setDeductionAmount(d.getAmount());
                    sd.setDeductionType(SalaryDeduction.DeductionType.CUSTOM);
                    deductions.add(sd);
                }
            }

            Salary updated = salaryService.updatePayroll(
                    id,
                    request.getTotalShifts(),
                    request.getOvertimeAmount(),
                    allowances,
                    deductions,
                    "SYSTEM_ADMIN");
            return ResponseEntity.ok(convertToDetailDTO(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pay/{id}")
    public ResponseEntity<?> markAsPaid(@PathVariable Long id) {
        try {
            salaryService.markAsPaid(id, LocalDate.now(), "Bank Transfer", "REF-" + System.currentTimeMillis(),
                    "Admin");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayroll(@PathVariable Long id) {
        try {
            salaryService.deletePayroll(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/payslip/pdf/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable Long id) {
        try {
            Salary salary = salaryService.getPayrollById(id);
            byte[] pdfBytes = pdfGenerator.generatePayslip(salary);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payslip_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error generating payslip PDF: " + e.getMessage(), e);
        }
    }

    @GetMapping("/trends/pdf")
    public void downloadSalaryTrends(@RequestParam(required = false) Long officerId, HttpServletResponse response)
            throws IOException {
        SalaryTrendsDTO trends = salaryService.getSalaryTrends(officerId);
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=salary_trends_report.pdf");
        pdfGenerator.generateSalaryTrendsReport(trends, response.getOutputStream());
    }

    @GetMapping("/officer/payslips/{officerId}")
    public ResponseEntity<List<PayrollResponseDTO>> getOfficerPayslips(@PathVariable Long officerId) {
        List<Salary> payslips = salaryService.getPaidPayslipsForOfficer(officerId);
        return ResponseEntity.ok(payslips.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    // --- ADVANCE REQUESTS ---

    @GetMapping("/advances")
    public ResponseEntity<?> getAdvances(@RequestParam(required = false) String status) {
        if (status != null) {
            try {
                return ResponseEntity.ok(advanceRequestRepository
                        .findByStatus(AdvanceRequest.Status.valueOf(status.toUpperCase())));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Invalid status: " + status);
            }
        }
        return ResponseEntity.ok(advanceRequestRepository.findAll());
    }

    @PostMapping("/advances/approve/{id}")
    public ResponseEntity<?> approveAdvance(@PathVariable Long id) {
        try {
            salaryService.updateAdvanceStatus(id, AdvanceRequest.Status.APPROVED);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/advances/reject/{id}")
    public ResponseEntity<?> rejectAdvance(@PathVariable Long id) {
        try {
            salaryService.updateAdvanceStatus(id, AdvanceRequest.Status.REJECTED);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/advances/pay/{id}")
    public ResponseEntity<?> markAdvanceAsPaid(@PathVariable Long id) {
        try {
            salaryService.markAdvanceAsPaid(id, LocalDate.now());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/officer/advances/{officerId}")
    public ResponseEntity<List<AdvanceRequest>> getOfficerAdvances(@PathVariable Long officerId,
            @RequestParam String month) {
        return ResponseEntity.ok(salaryService.getUndeductedPaidAdvances(officerId, month));
    }

    private PayrollDetailDTO convertToDetailDTO(Salary s) {
        PayrollDetailDTO dto = new PayrollDetailDTO();
        dto.setId(s.getId());
        dto.setMonth(s.getMonth());
        dto.setOfficerName(s.getOfficer().getFullName());
        dto.setOfficerId(String.valueOf(s.getOfficer().getId()));
        dto.setBasicSalary(s.getBasicSalary());
        dto.setOtRate(java.math.BigDecimal.valueOf(500.00));
        dto.setTotalShifts(s.getTotalShifts());
        dto.setBankName(s.getOfficer().getBankName());
        dto.setBranchName(s.getOfficer().getBankBranch());
        dto.setAccountNumber(s.getOfficer().getBankAccountNumber());

        dto.setAllowances(s.getSalaryAllowances().stream().map(a -> {
            PayrollDetailDTO.AllowanceDTO adto = new PayrollDetailDTO.AllowanceDTO();
            adto.setName(a.getAllowanceName());
            adto.setAmount(a.getAllowanceAmount());
            return adto;
        }).collect(Collectors.toList()));

        dto.setDeductions(s.getSalaryDeductions().stream().map(d -> {
            PayrollDetailDTO.DeductionDTO ddto = new PayrollDetailDTO.DeductionDTO();
            ddto.setName(d.getDeductionName());
            ddto.setAmount(d.getDeductionAmount());
            return ddto;
        }).collect(Collectors.toList()));

        dto.setNetSalary(s.getNetSalary());
        String inWords = com.security.Ace.Front.Line.Security.Solutions.util.NumberToWords
                .convert(s.getNetSalary().longValue()) + " Rupees Only";
        dto.setNetSalaryInWords(inWords);

        return dto;
    }

    private PayrollResponseDTO convertToDTO(Salary s) {
        PayrollResponseDTO dto = new PayrollResponseDTO();
        dto.setId(s.getId());
        dto.setMonth(s.getMonth());
        dto.setBasicSalary(s.getBasicSalary());
        dto.setTotalAllowances(s.getTotalAllowances());
        dto.setTotalDeductions(s.getTotalDeductions());
        dto.setNetSalary(s.getNetSalary());
        dto.setPaymentDate(s.getPaymentDate());
        dto.setStatus(s.getStatus().name());

        PayrollResponseDTO.OfficerInfo officerInfo = new PayrollResponseDTO.OfficerInfo();
        officerInfo.setOfficerId(String.valueOf(s.getOfficer().getId()));
        officerInfo.setFullName(s.getOfficer().getFullName());
        dto.setOfficer(officerInfo);

        return dto;
    }
}
