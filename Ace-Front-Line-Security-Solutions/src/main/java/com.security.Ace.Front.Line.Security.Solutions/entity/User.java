package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // e.g. AREA_MANAGER, OPERATIONAL_MANAGER, EXECUTIVE, CHAIRMAN, DIRECTOR

    // Columns from the existing shared `users` table (all optional in this app)

    @Column
    private Boolean active;

    @Column(name = "admin_position")
    private String adminPosition;

    @Column(name = "assigned_area")
    private String assignedArea;

    @Column(name = "assigned_company")
    private String assignedCompany;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_branch")
    private String bankBranch;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "basic_salay")
    private Double basicSalary;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column
    private String designation;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "first_login")
    private Boolean firstLogin;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "nic_number")
    private String nicNumber;

    @Column(name = "photo_path")
    private String photoPath;

    @Column(name = "professional_certificate")
    private String professionalCertificate;

    @Column(name = "residential_address", columnDefinition = "text")
    private String residentialAddress;

    @Column
    private String sex;

    @Column(name = "special_skills")
    private String specialSkills;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column
    private String username;

    // Relationships expected by repositories/services (e.g. findByRoleAndBranch_Id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_company_id")
    private ClientCompany clientCompany;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // Convenience constructor used by DataSeeder and other simple creations
    public User(Long id, String email, String password, String role) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    /** Seeder / shift scheduling: designation, client company (officers), branch (area managers). */
    public User(Long id, String email, String password, String role, String designation,
                  ClientCompany clientCompany, Branch branch) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.designation = designation;
        this.clientCompany = clientCompany;
        this.branch = branch;
    }
}
