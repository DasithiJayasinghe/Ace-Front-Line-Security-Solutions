package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PdfController {

    private final PdfService pdfService;

    /**
     * GET /api/pdf/invoice/{invoiceId}
     * Returns a downloadable PDF for the given invoice.
     * Used by both the client portal and accountant dashboard.
     */
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable Integer invoiceId) {
        byte[] pdfBytes = pdfService.generateInvoicePdf(invoiceId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData(
                "attachment",
                "invoice-" + invoiceId + ".pdf"
        );
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}