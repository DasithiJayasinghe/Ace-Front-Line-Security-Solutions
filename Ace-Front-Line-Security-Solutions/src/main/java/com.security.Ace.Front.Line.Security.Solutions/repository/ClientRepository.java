package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.ClientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    // Find by username
    Optional<Client> findByUsername(String username);

    // Check if exists
    boolean existsByUsername(String username);
    boolean existsByContactPersonEmail(String email);
    boolean existsByCompanyRegistrationNo(String registrationNo);

    // Find by status
    List<Client> findByStatus(ClientStatus status);

    // Count active clients
    @Query("SELECT COUNT(c) FROM Client c WHERE c.status = 'ACTIVE'")
    long countActiveClients();

    // Find recently registered (last 30 days) - FIXED
    @Query(value = "SELECT * FROM clients WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY registered_at DESC", nativeQuery = true)
    List<Client> findRecentlyRegistered();

    // Search clients by company name or city
    @Query("SELECT c FROM Client c WHERE LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.city) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Client> searchClients(String keyword);
}
