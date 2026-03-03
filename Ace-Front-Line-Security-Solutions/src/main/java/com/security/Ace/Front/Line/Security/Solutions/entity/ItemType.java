package com.security.Ace.Front.Line.Security.Solutions.entity;

/**
 * Line item types matching the AFLSS invoice structure exactly.
 *
 * OIC_SERVICE  — Officer-in-Charge: Strength × No. of Shifts × Rate per Shift
 * JSO_SERVICE  — Junior Security Officer: Strength × No. of Shifts × Rate per Shift
 * OVERTIME     — OT hours × OT rate per hour
 * OTHER_CHARGE — Admin/misc charges
 * DEDUCTION    — Absence, misconduct, SLA breach, equipment non-compliance, custom
 * SSCL         — 2.5% SSCL on Invoice Amount (separate named line)
 * VAT          — 18% VAT on Invoice Amount (separate named line)
 * LATE_FEE     — 1.5% per month on outstanding balance (applied from 20th)
 */
public enum ItemType {
    OIC_SERVICE,
    JSO_SERVICE,
    OVERTIME,   // legacy — use OIC_OT / JSO_OT for rank-specific OT
    OIC_OT,     // OT hours for OIC officers × oicOtRatePerHour
    JSO_OT,     // OT hours for JSO officers × jsoOtRatePerHour
    OTHER_CHARGE,
    DEDUCTION,
    SSCL,
    VAT,
    LATE_FEE
}