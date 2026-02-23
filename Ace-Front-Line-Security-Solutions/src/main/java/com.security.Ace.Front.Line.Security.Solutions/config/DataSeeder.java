package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.repository.BankDetailsRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository,
                                   ClientRepository clientRepository,
                                   BankDetailsRepository bankDetailsRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {

            if (userRepository.count() == 0) {
                userRepository.save(new User(null, "ops@ace.com",
                        passwordEncoder.encode("ops123"), "OPERATIONAL_MANAGER", true, LocalDateTime.now(), null));

                userRepository.save(new User(null, "exec1@ace.com",
                        passwordEncoder.encode("exec123"), "EXECUTIVE", true, LocalDateTime.now(), null));
                userRepository.save(new User(null, "exec2@ace.com",
                        passwordEncoder.encode("exec123"), "EXECUTIVE", true, LocalDateTime.now(), null));
                userRepository.save(new User(null, "exec3@ace.com",
                        passwordEncoder.encode("exec123"), "EXECUTIVE", true, LocalDateTime.now(), null));

                userRepository.save(new User(null, "chairman@ace.com",
                        passwordEncoder.encode("chairman123"), "CHAIRMAN", true, LocalDateTime.now(), null));

                userRepository.save(new User(null, "director@ace.com",
                        passwordEncoder.encode("director123"), "DIRECTOR", true, LocalDateTime.now(), null));

                userRepository.save(new User(null, "accountant@ace.com",
                        passwordEncoder.encode("accountant123"), "ACCOUNTANT", true, LocalDateTime.now(), null));

                System.out.println(" Default staff users seeded with encrypted passwords.");
            }

            // ── Ace Bank Details (used on all invoices) ──────────────────────────────
            if (bankDetailsRepository.count() == 0) {
                BankDetails aceBank = new BankDetails();
                aceBank.setBankName("Bank of Ceylon");
                aceBank.setAccountName("Ace Front Line Security Solutions (PVT) Ltd");
                aceBank.setAccountNumber("79289055");
                aceBank.setBranchName("Lake View Branch");
                aceBank.setBranchCode("612");
                aceBank.setSwiftCode("BCEYLKLX");
                aceBank.setIsActive(true);
                bankDetailsRepository.save(aceBank);
                System.out.println(" Ace bank details seeded (Bank of Ceylon, A/C: 79289055).");
            }

            // ── Test Clients ──────────────────────────────────────────────────────────
            if (clientRepository.count() == 0) {

                // Client 1 — ABC Corporation
                Client client1 = new Client();
                client1.setClientCode("ACE-2024-001");
                client1.setCompanyName("ABC Corporation");
                client1.setCompanyRegistrationNo("ABC-2024-001");
                client1.setVatNumber("VAT-ABC-001");
                client1.setIndustryType("Manufacturing");
                client1.setAddress("123 Business Street, Colombo 03");
                client1.setServiceLocation("123 Business Street, Colombo 03");
                client1.setCity("Colombo");
                client1.setContactPersonName("John Doe");
                client1.setContactPersonDesignation("Finance Manager");
                client1.setContactPersonEmail("john@abc.com");
                client1.setContactPersonPhone("0771234567");
                client1.setUsername("abc_corp");
                client1.setPasswordHash(passwordEncoder.encode("client123"));
                client1.setIsFirstLogin(true);
                client1.setServiceStartDate(LocalDate.of(2024, 1, 1));
                client1.setContractDurationMonths(12);
                // Invoice calculation fields — OIC + JSO strength and rates
                client1.setOicCount(2);
                client1.setJsoCount(4);
                client1.setOicRatePerShift(new BigDecimal("2871.93"));
                client1.setJsoRatePerShift(new BigDecimal("2701.93"));
                client1.setOtRatePerHour(new BigDecimal("500.00"));
                client1.setRiskLevel(RiskLevel.MEDIUM);
                client1.setRecommendedOfficers(6);
                client1.setStatus(ClientStatus.ACTIVE);
                client1.setRegisteredAt(LocalDateTime.now());
                client1.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(client1);

                // Client 2 — XYZ Industries
                Client client2 = new Client();
                client2.setClientCode("ACE-2024-002");
                client2.setCompanyName("XYZ Industries");
                client2.setCompanyRegistrationNo("XYZ-2024-002");
                client2.setVatNumber("VAT-XYZ-002");
                client2.setIndustryType("Retail");
                client2.setAddress("456 Commerce Road, Kandy");
                client2.setServiceLocation("456 Commerce Road, Kandy");
                client2.setCity("Kandy");
                client2.setContactPersonName("Jane Smith");
                client2.setContactPersonDesignation("Operations Director");
                client2.setContactPersonEmail("jane@xyz.com");
                client2.setContactPersonPhone("0777654321");
                client2.setUsername("xyz_industries");
                client2.setPasswordHash(passwordEncoder.encode("client123"));
                client2.setIsFirstLogin(true);
                client2.setServiceStartDate(LocalDate.of(2024, 2, 1));
                client2.setContractDurationMonths(24);
                // Invoice calculation fields — OIC + JSO strength and rates
                client2.setOicCount(3);
                client2.setJsoCount(5);
                client2.setOicRatePerShift(new BigDecimal("2871.93"));
                client2.setJsoRatePerShift(new BigDecimal("2701.93"));
                client2.setOtRatePerHour(new BigDecimal("600.00"));
                client2.setRiskLevel(RiskLevel.HIGH);
                client2.setRecommendedOfficers(8);
                client2.setStatus(ClientStatus.ACTIVE);
                client2.setRegisteredAt(LocalDateTime.now());
                client2.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(client2);

                System.out.println(" Test client accounts created:");
                System.out.println("   - Username: abc_corp     / Password: client123");
                System.out.println("   - Username: xyz_industries / Password: client123");
            }
        };
    }
}







