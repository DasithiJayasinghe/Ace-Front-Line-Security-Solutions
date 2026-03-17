package com.security.Ace.Front.Line.Security.Solutions.entity;

/**
 * Per guide: officers work 12-hour shifts.
 * DAY_12HR  — 12-hour day shift (primary)
 * NIGHT_12HR — 12-hour night shift (primary)
 * ROTATING  — Alternating day/night
 */
public enum ShiftType {
    DAY_12HR,
    NIGHT_12HR,
    ROTATING
}