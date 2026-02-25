package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy.VacancyStatus;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private com.security.Ace.Front.Line.Security.Solutions.repository.ServiceInquiryRepository serviceInquiryRepository;

    @Autowired
    private com.security.Ace.Front.Line.Security.Solutions.repository.GeneralInquiryRepository generalInquiryRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only seed data if no vacancies exist
        if (vacancyRepository.count() == 0) {
            seedJobVacancies();
        }
        // seed inquiries if empty
        if (serviceInquiryRepository.count() == 0) {
            seedServiceInquiries();
        }
        if (generalInquiryRepository.count() == 0) {
            seedGeneralInquiries();
        }
    }

    private void seedJobVacancies() {
        // Security Officer - Entry Level
        JobVacancy vacancy1 = new JobVacancy();
        vacancy1.setJobTitle("Security Officer - Entry Level");
        vacancy1.setDescription("We are looking for dedicated and vigilant Security Officers to join our growing team. " +
                "As a Security Officer, you will be responsible for monitoring and protecting our premises, assets, and personnel. " +
                "This is an excellent opportunity for individuals with a commitment to maintaining a safe and secure environment.");
        vacancy1.setRequirements("High school diploma or equivalent\n" +
                "Valid Security Clearance (or willingness to obtain)\n" +
                "Strong communication and observation skills\n" +
                "Physical fitness and ability to work long hours\n" +
                "Clean criminal record\n" +
                "Must be at least 21 years old");
        vacancy1.setExperienceLevel("ENTRY");
        vacancy1.setLocation("New York, NY");
        vacancy1.setMinSalary(28000.0);
        vacancy1.setMaxSalary(35000.0);
        vacancy1.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy1);

        // Security Officer - Intermediate Level
        JobVacancy vacancy2 = new JobVacancy();
        vacancy2.setJobTitle("Security Officer - Intermediate Level");
        vacancy2.setDescription("Join our Security team as an experienced Security Officer with supervisory responsibilities. " +
                "This role involves coordinating with a team of security personnel, implementing security protocols, and managing incidents. " +
                "We are looking for individuals with proven experience and leadership abilities.");
        vacancy2.setRequirements("High school diploma or equivalent\n" +
                "2-5 years of security experience\n" +
                "Valid Security Clearance\n" +
                "Leadership and team management skills\n" +
                "CPR/First Aid Certification\n" +
                "Knowledge of surveillance systems\n" +
                "Clean criminal record");
        vacancy2.setExperienceLevel("INTERMEDIATE");
        vacancy2.setLocation("Los Angeles, CA");
        vacancy2.setMinSalary(38000.0);
        vacancy2.setMaxSalary(48000.0);
        vacancy2.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy2);

        // Senior Security Officer
        JobVacancy vacancy3 = new JobVacancy();
        vacancy3.setJobTitle("Senior Security Officer");
        vacancy3.setDescription("We are seeking an experienced Senior Security Officer to lead our security operations. " +
                "This position requires strategic thinking, decision-making under pressure, and expertise in security management. " +
                "You will oversee security protocols, train personnel, and ensure the highest standards of protection.");
        vacancy3.setRequirements("Bachelor's degree in Security Management or related field (preferred)\n" +
                "5+ years of security experience with at least 2 years in a supervisory role\n" +
                "Top Secret Security Clearance\n" +
                "Advanced knowledge of security systems and protocols\n" +
                "Emergency response and crisis management experience\n" +
                "Excellent communication and leadership skills\n" +
                "Clean criminal record");
        vacancy3.setExperienceLevel("SENIOR");
        vacancy3.setLocation("Chicago, IL");
        vacancy3.setMinSalary(55000.0);
        vacancy3.setMaxSalary(70000.0);
        vacancy3.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy3);

        // Security Manager/Expert
        JobVacancy vacancy4 = new JobVacancy();
        vacancy4.setJobTitle("Security Manager - Expert Level");
        vacancy4.setDescription("Ace Front Line Security Solutions seeks an Expert-level Security Manager to oversee all security operations. " +
                "This is a strategic role requiring extensive experience in security management, risk assessment, and personnel management. " +
                "You will develop security policies, manage budgets, and ensure compliance with industry standards.");
        vacancy4.setRequirements("Bachelor's degree in Security Management, Law, or related field\n" +
                "10+ years of security management experience\n" +
                "Top Secret/SCI Security Clearance required\n" +
                "Expert knowledge of security systems, protocols, and regulations\n" +
                "Risk assessment and threat analysis experience\n" +
                "Budget management and personnel management experience\n" +
                "Strategic planning and problem-solving abilities\n" +
                "Clean criminal record");
        vacancy4.setExperienceLevel("EXPERT");
        vacancy4.setLocation("Washington, DC");
        vacancy4.setMinSalary(75000.0);
        vacancy4.setMaxSalary(95000.0);
        vacancy4.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy4);

        // Closed Vacancy Example
        JobVacancy vacancy5 = new JobVacancy();
        vacancy5.setJobTitle("Security Officer - Part-Time (CLOSED)");
        vacancy5.setDescription("This position is no longer available.");
        vacancy5.setRequirements("N/A");
        vacancy5.setExperienceLevel("ENTRY");
        vacancy5.setLocation("Boston, MA");
        vacancy5.setMinSalary(20000.0);
        vacancy5.setMaxSalary(25000.0);
        vacancy5.setStatus(VacancyStatus.CLOSED);
        vacancyRepository.save(vacancy5);

        System.out.println("✓ Database seeded with 5 job vacancies successfully!");
    }

    private void seedServiceInquiries() {
        com.security.Ace.Front.Line.Security.Solutions.entity.ServiceInquiry s = new com.security.Ace.Front.Line.Security.Solutions.entity.ServiceInquiry();
        s.setCompanyName("Acme Corp");
        s.setContactPerson("John Doe");
        s.setEmail("john.doe@acme.com");
        s.setPhoneNumber("0771234567");
        s.setCompanyAddress("123 Main St, Colombo");
        s.setNumberOfOfficers(10);
        s.setServiceLocation("Colombo");
        s.setServiceDuration("Long-term");
        s.setAdditionalNotes("Need night shift coverage.");
        serviceInquiryRepository.save(s);
    }

    private void seedGeneralInquiries() {
        com.security.Ace.Front.Line.Security.Solutions.entity.GeneralInquiry g = new com.security.Ace.Front.Line.Security.Solutions.entity.GeneralInquiry();
        g.setFullName("Jane Smith");
        g.setEmail("jane.smith@example.com");
        g.setPhoneNumber("0777654321");
        g.setSubject("Question about application process");
        g.setMessage("How do I apply for a security officer position?");
        generalInquiryRepository.save(g);
    }
}
