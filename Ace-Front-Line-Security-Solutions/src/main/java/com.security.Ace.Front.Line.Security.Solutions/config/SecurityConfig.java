package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.util.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── Public ───────────────────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/feedback/homepage").permitAll()
                        .requestMatchers("/error").permitAll()

                        // ── Operational Manager ──────────────────────────────────────
                        .requestMatchers("/api/clients/register")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/clients/*/suspend")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/clients/*/terminate")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/clients/*/reactivate")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/clients/*/renew")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/clients/expiring-soon")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/deductions/**")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")
                        .requestMatchers("/api/feedback/*/approve")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/feedback/*/reject")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/dashboard/admin/**")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/officer-assignments/**")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER")

                        // ── Accountant ───────────────────────────────────────────────
                        .requestMatchers("/api/invoices/*/approve")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/invoices/*/issue")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/invoices/*/cancel")
                        .hasAnyRole("ACCOUNTANT", "ADMIN")
                        .requestMatchers("/api/invoices/*/waive")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/invoices/*/dispute")
                        .hasAnyRole("ACCOUNTANT", "ADMIN")
                        .requestMatchers("/api/invoices/draft")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/payments/verify")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/payments/overdue")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/payments/ledger")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/payments/*/waive-late-fee")
                        .hasRole("ACCOUNTANT")
                        .requestMatchers("/api/dashboard/accountant/**")
                        .hasRole("ACCOUNTANT")

                        // ── Staff view access ────────────────────────────────────────
                        .requestMatchers("/api/clients")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")
                        .requestMatchers("/api/clients/active")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")
                        .requestMatchers("/api/invoices")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")
                        .requestMatchers("/api/invoices/overdue")
                        .hasAnyRole("ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")
                        .requestMatchers("/api/invoices/client/**")
                        .hasAnyRole("CLIENT", "ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")

                        // ── Client — own data only ───────────────────────────────────
                        .requestMatchers("/api/dashboard/client/**")
                        .hasRole("CLIENT")
                        .requestMatchers("/api/feedback/client/**")
                        .hasAnyRole("CLIENT", "ADMIN", "OPERATIONAL_MANAGER")
                        .requestMatchers("/api/payments")
                        .hasRole("CLIENT")

                        // ── PDF — clients + all staff ────────────────────────────────
                        .requestMatchers("/api/pdf/**")
                        .hasAnyRole("CLIENT", "ADMIN", "OPERATIONAL_MANAGER", "ACCOUNTANT")

                        // ── Everything else needs authentication ─────────────────────
                        .anyRequest().authenticated()
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}