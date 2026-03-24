package com.security.Ace.Front.Line.Security.Solutions.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Make nic_number nullable (needed for Chairman/Director who don't have NIC)
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN nic_number VARCHAR(255) NULL");
            log.info("DB migration: nic_number set to nullable.");
        } catch (Exception e) {
            // Column is already nullable or migration ran before — safe to ignore
            log.debug("DB migration (nic_number): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN sex ENUM('MALE','FEMALE') NULL");
            log.info("DB migration: sex set to nullable.");
        } catch (Exception e) {
            log.debug("DB migration (sex): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN residential_address TEXT NULL");
            log.info("DB migration: residential_address set to nullable.");
        } catch (Exception e) {
            log.debug("DB migration (residential_address): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(255) NULL");
            log.info("DB migration: mobile_number set to nullable.");
        } catch (Exception e) {
            log.debug("DB migration (mobile_number): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN date_of_birth DATE NULL");
            log.info("DB migration: date_of_birth set to nullable.");
        } catch (Exception e) {
            log.debug("DB migration (date_of_birth): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users MODIFY COLUMN emergency_contact VARCHAR(255) NULL");
            log.info("DB migration: emergency_contact set to nullable.");
        } catch (Exception e) {
            log.debug("DB migration (emergency_contact): {}", e.getMessage());
        }
    }
}