//
//package com.security.Ace.Front.Line.Security.Solutions.config;
//
//import com.security.Ace.Front.Line.Security.Solutions.entity.*;
//import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
//import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//
//@Configuration
//public class DataSeeder {
//
//    @Bean
//    CommandLineRunner initDatabase(UserRepository userRepository,
//                                   ClientRepository clientRepository,
//                                   PasswordEncoder passwordEncoder) {
//        return args -> {
//            if (userRepository.count() == 0) {
//                userRepository.save(new User(null, "ops@ace.com",
//                        passwordEncoder.encode("ops123"), "OPERATIONAL_MANAGER"));
//
//                userRepository.save(new User(null, "exec1@ace.com",
//                        passwordEncoder.encode("exec123"), "EXECUTIVE"));
//                userRepository.save(new User(null, "exec2@ace.com",
//                        passwordEncoder.encode("exec123"), "EXECUTIVE"));
//                userRepository.save(new User(null, "exec3@ace.com",
//                        passwordEncoder.encode("exec123"), "EXECUTIVE"));
//
//                userRepository.save(new User(null, "chairman@ace.com",
//                        passwordEncoder.encode("chairman123"), "CHAIRMAN"));
//
//                userRepository.save(new User(null, "director@ace.com",
//                        passwordEncoder.encode("director123"), "DIRECTOR"));
//
//                userRepository.save(new User(null, "accountant@ace.com",
//                        passwordEncoder.encode("accountant123"), "ACCOUNTANT"));
//
//                System.out.println("Default staff users seeded with encrypted passwords.");
//            }
//
//            if (clientRepository.count() == 0) {
//                Client client1 = new Client();
//                client1.setCompanyName("ABC Corporation");
//                client1.setCompanyRegistrationNo("ABC-2024-001");
//                client1.setIndustryType("Manufacturing");
//                client1.setAddress("123 Business Street, Colombo 03");
//                client1.setCity("Colombo");
//                client1.setContactPersonName("John Doe");
//                client1.setContactPersonEmail("john@abc.com");
//                client1.setContactPersonPhone("0771234567");
//                client1.setUsername("abc_corp");
//                client1.setPasswordHash(passwordEncoder.encode("client123"));
//                client1.setIsFirstLogin(true);
//                client1.setServiceStartDate(LocalDate.of(2024, 1, 1));
//                client1.setContractDurationMonths(12);
//                client1.setMonthlyBaseFee(BigDecimal.valueOf(50000.00));
//                client1.setOtRatePerHour(BigDecimal.valueOf(500.00));
//                client1.setRiskLevel(RiskLevel.MEDIUM);
//                client1.setRecommendedOfficers(3);
//                client1.setStatus(ClientStatus.ACTIVE);
//                client1.setRegisteredAt(LocalDateTime.now());
//                client1.setUpdatedAt(LocalDateTime.now());
//
//                clientRepository.save(client1);
//
//                Client client2 = new Client();
//                client2.setCompanyName("XYZ Industries");
//                client2.setCompanyRegistrationNo("XYZ-2024-002");
//                client2.setIndustryType("Retail");
//                client2.setAddress("456 Commerce Road, Kandy");
//                client2.setCity("Kandy");
//                client2.setContactPersonName("Jane Smith");
//                client2.setContactPersonEmail("jane@xyz.com");
//                client2.setContactPersonPhone("0777654321");
//                client2.setUsername("xyz_industries");
//                client2.setPasswordHash(passwordEncoder.encode("client123"));
//                client2.setIsFirstLogin(true);
//                client2.setServiceStartDate(LocalDate.of(2024, 2, 1));
//                client2.setContractDurationMonths(24);
//                client2.setMonthlyBaseFee(BigDecimal.valueOf(75000.00));
//                client2.setOtRatePerHour(BigDecimal.valueOf(600.00));
//                client2.setRiskLevel(RiskLevel.HIGH);
//                client2.setRecommendedOfficers(5);
//                client2.setStatus(ClientStatus.ACTIVE);
//                client2.setRegisteredAt(LocalDateTime.now());
//                client2.setUpdatedAt(LocalDateTime.now());
//
//                clientRepository.save(client2);
//
//                System.out.println(" Test client accounts created:");
//                System.out.println("   - Username: abc_corp / Password: client123");
//                System.out.println("   - Username: xyz_industries / Password: client123");
//            }
//        };
//    }
//}