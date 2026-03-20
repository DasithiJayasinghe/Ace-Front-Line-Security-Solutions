package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.enums.Designation;
import com.security.Ace.Front.Line.Security.Solutions.enums.Equipment;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.enums.Sex;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserRequest {

    // Login credentials

    private String username;
    private String password;
    private Role role;
    // Personal Information
    private String fullName;
    private String nicNumber;
    private Sex sex;
    private String email;
    private String residentialAddress;
    private String mobileNumber;
    private LocalDate dateOfBirth;
    private String emergencyContact;

    // Professional Details
    private String professionalCertificate;

    private String assignedArea;

    private String assignedCompany; // for security officers and area managers

    private LocalDate joinDate;

    private Designation designation; // for security officers only

    private Double basicSalary;

    private String adminPosition; // for admin roles

    private String specialSkills;

    private List<Equipment> handoverEquipment;

    // Bank Details
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;
}