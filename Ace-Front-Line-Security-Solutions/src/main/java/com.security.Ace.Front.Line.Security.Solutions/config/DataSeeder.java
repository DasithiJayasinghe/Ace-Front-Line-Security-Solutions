package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy;
import com.security.Ace.Front.Line.Security.Solutions.entity.JobVacancy.VacancyStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import com.security.Ace.Front.Line.Security.Solutions.repository.JobVacancyRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private JobVacancyRepository vacancyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private com.security.Ace.Front.Line.Security.Solutions.repository.ServiceInquiryRepository serviceInquiryRepository;

    @Autowired(required = false)
    private com.security.Ace.Front.Line.Security.Solutions.repository.GeneralInquiryRepository generalInquiryRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed job vacancies if no vacancies exist
        if (vacancyRepository.count() == 0) {
            seedJobVacancies();
        }
        // Seed users if no users exist
        if (userRepository.count() == 0) {
            seedUsers();
        }
        // Seed inquiries if empty
        if (serviceInquiryRepository != null && serviceInquiryRepository.count() == 0) {
            seedServiceInquiries();
        }
        if (generalInquiryRepository != null && generalInquiryRepository.count() == 0) {
            seedGeneralInquiries();
        }
    }

    private void seedUsers() {
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

        System.out.println("Default users seeded to database successfully!");
    }

    private void seedJobVacancies() {
        // Security Officer - Entry Level
        JobVacancy vacancy1 = new JobVacancy();
        vacancy1.setJobTitle("Security Officer - Entry Level");
        vacancy1.setDescription("We are looking for dedicated and vigilant Security Officers to join our growing team.");
        vacancy1.setRequirements("High school diploma or equivalent\nValid Security Clearance (or willingness to obtain)\nStrong communication and observation skills\nPhysical fitness and ability to work long hours\nClean criminal record\nMust be at least 21 years old");
        vacancy1.setExperienceLevel("ENTRY");
        vacancy1.setLocation("New York, NY");
        vacancy1.setMinSalary(28000.0);
        vacancy1.setMaxSalary(35000.0);
        vacancy1.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy1);

        // Security Officer - Intermediate Level
        JobVacancy vacancy2 = new JobVacancy();
        vacancy2.setJobTitle("Security Officer - Intermediate Level");
        vacancy2.setDescription("Join our Security team as an experienced Security Officer with supervisory responsibilities.");
        vacancy2.setRequirements("High school diploma or equivalent\n2-5 years of security experience\nValid Security Clearance\nLeadership and team management skills\nCPR/First Aid Certification\nKnowledge of surveillance systems\nClean criminal record");
        vacancy2.setExperienceLevel("INTERMEDIATE");
        vacancy2.setLocation("Los Angeles, CA");
        vacancy2.setMinSalary(38000.0);
        vacancy2.setMaxSalary(48000.0);
        vacancy2.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy2);

        // Senior Security Officer
        JobVacancy vacancy3 = new JobVacancy();
        vacancy3.setJobTitle("Senior Security Officer");
        vacancy3.setDescription("We are seeking an experienced Senior Security Officer to lead our security operations.");
        vacancy3.setRequirements("Bachelor's degree in Security Management or related field (preferred)\n5+ years of security experience with at least 2 years in a supervisory role\nTop Secret Security Clearance\nAdvanced knowledge of security systems and protocols\nEmergency response and crisis management experience\nExcellent communication and leadership skills\nClean criminal record");
        vacancy3.setExperienceLevel("SENIOR");
        vacancy3.setLocation("Chicago, IL");
        vacancy3.setMinSalary(55000.0);
        vacancy3.setMaxSalary(70000.0);
        vacancy3.setStatus(VacancyStatus.OPEN);
        vacancyRepository.save(vacancy3);

        // Security Manager/Expert
        JobVacancy vacancy4 = new JobVacancy();
        vacancy4.setJobTitle("Security Manager - Expert Level");
        vacancy4.setDescription("Ace Front Line Security Solutions seeks an Expert-level Security Manager to oversee all security operations.");
        vacancy4.setRequirements("Bachelor's degree in Security Management, Law, or related field\n10+ years of security management experience\nTop Secret/SCI Security Clearance required\nExpert knowledge of security systems, protocols, and regulations\nRisk assessment and threat analysis experience\nBudget management and personnel management experience\nStrategic planning and problem-solving abilities\nClean criminal record");
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

        System.out.println("Database seeded with 5 job vacancies successfully!");
    }

    private void seedServiceInquiries() {
        if (serviceInquiryRepository == null) return;
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
        if (generalInquiryRepository == null) return;
        com.security.Ace.Front.Line.Security.Solutions.entity.GeneralInquiry g = new com.security.Ace.Front.Line.Security.Solutions.entity.GeneralInquiry();
        g.setFullName("Jane Smith");
        g.setEmail("jane.smith@example.com");
        g.setPhoneNumber("0777654321");
        g.setSubject("Question about application process");
        g.setMessage("How do I apply for a security officer position?");
        generalInquiryRepository.save(g);
    }
}
