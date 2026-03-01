package com.security.Ace.Front.Line.Security.Solutions.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
                return authConfig.getAuthenticationManager();
        }

        // define an in-memory user store with a few test accounts and roles
        @Bean
        public org.springframework.security.provisioning.InMemoryUserDetailsManager userDetailsService(
                        PasswordEncoder encoder) {
                var admin = org.springframework.security.core.userdetails.User
                                .withUsername("admin")
                                .password(encoder.encode("123"))
                                .roles("ADMIN")
                                .build();
                var ops = org.springframework.security.core.userdetails.User
                                .withUsername("ops_manager")
                                .password(encoder.encode("ops123"))
                                .roles("OPERATIONAL_MANAGER")
                                .build();
                var director = org.springframework.security.core.userdetails.User
                                .withUsername("director")
                                .password(encoder.encode("dir123"))
                                .roles("DIRECTOR")
                                .build();
                var exec = org.springframework.security.core.userdetails.User
                                .withUsername("exec")
                                .password(encoder.encode("exec123"))
                                .roles("EXECUTIVE")
                                .build();
                return new org.springframework.security.provisioning.InMemoryUserDetailsManager(admin, ops, director,
                                exec);
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(authorize -> authorize
                                                // Auth endpoint must be public
                                                .requestMatchers("/api/auth/**").permitAll()
                                                // Public endpoints for job applications
                                                .requestMatchers("/api/public/**").permitAll()
                                                .requestMatchers("/api/applications/apply").permitAll()

                                                // Public inquiry submission endpoints
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/inquiries/service")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/inquiries/general")
                                                .permitAll()

                                                // Public CV submission endpoint
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/cv-submissions/submit")
                                                .permitAll()

                                                // Protected endpoints for admin/operational manager
                                                .requestMatchers("/api/vacancies/**").authenticated()
                                                .requestMatchers("/api/applications/**").authenticated()
                                                .requestMatchers("/api/interviews/**").authenticated()
                                                .requestMatchers("/api/inquiries/**").authenticated()
                                                .requestMatchers("/api/cv-submissions/**").authenticated()

                                                // All other requests require authentication
                                                .anyRequest().authenticated())
                                .httpBasic(basic -> {
                                });

                return http.build();
        }
}
