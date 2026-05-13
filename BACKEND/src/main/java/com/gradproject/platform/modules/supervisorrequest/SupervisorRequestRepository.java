package com.gradproject.platform.modules.supervisorrequest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupervisorRequestRepository extends JpaRepository<SupervisorRequest, UUID> {
    List<SupervisorRequest> findBySupervisorIdAndStatusOrderByCreatedAtDesc(UUID supervisorId, SupervisorRequestStatus status);
    List<SupervisorRequest> findByProjectId(UUID projectId);
    List<SupervisorRequest> findByTeamIdOrderByCreatedAtDesc(UUID teamId);
    void deleteByTeamId(UUID teamId);
    List<SupervisorRequest> findByProjectIdAndStatus(UUID projectId, SupervisorRequestStatus status);
    List<SupervisorRequest> findTop5ByOrderByCreatedAtDesc();
    List<SupervisorRequest> findTop5BySupervisorIdAndStatusOrderByCreatedAtDesc(UUID supervisorId, SupervisorRequestStatus status);
    boolean existsByProjectIdAndStatus(UUID projectId, SupervisorRequestStatus status);
    boolean existsByProjectIdAndSupervisorIdAndStatus(UUID projectId, UUID supervisorId, SupervisorRequestStatus status);
    long countByStatus(SupervisorRequestStatus status);
    long countBySupervisorIdAndStatus(UUID supervisorId, SupervisorRequestStatus status);
    Optional<SupervisorRequest> findFirstByTeamIdAndStatusOrderByCreatedAtDesc(UUID teamId, SupervisorRequestStatus status);
    Optional<SupervisorRequest> findFirstByTeamIdOrderByCreatedAtDesc(UUID teamId);
}
