package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.security.Ace.Front.Line.Security.Solutions.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private boolean firstLogin = true;
    private boolean active = true;

    // Personal Information
    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = true)
    private String nicNumber;

    @Enumerated(EnumType.STRING)
    private Sex sex;

    @Column(unique = true, nullable = true)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String residentialAddress;

    private String mobileNumber;

    private LocalDate dateOfBirth;

    private String emergencyContact;

    @Column(name = "photo_path")
    private String photoPath;

    // Professional Details
    private String professionalCertificate;

    private String assignedArea;

    private String assignedCompany; // only for security officers & area managers

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Enumerated(EnumType.STRING)
    private Designation designation; // only for security officers

    private Double basicSalary;

    // Admin position title (for non-security officer admins)
    private String adminPosition;

    private String specialSkills;

    // Handover Equipment (stored as comma-separated enum names)
    @ElementCollection
    @CollectionTable(name = "user_equipment", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "equipment")
    private List<Equipment> handoverEquipment = new ArrayList<>();

    // Bank Details
    private String bankName;
    private String bankAccountNumber;
    private String bankBranch;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}