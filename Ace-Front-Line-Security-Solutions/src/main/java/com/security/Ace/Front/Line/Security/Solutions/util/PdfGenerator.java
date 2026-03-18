package com.security.Ace.Front.Line.Security.Solutions.util;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryAllowance;
import com.security.Ace.Front.Line.Security.Solutions.entity.SalaryDeduction;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryAllowanceRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.SalaryDeductionRepository;
import org.springframework.stereotype.Component;

import com.security.Ace.Front.Line.Security.Solutions.dto.SalaryTrendsDTO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class PdfGenerator {

    private final SalaryAllowanceRepository allowanceRepository;
    private final SalaryDeductionRepository deductionRepository;

    public PdfGenerator(SalaryAllowanceRepository allowanceRepository, SalaryDeductionRepository deductionRepository) {
        this.allowanceRepository = allowanceRepository;
        this.deductionRepository = deductionRepository;
    }

    public byte[] generatePayslip(Salary salary) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = null;
        try {
            document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            BaseColor blueColor = new BaseColor(37, 99, 235); // Tailwind Blue 600
            BaseColor headerBg = blueColor;

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BaseColor.WHITE);
            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.WHITE);
            Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new BaseColor(219, 234, 254)); // Blue 100
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new BaseColor(31, 41, 55)); // Gray
                                                                                                               // 800
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new BaseColor(75, 85, 99)); // Gray 600
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new BaseColor(31, 41, 55)); // Gray 800
            BaseColor lightGray = new BaseColor(249, 250, 251); // Gray 50

            // --- HEADER SECTION ---
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[] { 2, 1 });

            // Left: Company Info
            PdfPCell companyCell = new PdfPCell();
            companyCell.setBackgroundColor(headerBg);
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.setPadding(15);

            // Container for Logo + Name
            PdfPTable logoContainer = new PdfPTable(2);
            logoContainer.setWidthPercentage(100);
            logoContainer.setWidths(new float[] { 1, 4 });

            // Logo Cell
            PdfPCell logoPicCell = new PdfPCell();
            logoPicCell.setBorder(Rectangle.NO_BORDER);
            try {
                String logoPath = "frontend/src/assets/logo.png";
                Image logo = Image.getInstance(logoPath);
                logo.scaleToFit(50, 50);
                logoPicCell.addElement(logo);
            } catch (Exception e) {
                // Silently ignore if image not found
            }
            logoContainer.addCell(logoPicCell);

            // Name Cell
            PdfPCell nameTextCell = new PdfPCell();
            nameTextCell.setBorder(Rectangle.NO_BORDER);
            nameTextCell.addElement(new Paragraph("Ace Front Line Security Solutions", companyFont));
            logoContainer.addCell(nameTextCell);

            companyCell.addElement(logoContainer);
            companyCell.addElement(new Paragraph("123 Main Street, Colombo 01, Sri Lanka", addressFont));
            companyCell.addElement(new Paragraph("Tel: +94 11 234 5678 | Email: info@acefrontline.lk", addressFont));

            // Right: Payslip Label
            PdfPCell labelCell = new PdfPCell();
            labelCell.setBackgroundColor(headerBg);
            labelCell.setBorder(Rectangle.NO_BORDER);
            labelCell.setPadding(20);
            labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            Paragraph payslipTitle = new Paragraph("PAYSLIP", titleFont);
            payslipTitle.setAlignment(Element.ALIGN_RIGHT);
            labelCell.addElement(payslipTitle);

            Paragraph monthPara = new Paragraph(salary.getMonth(), addressFont);
            monthPara.setAlignment(Element.ALIGN_RIGHT);
            labelCell.addElement(monthPara);

            headerTable.addCell(companyCell);
            headerTable.addCell(labelCell);
            document.add(headerTable);

            // --- INFO BAR ---
            PdfPTable infoTable = new PdfPTable(3);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(10);

            addInfoCell(infoTable, "Payslip Number:", "PAY-" + salary.getId(), lightGray);
            addInfoCell(infoTable, "Payment Date:",
                    salary.getPaymentDate() != null ? salary.getPaymentDate().toString() : "-", lightGray);
            addInfoCell(infoTable, "Pay Period:", salary.getPayPeriodStart() + " - " + salary.getPayPeriodEnd(),
                    lightGray);

            document.add(infoTable);

            // --- EMPLOYEE INFORMATION ---
            addSectionHeader(document, "EMPLOYEE INFORMATION", blueColor, sectionFont);

            PdfPTable empTable = new PdfPTable(3);
            empTable.setWidthPercentage(100);
            empTable.setSpacingBefore(5);
            empTable.setSpacingAfter(15);

            addDetailCell(empTable, "Employee ID", String.valueOf(salary.getOfficer().getId()), labelFont,
                    valueFont);
            addDetailCell(empTable, "Employee Name", salary.getOfficer().getFullName(), labelFont, valueFont);
            addDetailCell(empTable, "Position",
                    salary.getOfficer().getRole() != null ? salary.getOfficer().getRole().name() : "-", labelFont,
                    valueFont);

            addDetailCell(empTable, "Assigned Area",
                    salary.getOfficer().getAssignedArea() != null ? salary.getOfficer().getAssignedArea() : "-",
                    labelFont,
                    valueFont);
            addDetailCell(empTable, "Assigned Company",
                    salary.getOfficer().getAssignedCompany() != null ? salary.getOfficer().getAssignedCompany() : "-",
                    labelFont, valueFont);
            addDetailCell(empTable, "Total Shifts", salary.getTotalShifts() + " shifts", labelFont, valueFont);

            document.add(empTable);

            // --- BANK DETAILS ---
            addSectionHeader(document, "BANK DETAILS", blueColor, sectionFont);

            PdfPTable bankTable = new PdfPTable(3);
            bankTable.setWidthPercentage(100);
            bankTable.setSpacingBefore(5);
            bankTable.setSpacingAfter(15);

            addDetailCell(bankTable, "Account Number", salary.getOfficer().getBankAccountNumber(), labelFont,
                    valueFont);
            addDetailCell(bankTable, "Bank Name", salary.getOfficer().getBankName(), labelFont, valueFont);
            addDetailCell(bankTable, "Branch", salary.getOfficer().getBankBranch(), labelFont, valueFont);

            document.add(bankTable);

            // --- SALARY BREAKDOWN ---
            addSectionHeader(document, "SALARY BREAKDOWN", blueColor, sectionFont);

            PdfPTable splitTable = new PdfPTable(2);
            splitTable.setWidthPercentage(100);
            splitTable.setSpacingBefore(10);
            splitTable.setWidths(new float[] { 1, 1 });

            // LEFT: EARNINGS
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setPaddingRight(10);

            PdfPTable earningsTable = new PdfPTable(2);
            earningsTable.setWidthPercentage(100);
            earningsTable.setWidths(new float[] { 2, 1 });

            PdfPCell eHeader = new PdfPCell(
                    new Phrase("ALLOWANCES", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
            eHeader.setBackgroundColor(new BaseColor(22, 163, 74));
            eHeader.setColspan(2);
            eHeader.setPadding(6);
            earningsTable.addCell(eHeader);

            addRow(earningsTable, "Basic Salary", formatMoney(salary.getBasicSalary()), labelFont, valueFont);

            for (SalaryAllowance a : salary.getSalaryAllowances()) {
                addRow(earningsTable, a.getAllowanceName(), formatMoney(a.getAllowanceAmount()), labelFont, valueFont);
            }

            addTotalRow(earningsTable, "TOTAL EARNINGS", formatMoney(salary.getTotalAllowances()),
                    new BaseColor(22, 163, 74));
            leftCell.addElement(earningsTable);

            // RIGHT: DEDUCTIONS
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setPaddingLeft(10);

            PdfPTable deductionsTable = new PdfPTable(2);
            deductionsTable.setWidthPercentage(100);
            deductionsTable.setWidths(new float[] { 2, 1 });

            PdfPCell dHeader = new PdfPCell(
                    new Phrase("DEDUCTIONS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE)));
            dHeader.setBackgroundColor(new BaseColor(220, 38, 38));
            dHeader.setColspan(2);
            dHeader.setPadding(6);
            deductionsTable.addCell(dHeader);

            for (SalaryDeduction d : salary.getSalaryDeductions()) {
                addRow(deductionsTable, d.getDeductionName(), formatMoney(d.getDeductionAmount()), labelFont,
                        valueFont);
            }

            addTotalRow(deductionsTable, "TOTAL DEDUCTIONS", formatMoney(salary.getTotalDeductions()),
                    new BaseColor(220, 38, 38));
            rightCell.addElement(deductionsTable);

            splitTable.addCell(leftCell);
            splitTable.addCell(rightCell);
            document.add(splitTable);

            document.add(new Paragraph(" "));

            // --- NET SALARY ---
            PdfPTable netTable = new PdfPTable(1);
            netTable.setWidthPercentage(100);
            PdfPCell netCell = new PdfPCell();
            netCell.setBackgroundColor(headerBg);
            netCell.setPadding(15);

            Paragraph netLabel = new Paragraph("NET SALARY (TAKE HOME PAY)",
                    FontFactory.getFont(FontFactory.HELVETICA, 10, new BaseColor(219, 234, 254)));
            netCell.addElement(netLabel);

            BigDecimal netSal = salary.getNetSalary() != null ? salary.getNetSalary() : BigDecimal.ZERO;
            Paragraph netValue = new Paragraph("Rs. " + formatMoney(netSal),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 30, BaseColor.WHITE));
            netCell.addElement(netValue);

            String inWords = NumberToWords.convert(netSal.longValue()) + " Rupees Only";
            Paragraph netWords = new Paragraph("In Words: " + inWords,
                    FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.WHITE));
            netCell.addElement(netWords);

            netTable.addCell(netCell);
            document.add(netTable);

            document.add(new Paragraph(" "));

            PdfPTable footerTable = new PdfPTable(2);
            footerTable.setWidthPercentage(100);
            PdfPCell noteCell = new PdfPCell();
            noteCell.setBorder(Rectangle.NO_BORDER);
            noteCell.addElement(new Paragraph("Notes:", labelFont));
            noteCell.addElement(new Paragraph("- This is a computer-generated payslip.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, BaseColor.GRAY)));

            PdfPCell sigCell = new PdfPCell();
            sigCell.setBorder(Rectangle.NO_BORDER);
            sigCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph sig = new Paragraph("Authorized Signature", valueFont);
            sig.setAlignment(Element.ALIGN_RIGHT);
            sigCell.addElement(sig);

            footerTable.addCell(noteCell);
            footerTable.addCell(sigCell);
            document.add(footerTable);

        } catch (Exception e) {
            System.err.println("PDF ERROR: " + e.toString());
            e.printStackTrace();
            throw new RuntimeException("Error during PDF generation: " + e.toString(), e);
        } finally {
            if (document != null && document.isOpen()) {
                document.close();
            }
        }
        byte[] bytes = out.toByteArray();
        System.out.println("Generated PDF size: " + bytes.length + " bytes");
        return bytes;
    }

    public void generateSalaryTrendsReport(SalaryTrendsDTO data, OutputStream out) {
        Document document = null;
        try {
            // A4 page with tighter margins to fit everything on one page
            document = new Document(PageSize.A4, 25, 25, 25, 25);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // --- STYLING ASSETS ---
            BaseColor primaryColor = new BaseColor(250, 204, 21); // UI Yellow (#facc15)
            BaseColor charcoalColor = new BaseColor(31, 41, 55); // UI Gray 800
            BaseColor mutedColor = new BaseColor(107, 114, 128); // UI Gray 500
            BaseColor lightGray = new BaseColor(249, 250, 251); // Gray 50

            // Re-defined fonts based on feedback
            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, charcoalColor); // Larger Company
                                                                                                   // Name
            Font companyDetailFont = FontFactory.getFont(FontFactory.HELVETICA, 8, mutedColor);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, charcoalColor); // Smaller Title
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, mutedColor);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, charcoalColor);
            Font sectionSubFont = FontFactory.getFont(FontFactory.HELVETICA, 8, mutedColor);
            Font statLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, mutedColor);
            Font statValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, charcoalColor);
            Font tableFont = FontFactory.getFont(FontFactory.HELVETICA, 8, charcoalColor);

            // --- 1. HEADER (Logo Top-Left + Company Details Centered) ---
            PdfPTable header = new PdfPTable(3);
            header.setWidthPercentage(100);
            header.setWidths(new float[] { 1, 3, 1 }); // Adjusted weights

            // Logo (Top-Left)
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setHorizontalAlignment(Element.ALIGN_LEFT);
            try {
                // Try absolute path or relative to project root
                String logoPath = "frontend/src/assets/logo.png";
                Image logo = Image.getInstance(logoPath);
                logo.scaleToFit(60, 60);
                logoCell.addElement(logo);
            } catch (Exception e) {
                // Silent catch: logo skipped if path incorrect
            }
            header.addCell(logoCell);

            // Company Details (Center)
            PdfPCell detailsCell = new PdfPCell();
            detailsCell.setBorder(Rectangle.NO_BORDER);
            detailsCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph cName = new Paragraph("ACE FRONT LINE SECURITY SOLUTIONS", companyFont);
            cName.setAlignment(Element.ALIGN_CENTER);
            detailsCell.addElement(cName);
            Paragraph cAddr = new Paragraph(
                    "123 Security Plaza, Colombo 03, Sri Lanka\nTel: +94 11 234 5678 | Email: info@aflss.lk",
                    companyDetailFont);
            cAddr.setAlignment(Element.ALIGN_CENTER);
            detailsCell.addElement(cAddr);
            header.addCell(detailsCell);

            // Right Cell (Empty/Spacer)
            header.addCell(new PdfPCell() {
                {
                    setBorder(Rectangle.NO_BORDER);
                }
            });

            document.add(header);
            document.add(new Paragraph(" "));

            // --- 2. TITLE & SUBTITLE ---
            Paragraph reportTitle = new Paragraph("SALARY TRENDS", titleFont);
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(reportTitle);
            Paragraph reportSub = new Paragraph("Analyze salary patterns and track earnings", subTitleFont);
            reportSub.setAlignment(Element.ALIGN_CENTER);
            document.add(reportSub);
            document.add(new Paragraph(" "));

            // --- 3. FILTERS INFO ---
            String dateRange = "Across all available records";
            if (data.getMonthlyTrends() != null && !data.getMonthlyTrends().isEmpty()) {
                dateRange = data.getMonthlyTrends().get(0).getMonth() + " - " +
                        data.getMonthlyTrends().get(data.getMonthlyTrends().size() - 1).getMonth();
            }
            Paragraph filterLine = new Paragraph("PERIOD: " + dateRange.toUpperCase() + "  |  SELECTION: ALL OFFICERS",
                    sectionSubFont);
            filterLine.setAlignment(Element.ALIGN_CENTER);
            document.add(filterLine);
            document.add(new Paragraph(" "));

            // --- 4. SUMMARY STATS TABLE ---
            PdfPTable summaryStats = new PdfPTable(5);
            summaryStats.setWidthPercentage(100);
            summaryStats.setSpacingAfter(10);

            addStatCard(summaryStats, "AVERAGE", formatMoney(data.getAverageSalary()), primaryColor, statLabelFont,
                    statValueFont);
            addStatCard(summaryStats, "HIGHEST", formatMoney(data.getHighestSalary()), primaryColor, statLabelFont,
                    statValueFont);
            addStatCard(summaryStats, "LOWEST", formatMoney(data.getLowestSalary()), primaryColor, statLabelFont,
                    statValueFont);
            addStatCard(summaryStats, "TOTAL YTD", formatMoney(data.getTotalYTD()), primaryColor, statLabelFont,
                    statValueFont);
            addStatCard(summaryStats, "OVERTIME", formatMoney(data.getTotalOvertime()), primaryColor, statLabelFont,
                    statValueFont);

            document.add(summaryStats);

            // --- 5. MONTHLY NET SALARY TREND (Bar Chart) ---
            addSectionHeaderWithDesc(document, "MONTHLY NET SALARY TREND", "Track salary progression over time",
                    charcoalColor, sectionTitleFont, sectionSubFont);

            PdfPTable trendTable = new PdfPTable(3);
            trendTable.setWidthPercentage(100);
            trendTable.setSpacingBefore(5);
            trendTable.setWidths(new float[] { 1f, 4f, 1f });

            if (data.getMonthlyTrends() != null) {
                BigDecimal maxVal = data.getHighestSalary();
                if (maxVal == null || maxVal.compareTo(BigDecimal.ZERO) == 0)
                    maxVal = BigDecimal.valueOf(100000);

                for (SalaryTrendsDTO.MonthTrend trend : data.getMonthlyTrends()) {
                    trendTable.addCell(new PdfPCell(new Phrase(trend.getMonth(), tableFont)) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                            setVerticalAlignment(Element.ALIGN_MIDDLE);
                        }
                    });

                    PdfPCell barC = new PdfPCell();
                    barC.setBorder(Rectangle.NO_BORDER);
                    barC.setPadding(4);
                    float ratio = trend.getAmount().floatValue() / maxVal.floatValue();
                    if (ratio > 1)
                        ratio = 1;
                    else if (ratio < 0.05)
                        ratio = 0.05f;

                    PdfPTable innerBar = new PdfPTable(1);
                    innerBar.setWidthPercentage(ratio * 100);
                    innerBar.setHorizontalAlignment(Element.ALIGN_LEFT);
                    PdfPCell bCell = new PdfPCell(new Phrase(" ", FontFactory.getFont(FontFactory.HELVETICA, 4)));
                    bCell.setBackgroundColor(primaryColor);
                    bCell.setBorder(Rectangle.BOX);
                    bCell.setBorderColor(charcoalColor);
                    bCell.setBorderWidth(0.5f);
                    bCell.setFixedHeight(10f);
                    innerBar.addCell(bCell);
                    barC.addElement(innerBar);
                    trendTable.addCell(barC);

                    trendTable.addCell(new PdfPCell(new Phrase("Rs. " + formatMoney(trend.getAmount()), tableFont)) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                            setHorizontalAlignment(Element.ALIGN_RIGHT);
                            setVerticalAlignment(Element.ALIGN_MIDDLE);
                        }
                    });
                }
            }
            document.add(trendTable);

            // --- 6. ALLOWANCES VS DEDUCTIONS COMPARISON ---
            addSectionHeaderWithDesc(document, "ALLOWANCES VS DEDUCTIONS COMPARISON",
                    "Monthly comparison between earnings and deductions", charcoalColor, sectionTitleFont,
                    sectionSubFont);

            PdfPTable compTable = new PdfPTable(3);
            compTable.setWidthPercentage(100);
            compTable.setSpacingBefore(5);
            compTable.setWidths(new float[] { 1f, 4f, 1f });

            if (data.getMonthlyTrends() != null) {
                for (SalaryTrendsDTO.MonthTrend trend : data.getMonthlyTrends()) {
                    compTable.addCell(new PdfPCell(new Phrase(trend.getMonth(), tableFont)) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                        }
                    });

                    PdfPCell barsC = new PdfPCell();
                    barsC.setBorder(Rectangle.NO_BORDER);
                    barsC.setPadding(2);

                    PdfPTable barPair = new PdfPTable(2);
                    barPair.setWidthPercentage(100);

                    // Allowance Bar
                    PdfPCell aBar = new PdfPCell(new Phrase(" ", FontFactory.getFont(FontFactory.HELVETICA, 3)));
                    aBar.setBackgroundColor(primaryColor);
                    aBar.setBorder(Rectangle.BOX);
                    aBar.setBorderColor(charcoalColor);
                    aBar.setBorderWidth(0.5f);
                    aBar.setFixedHeight(8f);
                    barPair.addCell(aBar);

                    // Deduction Bar
                    PdfPCell dBar = new PdfPCell(new Phrase(" ", FontFactory.getFont(FontFactory.HELVETICA, 3)));
                    dBar.setBackgroundColor(charcoalColor);
                    dBar.setBorder(Rectangle.BOX);
                    dBar.setBorderColor(primaryColor);
                    dBar.setBorderWidth(0.5f);
                    dBar.setFixedHeight(8f);
                    barPair.addCell(dBar);

                    barsC.addElement(barPair);
                    compTable.addCell(barsC);

                    compTable.addCell(new PdfPCell(new Phrase("A: " + formatMoney(trend.getAllowances()),
                            FontFactory.getFont(FontFactory.HELVETICA, 6, mutedColor))) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                            setHorizontalAlignment(Element.ALIGN_RIGHT);
                        }
                    });
                }
            }
            document.add(compTable);

            // --- 7. SIDE-BY-SIDE BREAKDOWNS WITH PIE CHARTS ---
            PdfPTable breakdowns = new PdfPTable(2);
            breakdowns.setWidthPercentage(100);
            breakdowns.setSpacingBefore(10);
            breakdowns.setWidths(new float[] { 1, 1 });

            // ALLOWANCE PIE
            PdfPCell aCell = new PdfPCell();
            aCell.setBorder(Rectangle.NO_BORDER);
            aCell.setPaddingRight(5);
            aCell.addElement(new Paragraph("ALLOWANCE BREAKDOWN",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, charcoalColor)));

            PdfPTable aChartTable = new PdfPTable(2);
            aChartTable.setWidthPercentage(100);
            aChartTable.setWidths(new float[] { 1, 1.5f });

            // Pie Visual
            PdfPCell aPieCell = new PdfPCell();
            aPieCell.setMinimumHeight(80);
            aPieCell.setBorder(Rectangle.NO_BORDER);
            if (data.getAllowanceBreakdown() != null && !data.getAllowanceBreakdown().isEmpty()) {
                aPieCell.setCellEvent(new PieChartEvent(data.getAllowanceBreakdown(), primaryColor, charcoalColor));
            }
            aChartTable.addCell(aPieCell);

            // Details
            PdfPCell aDetailCell = new PdfPCell();
            aDetailCell.setBorder(Rectangle.NO_BORDER);
            PdfPTable aInner = new PdfPTable(2);
            aInner.setWidthPercentage(100);
            if (data.getAllowanceBreakdown() != null) {
                for (SalaryTrendsDTO.BreakdownItem item : data.getAllowanceBreakdown().stream().limit(5).toList()) {
                    aInner.addCell(
                            new PdfPCell(new Phrase(item.getLabel(), FontFactory.getFont(FontFactory.HELVETICA, 7))) {
                                {
                                    setBorder(Rectangle.NO_BORDER);
                                }
                            });
                    aInner.addCell(new PdfPCell(new Phrase(formatMoney(item.getAmount()),
                            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7))) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                            setHorizontalAlignment(Element.ALIGN_RIGHT);
                        }
                    });
                }
            }
            aDetailCell.addElement(aInner);
            aChartTable.addCell(aDetailCell);

            aCell.addElement(aChartTable);
            breakdowns.addCell(aCell);

            // DEDUCTION PIE
            PdfPCell dCell = new PdfPCell();
            dCell.setBorder(Rectangle.NO_BORDER);
            dCell.setPaddingLeft(5);
            dCell.addElement(new Paragraph("DEDUCTION BREAKDOWN",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, charcoalColor)));

            PdfPTable dChartTable = new PdfPTable(2);
            dChartTable.setWidthPercentage(100);
            dChartTable.setWidths(new float[] { 1, 1.5f });

            // Pie Visual
            PdfPCell dPieCell = new PdfPCell();
            dPieCell.setMinimumHeight(80);
            dPieCell.setBorder(Rectangle.NO_BORDER);
            if (data.getDeductionBreakdown() != null && !data.getDeductionBreakdown().isEmpty()) {
                dPieCell.setCellEvent(new PieChartEvent(data.getDeductionBreakdown(), charcoalColor, primaryColor));
            }
            dChartTable.addCell(dPieCell);

            // Details
            PdfPCell dDetailCell = new PdfPCell();
            dDetailCell.setBorder(Rectangle.NO_BORDER);
            PdfPTable dInner = new PdfPTable(2);
            dInner.setWidthPercentage(100);
            if (data.getDeductionBreakdown() != null) {
                for (SalaryTrendsDTO.BreakdownItem item : data.getDeductionBreakdown().stream().limit(5).toList()) {
                    dInner.addCell(
                            new PdfPCell(new Phrase(item.getLabel(), FontFactory.getFont(FontFactory.HELVETICA, 7))) {
                                {
                                    setBorder(Rectangle.NO_BORDER);
                                }
                            });
                    dInner.addCell(new PdfPCell(new Phrase(formatMoney(item.getAmount()),
                            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7))) {
                        {
                            setBorder(Rectangle.NO_BORDER);
                            setHorizontalAlignment(Element.ALIGN_RIGHT);
                        }
                    });
                }
            }
            dDetailCell.addElement(dInner);
            dChartTable.addCell(dDetailCell);

            dCell.addElement(dChartTable);
            breakdowns.addCell(dCell);

            document.add(breakdowns);

            // --- FOOTER ---
            Paragraph footer = new Paragraph(
                    "\nComputer Generated Salary Trends Report - AFLSS - " + java.time.LocalDateTime.now()
                            .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    sectionSubFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF Iteration 2: " + e.getMessage(), e);
        } finally {
            if (document != null && document.isOpen())
                document.close();
        }
    }

    /**
     * Inner class to draw a Pie Chart using PdfContentByte inside a table cell.
     */
    private static class PieChartEvent implements PdfPCellEvent {
        private final List<SalaryTrendsDTO.BreakdownItem> items;
        private final BaseColor color1;
        private final BaseColor color2;

        public PieChartEvent(List<SalaryTrendsDTO.BreakdownItem> items, BaseColor c1, BaseColor c2) {
            this.items = items;
            this.color1 = c1;
            this.color2 = c2;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle rect, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.BACKGROUNDCANVAS];
            float centerX = (rect.getLeft() + rect.getRight()) / 2;
            float centerY = (rect.getBottom() + rect.getTop()) / 2;
            float radius = Math.min(rect.getWidth(), rect.getHeight()) / 2 - 5;

            BigDecimal total = items.stream().map(SalaryTrendsDTO.BreakdownItem::getAmount).reduce(BigDecimal.ZERO,
                    BigDecimal::add);
            if (total.compareTo(BigDecimal.ZERO) == 0)
                return;

            float currentAngle = 0;
            for (int i = 0; i < items.size(); i++) {
                float angle = items.get(i).getAmount().floatValue() / total.floatValue() * 360;
                cb.saveState();
                cb.setColorFill(i % 2 == 0 ? color1 : color2);
                cb.moveTo(centerX, centerY);
                cb.arc(centerX - radius, centerY - radius, centerX + radius, centerY + radius, currentAngle, angle);
                cb.lineTo(centerX, centerY);
                cb.fill();
                cb.restoreState();
                currentAngle += angle;
            }

            // Draw a white circle in middle for donut look (optional but looks modern)
            cb.saveState();
            cb.setColorFill(BaseColor.WHITE);
            cb.circle(centerX, centerY, radius * 0.4f);
            cb.fill();
            cb.restoreState();
        }
    }

    private void addStatCard(PdfPTable table, String label, String value, BaseColor color, Font lFont, Font vFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(8);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(230, 230, 230));
        cell.setBackgroundColor(BaseColor.WHITE);
        cell.setBorderWidthLeft(3);
        cell.setBorderColorLeft(color);

        Paragraph pLabel = new Paragraph(label, lFont);
        pLabel.setSpacingAfter(2);
        cell.addElement(pLabel);

        Paragraph pValue = new Paragraph("Rs. " + value.split("\\.")[0], vFont); // Show int part for cleaner look in
                                                                                 // cards
        pValue.setLeading(12);
        cell.addElement(pValue);

        table.addCell(cell);
    }

    private void addSectionHeaderWithDesc(Document doc, String title, String desc, BaseColor titleColor, Font tFont,
            Font dFont) throws DocumentException {
        Paragraph t = new Paragraph(title, tFont);
        doc.add(t);
        Paragraph d = new Paragraph(desc, dFont);
        d.setSpacingAfter(4);
        doc.add(d);
        doc.add(new com.itextpdf.text.pdf.draw.LineSeparator(0.5f, 100f, new BaseColor(243, 244, 246),
                Element.ALIGN_CENTER, -2));
    }

    private void addStatBox(PdfPTable table, String label, String value, BaseColor color, Font lFont, Font vFont) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(new BaseColor(230, 230, 230));
        cell.setBackgroundColor(BaseColor.WHITE);

        Paragraph pLabel = new Paragraph(label, lFont);
        pLabel.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLabel);

        Paragraph pValue = new Paragraph("Rs. " + value, vFont);
        pValue.setAlignment(Element.ALIGN_CENTER);
        pValue.setSpacingBefore(5);
        cell.addElement(pValue);

        table.addCell(cell);
    }

    private void addInfoCell(PdfPTable table, String label, String value, BaseColor bg) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(BaseColor.LIGHT_GRAY);

        Paragraph pLabel = new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.GRAY));
        Paragraph pValue = new Paragraph(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.BLACK));

        cell.addElement(pLabel);
        cell.addElement(pValue);
        table.addCell(cell);
    }

    private void addDetailCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        cell.addElement(new Paragraph(label, labelFont));
        if (value == null)
            value = "-";
        cell.addElement(new Paragraph(value, valueFont));
        table.addCell(cell);
    }

    private void addSectionHeader(Document doc, String title, BaseColor color, Font font) throws DocumentException {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(10);
        p.setSpacingAfter(2);
        doc.add(p);
        // Draw line
        // iText 5 doesn't have easy HR, but we can do a thin table or line separator
        doc.add(new com.itextpdf.text.pdf.draw.LineSeparator(1f, 100f, color, Element.ALIGN_CENTER, -2));
    }

    private void addRow(PdfPTable table, String desc, String amount, Font font, Font boldFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(desc, font));
        c1.setPadding(6);
        c1.setBorderColor(BaseColor.LIGHT_GRAY);

        PdfPCell c2 = new PdfPCell(new Phrase(amount, boldFont));
        c2.setPadding(6);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorderColor(BaseColor.LIGHT_GRAY);

        table.addCell(c1);
        table.addCell(c2);
    }

    private void addTotalRow(PdfPTable table, String label, String amount, BaseColor color) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, color)));
        c1.setPadding(8);
        c1.setBorder(Rectangle.TOP);
        c1.setBorderColor(color);

        PdfPCell c2 = new PdfPCell(new Phrase(amount, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, color)));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorder(Rectangle.TOP);
        c2.setBorderColor(color);

        table.addCell(c1);
        table.addCell(c2);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null)
            return "0.00";
        DecimalFormat df = new DecimalFormat("#,###.00");
        return df.format(amount);
    }
}
