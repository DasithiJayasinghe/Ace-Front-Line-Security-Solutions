package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataSeeder {

        @Bean
        CommandLineRunner initDatabase(UserRepository userRepository) {
                return args -> {
                        if (userRepository.count() == 0) {
                                userRepository.save(User.builder()
                                                .username("ops@ace.com").email("ops@ace.com").password("ops123")
                                                .nicNumber("00000001V")
                                                .fullName("Operational Manager").role(Role.OPERATION_MANAGER)
                                                .bankAccountNumber("0000000000").bankName("Bank of Ceylon")
                                                .bankBranch("Colombo")
                                                .basicSalary(75000.0).mobileNumber("0112345678")
                                                .residentialAddress("Colombo, Sri Lanka").build());

                                userRepository.save(User.builder()
                                                .username("exec1@ace.com").email("exec1@ace.com").password("exec123")
                                                .nicNumber("00000002V")
                                                .fullName("Executive One").role(Role.EXECUTIVE_OFFICER)
                                                .bankAccountNumber("1111111111").bankName("Peoples Bank")
                                                .bankBranch("Kandy")
                                                .basicSalary(45000.0).mobileNumber("0112345679")
                                                .residentialAddress("Kandy, Sri Lanka").build());

                                userRepository.save(User.builder()
                                                .username("exec2@ace.com").email("exec2@ace.com").password("exec123")
                                                .nicNumber("00000003V")
                                                .fullName("Executive Two").role(Role.EXECUTIVE_OFFICER)
                                                .bankAccountNumber("2222222222").bankName("HNB").bankBranch("Galle")
                                                .basicSalary(45000.0).mobileNumber("0112345680")
                                                .residentialAddress("Galle, Sri Lanka").build());

                                userRepository.save(User.builder()
                                                .username("exec3@ace.com").email("exec3@ace.com").password("exec123")
                                                .nicNumber("00000004V")
                                                .fullName("Executive Three").role(Role.EXECUTIVE_OFFICER)
                                                .bankAccountNumber("3333333333").bankName("Commercial Bank")
                                                .bankBranch("Jaffna")
                                                .basicSalary(45000.0).mobileNumber("0112345681")
                                                .residentialAddress("Jaffna, Sri Lanka").build());

                                userRepository.save(User.builder()
                                                .username("chairman@ace.com").email("chairman@ace.com")
                                                .password("chairman123").nicNumber("00000005V")
                                                .fullName("The Chairman").role(Role.CHAIRMAN)
                                                .bankAccountNumber("4444444444").bankName("Sampath Bank")
                                                .bankBranch("Colombo")
                                                .basicSalary(150000.0).mobileNumber("0112345682")
                                                .residentialAddress("Colombo 7, Sri Lanka").build());

                                userRepository.save(User.builder()
                                                .username("director@ace.com").email("director@ace.com")
                                                .password("director123").nicNumber("00000006V")
                                                .fullName("The Director").role(Role.DIRECTOR)
                                                .bankAccountNumber("5555555555").bankName("Seylan Bank")
                                                .bankBranch("Colombo")
                                                .basicSalary(120000.0).mobileNumber("0112345683")
                                                .residentialAddress("Colombo 3, Sri Lanka").build());

                                System.out.println("Default users seeded to database.");
                        }
                };
        }
}
