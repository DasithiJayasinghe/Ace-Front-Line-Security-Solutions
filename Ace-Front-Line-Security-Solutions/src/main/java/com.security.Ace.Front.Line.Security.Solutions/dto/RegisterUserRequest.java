package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.enums.Designation;
import com.security.Ace.Front.Line.Security.Solutions.enums.Equipment;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.enums.Sex;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RegisterUserRequest {

    // Login credentials
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    // Personal Information
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "NIC number is required")
    private String nicNumber;

    @NotNull(message = "Sex is required")
    private Sex sex;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Residential address is required")
    private String residentialAddress;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Emergency contact is required")
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