package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                // Test Accounts with username and email
                
                // Operational Manager
                userRepository.save(User.builder()
                        .username("ops")
                        .password(passwordEncoder.encode("ops123"))
                        .email("ops@ace.com")
                        .fullName("Operational Manager")
                        .nicNumber("NIC001")
                        .mobileNumber("0771234567")
                        .role(Role.OPERATION_MANAGER)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Area Manager
                userRepository.save(User.builder()
                        .username("areamanager")
                        .password(passwordEncoder.encode("areamanager123"))
                        .email("areamanager@ace.com")
                        .fullName("Area Manager")
                        .nicNumber("NIC002")
                        .mobileNumber("0771234568")
                        .role(Role.AREA_MANAGER)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Security Officer
                userRepository.save(User.builder()
                        .username("security")
                        .password(passwordEncoder.encode("security123"))
                        .email("security@ace.com")
                        .fullName("Security Officer")
                        .nicNumber("NIC003")
                        .mobileNumber("0771234569")
                        .role(Role.SECURITY_OFFICER)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Accountant
                userRepository.save(User.builder()
                        .username("accountant")
                        .password(passwordEncoder.encode("accountant123"))
                        .email("accountant@ace.com")
                        .fullName("Accountant")
                        .nicNumber("NIC004")
                        .mobileNumber("0771234570")
                        .role(Role.ACCOUNT_EXECUTIVE)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Executive Officer
                userRepository.save(User.builder()
                        .username("exec")
                        .password(passwordEncoder.encode("exec123"))
                        .email("exec@ace.com")
                        .fullName("Executive Officer")
                        .nicNumber("NIC005")
                        .mobileNumber("0771234571")
                        .role(Role.EXECUTIVE_OFFICER)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Chairman
                userRepository.save(User.builder()
                        .username("chairman")
                        .password(passwordEncoder.encode("chairman123"))
                        .email("chairman@ace.com")
                        .fullName("Chairman")
                        .nicNumber("NIC006")
                        .mobileNumber("0771234572")
                        .role(Role.CHAIRMAN)
                        .firstLogin(false)
                        .active(true)
                        .build());

                // Director
                userRepository.save(User.builder()
                        .username("director")
                        .password(passwordEncoder.encode("director123"))
                        .email("director@ace.com")
                        .fullName("Director")
                        .nicNumber("NIC007")
                        .mobileNumber("0771234573")
                        .role(Role.DIRECTOR)
                        .firstLogin(false)
                        .active(true)
                        .build());

                System.out.println("✓ Default users seeded to database successfully!");
            }
        };
    }
}
