package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.Branch;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientCompany;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.BranchRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientCompanyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    private static final String AREA_MANAGER_PASSWORD = "area123";

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            BranchRepository branchRepository,
            ClientCompanyRepository clientCompanyRepository
    ) {
        return args -> {
            if (userRepository.count() == 0) {

                Branch colombo = branchRepository.save(new Branch(null, "Colombo"));
                Branch kandy = branchRepository.save(new Branch(null, "Kandy"));
                Branch kurunegala = branchRepository.save(new Branch(null, "Kurunegala"));
                Branch rathnapura = branchRepository.save(new Branch(null, "Rathnapura"));

                ClientCompany company1 = clientCompanyRepository.save(
                        new ClientCompany(null, "ABC Company", colombo)
                );
                ClientCompany company2 = clientCompanyRepository.save(
                        new ClientCompany(null, "BlueWave Solutions", colombo)
                );
                ClientCompany company3 = clientCompanyRepository.save(
                        new ClientCompany(null, "GreenLeaf Pvt Ltd", kandy)
                );
                ClientCompany company4 = clientCompanyRepository.save(
                        new ClientCompany(null, "NextGen Technologies", kurunegala)
                );
                ClientCompany company5 = clientCompanyRepository.save(
                        new ClientCompany(null, "Sunrise Enterprises", rathnapura)
                );

                userRepository.save(new User(null, "ops@ace.com", "ops123", "OPERATIONAL_MANAGER", null, null, null));

                userRepository.save(new User(null, "exec1@ace.com", "exec123", "EXECUTIVE", null, null, null));
                userRepository.save(new User(null, "exec2@ace.com", "exec123", "EXECUTIVE", null, null, null));
                userRepository.save(new User(null, "exec3@ace.com", "exec123", "EXECUTIVE", null, null, null));

                userRepository.save(new User(null, "chairman@ace.com", "chairman123", "CHAIRMAN", null, null, null));

                userRepository.save(new User(null, "director@ace.com", "director123", "DIRECTOR", null, null, null));

                userRepository.save(new User(null, "areamanager@ace.com", AREA_MANAGER_PASSWORD, "AREA_MANAGER", null, null, colombo));
                userRepository.save(new User(null, "areamanager1@ace.com", AREA_MANAGER_PASSWORD, "AREA_MANAGER", null, null, kandy));
                userRepository.save(new User(null, "areamanager2@ace.com", AREA_MANAGER_PASSWORD, "AREA_MANAGER", null, null, kurunegala));
                userRepository.save(new User(null, "areamanager3@ace.com", AREA_MANAGER_PASSWORD, "AREA_MANAGER", null, null, rathnapura));
                userRepository.save(new User(null, "am@ace.com", "uthu", "AREA_MANAGER", null, null, colombo));

                userRepository.save(new User(null, "officer@ace.com", "officer123", "SECURITY_OFFICER", "CSO", company1, null));
                userRepository.save(new User(null, "officer1@ace.com", "officer123", "SECURITY_OFFICER", "JSO", company1, null));
                userRepository.save(new User(null, "officer2@ace.com", "officer123", "SECURITY_OFFICER", "SSO", company1, null));
                userRepository.save(new User(null, "officer3@ace.com", "officer123", "SECURITY_OFFICER", "LSO", company1, null));

                userRepository.save(new User(null, "officer4@ace.com", "officer123", "SECURITY_OFFICER", "CSO", company2, null));
                userRepository.save(new User(null, "officer5@ace.com", "officer123", "SECURITY_OFFICER", "JSO", company2, null));
                userRepository.save(new User(null, "officer6@ace.com", "officer123", "SECURITY_OFFICER", "SSO", company2, null));
                userRepository.save(new User(null, "officer7@ace.com", "officer123", "SECURITY_OFFICER", "LSO", company2, null));

                userRepository.save(new User(null, "officer8@ace.com", "officer123", "SECURITY_OFFICER", "CSO", company3, null));
                userRepository.save(new User(null, "officer9@ace.com", "officer123", "SECURITY_OFFICER", "JSO", company3, null));
                userRepository.save(new User(null, "officer10@ace.com", "officer123", "SECURITY_OFFICER", "SSO", company3, null));
                userRepository.save(new User(null, "officer11@ace.com", "officer123", "SECURITY_OFFICER", "LSO", company3, null));

                userRepository.save(new User(null, "officer12@ace.com", "officer123", "SECURITY_OFFICER", "CSO", company4, null));
                userRepository.save(new User(null, "officer13@ace.com", "officer123", "SECURITY_OFFICER", "JSO", company4, null));
                userRepository.save(new User(null, "officer14@ace.com", "officer123", "SECURITY_OFFICER", "SSO", company4, null));
                userRepository.save(new User(null, "officer15@ace.com", "officer123", "SECURITY_OFFICER", "LSO", company4, null));

                userRepository.save(new User(null, "officer16@ace.com", "officer123", "SECURITY_OFFICER", "CSO", company5, null));
                userRepository.save(new User(null, "officer17@ace.com", "officer123", "SECURITY_OFFICER", "JSO", company5, null));
                userRepository.save(new User(null, "officer18@ace.com", "officer123", "SECURITY_OFFICER", "SSO", company5, null));
                userRepository.save(new User(null, "officer19@ace.com", "officer123", "SECURITY_OFFICER", "LSO", company5, null));

                System.out.println("Default users, branches, and client companies seeded to database.");
            }
        };
    }
}
