package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.enums.Designation;
import com.security.Ace.Front.Line.Security.Solutions.enums.Equipment;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.enums.Sex;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private Role role;

    // Personal
    private String fullName;
    private String nicNumber;
    private Sex sex;
    private String email;
    private String residentialAddress;
    private String mobileNumber;
    private LocalDate dateOfBirth;
    private String emergencyContact;
    private String photoUrl;

    // Professional
    private String professionalCertificate;
    private String assignedArea;
    private String assignedCompany;
    private LocalDate joinDate;
    private Designation designation;
    private Double basicSalary;
    private String adminPosition;
    private String specialSkills;
    private List<Equipment> handoverEquipment;

    // Bank
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;

    private LocalDateTime createdAt;
}