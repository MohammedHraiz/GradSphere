package com.gradproject.platform.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRoleOrderByNameAsc(UserRole role);
    long countByRole(UserRole role);
    List<User> findTop5ByOrderByCreatedAtDesc();
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
    boolean existsByUniversityIdIgnoreCase(String universityId);
    boolean existsByUniversityIdIgnoreCaseAndIdNot(String universityId, UUID id);

    @Query("""
            select u
            from User u
            where (:search is null
                or lower(u.name) like :search
                or lower(u.email) like :search
                or lower(coalesce(u.universityId, '')) like :search)
              and (:role is null or u.role = :role)
              and (:department is null or u.department = :department)
            order by u.createdAt desc, u.name asc
            """)
    List<User> searchUsers(
            @Param("search") String search,
            @Param("role") UserRole role,
            @Param("department") UserDepartment department
    );
}
