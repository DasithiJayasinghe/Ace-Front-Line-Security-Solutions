package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.exception.DuplicateResourceException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final AssignedOfficerRepository assignedOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public ClientResponse registerClient(ClientRegistrationRequest request) {
        // Check for duplicates
        String username = generateUsername(request.getCompanyName());

        if (clientRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Client", "company name", request.getCompanyName());
        }

        if (clientRepository.existsByContactPersonEmail(request.getContactPersonEmail())) {
            throw new DuplicateResourceException("Client", "email", request.getContactPersonEmail());
        }

        if (request.getCompanyRegistrationNo() != null &&
                clientRepository.existsByCompanyRegistrationNo(request.getCompanyRegistrationNo())) {
            throw new DuplicateResourceException("Client", "registration number", request.getCompanyRegistrationNo());
        }

        // Generate password
        String password = generateRandomPassword();

        // Create client entity
        Client client = new Client();
        client.setCompanyName(request.getCompanyName());
        client.setCompanyRegistrationNo(request.getCompanyRegistrationNo());
        client.setIndustryType(request.getIndustryType());
        client.setAddress(request.getAddress());
        client.setCity(request.getCity());
        client.setContactPersonName(request.getContactPersonName());
        client.setContactPersonEmail(request.getContactPersonEmail());
        client.setContactPersonPhone(request.getContactPersonPhone());
        client.setUsername(username);
        client.setPasswordHash(passwordEncoder.encode(password));
        client.setServiceStartDate(request.getServiceStartDate());
        client.setContractDurationMonths(request.getContractDurationMonths());
        client.setMonthlyBaseFee(BigDecimal.valueOf(request.getMonthlyBaseFee()));
        client.setOtRatePerHour(BigDecimal.valueOf(request.getOtRatePerHour()));
        client.setRiskLevel(RiskLevel.valueOf(request.getRiskLevel()));
        client.setRecommendedOfficers(request.getRecommendedOfficers());
        client.setStatus(ClientStatus.ACTIVE);
        client.setIsFirstLogin(true);
        client.setRegisteredAt(LocalDateTime.now());

        Client savedClient = clientRepository.save(client);
        emailService.sendCredentialsEmail(savedClient, password);
        ClientResponse response = mapToResponse(savedClient);
        response.setTemporaryPassword(password);
        return response;
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getActiveClients() {
        return clientRepository.findByStatus(ClientStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));
        return mapToResponse(client);
    }

    @Transactional
    public ClientResponse updateClient(Integer clientId, ClientUpdateRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        // Update fields
        if (request.getCompanyName() != null) {
            client.setCompanyName(request.getCompanyName());
        }
        if (request.getAddress() != null) {
            client.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            client.setCity(request.getCity());
        }
        if (request.getContactPersonName() != null) {
            client.setContactPersonName(request.getContactPersonName());
        }
        if (request.getContactPersonEmail() != null) {
            client.setContactPersonEmail(request.getContactPersonEmail());
        }
        if (request.getContactPersonPhone() != null) {
            client.setContactPersonPhone(request.getContactPersonPhone());
        }
        if (request.getMonthlyBaseFee() != null) {
            client.setMonthlyBaseFee(BigDecimal.valueOf(request.getMonthlyBaseFee()));
        }
        if (request.getOtRatePerHour() != null) {
            client.setOtRatePerHour(BigDecimal.valueOf(request.getOtRatePerHour()));
        }
        if (request.getContractDurationMonths() != null) {
            client.setContractDurationMonths(request.getContractDurationMonths());
        }
        if (request.getRiskLevel() != null) {
            client.setRiskLevel(RiskLevel.valueOf(request.getRiskLevel()));
        }
        if (request.getRecommendedOfficers() != null) {
            client.setRecommendedOfficers(request.getRecommendedOfficers());
        }

        client.setUpdatedAt(LocalDateTime.now());
        Client updatedClient = clientRepository.save(client);

        return mapToResponse(updatedClient);
    }

    @Transactional
    public void suspendClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        client.setStatus(ClientStatus.SUSPENDED);
        clientRepository.save(client);
    }

    @Transactional
    public void terminateClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        client.setStatus(ClientStatus.TERMINATED);
        clientRepository.save(client);
    }

    @Transactional
    public void reactivateClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        client.setStatus(ClientStatus.ACTIVE);
        clientRepository.save(client);
    }

    // Helper methods
    private String generateUsername(String companyName) {
        String cleaned = companyName.toLowerCase()
                .replaceAll("[^a-z0-9]", "");

        String baseUsername = cleaned.substring(0, Math.min(10, cleaned.length()));

        // Handle empty result (company name had no alphanumeric chars)
        if (baseUsername.isEmpty()) {
            baseUsername = "client";
        }

        String username = baseUsername;
        int counter = 1;

        while (clientRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }

        return username;
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        Random random = new Random();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 12; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }

    private ClientResponse mapToResponse(Client client) {
        ClientResponse response = new ClientResponse();
        response.setClientId(client.getClientId());
        response.setCompanyName(client.getCompanyName());
        response.setCompanyRegistrationNo(client.getCompanyRegistrationNo());
        response.setIndustryType(client.getIndustryType());
        response.setAddress(client.getAddress());
        response.setCity(client.getCity());
        response.setContactPersonName(client.getContactPersonName());
        response.setContactPersonEmail(client.getContactPersonEmail());
        response.setContactPersonPhone(client.getContactPersonPhone());
        response.setUsername(client.getUsername());
        response.setServiceStartDate(client.getServiceStartDate());
        response.setContractDurationMonths(client.getContractDurationMonths());
        response.setMonthlyBaseFee(client.getMonthlyBaseFee().doubleValue());
        response.setOtRatePerHour(client.getOtRatePerHour().doubleValue());
        response.setRiskLevel(client.getRiskLevel().toString());
        response.setRecommendedOfficers(client.getRecommendedOfficers());
        response.setStatus(client.getStatus().toString());
        response.setRegisteredAt(client.getRegisteredAt());
        response.setUpdatedAt(client.getUpdatedAt());

        // Calculate active officers count
        long activeOfficers = assignedOfficerRepository.countActiveOfficersForClient(client.getClientId());
        response.setActiveOfficersCount((int) activeOfficers);

        // Calculate total outstanding
        Double outstanding = invoiceRepository.getTotalOutstandingAmount();
        response.setTotalOutstanding(outstanding != null ? outstanding : 0.0);

        return response;
    }
}
