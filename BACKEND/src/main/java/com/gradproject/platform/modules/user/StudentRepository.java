package com.gradproject.platform.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<User, UUID> {

    @Query("SELECT new com.gradproject.platform.modules.user.StudentDTO(u.id, u.name, u.firstName, u.lastName, u.email, u.universityId, u.department, u.profilePhotoUrl) "
            + "FROM User u WHERE u.role = :role "
            + "AND (LOWER(COALESCE(u.name, '')) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(u.firstName, '')) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(u.lastName, '')) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(u.universityId, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<StudentDTO> searchStudents(@Param("q") String query, @Param("role") UserRole role);

}



