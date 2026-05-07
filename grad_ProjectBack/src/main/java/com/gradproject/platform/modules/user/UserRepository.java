package com.gradproject.platform.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleOrderByNameAsc(UserRole role);
    long countByRole(UserRole role);
    List<User> findTop5ByOrderByCreatedAtDesc();
}
