package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                // Operational Manager
                userRepository.save(new User(null, "ops@ace.com", "ops123", "OPERATIONAL_MANAGER"));

                // Executives (3 accounts)
                userRepository.save(new User(null, "exec1@ace.com", "exec123", "EXECUTIVE"));
                userRepository.save(new User(null, "exec2@ace.com", "exec123", "EXECUTIVE"));
                userRepository.save(new User(null, "exec3@ace.com", "exec123", "EXECUTIVE"));

                // Chairman
                userRepository.save(new User(null, "chairman@ace.com", "chairman123", "CHAIRMAN"));

                // Director
                userRepository.save(new User(null, "director@ace.com", "director123", "DIRECTOR"));

                //Area Manager
                userRepository.save(new User(null, "am@ace.com", "uthu", "AREA_MANAGER"));


                System.out.println("Default users seeded to database.");
            }
        };
    }
}
