package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByNicNumber(String nicNumber);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByNicNumber(String nicNumber);

    List<User> findByRole(Role role);

    long countByRole(Role role);

    List<User> findByAssignedArea(String area);

    List<User> findByAssignedAreaAndRole(String area, Role role);

    List<User> findByRoleIn(List<Role> roles);
}
