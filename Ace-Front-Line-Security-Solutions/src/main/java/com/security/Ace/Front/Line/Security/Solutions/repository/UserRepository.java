package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"clientCompany", "branch"})
    Optional<User> findDetailedByEmail(String email);

    List<User> findByRole(String role);
    List<User> findByRoleAndClientCompany_Id(String role, Long clientCompanyId);
    List<User> findByRoleAndBranch_Id(String role, Long branchId);
    List<User> findByRoleAndDesignationAndClientCompany_Id(String role, String designation, Long clientCompanyId);
}