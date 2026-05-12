package com.gradproject.platform.modules.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByStudentId(UUID studentId);
    boolean existsByStudentIdAndStatusNot(UUID studentId, ProjectStatus status);
    Optional<Project> findByTeamId(UUID teamId);
    List<Project> findBySupervisorId(UUID supervisorId);
    List<Project> findBySupervisorIdOrderByCreatedAtDesc(UUID supervisorId);
    List<Project> findTop5BySupervisorIdOrderByCreatedAtDesc(UUID supervisorId);
    List<Project> findTop5ByOrderByCreatedAtDesc();
    List<Project> findBySupervisorIsNullOrderByCreatedAtDesc();
    long countBySupervisorId(UUID supervisorId);
    long countByStatus(ProjectStatus status);
    long countBySupervisorIdAndStatus(UUID supervisorId, ProjectStatus status);
    long countBySupervisorIsNull();
}

