package com.gradproject.platform.modules.project.submission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProposalSubmissionRepository extends JpaRepository<ProposalSubmission, UUID> {
    List<ProposalSubmission> findByProjectIdOrderByVersionNumberDesc(UUID projectId);
    Optional<ProposalSubmission> findFirstByProjectIdOrderByVersionNumberDesc(UUID projectId);
    Optional<ProposalSubmission> findByIdAndProjectId(UUID id, UUID projectId);
    boolean existsByProjectIdAndVersionNumber(UUID projectId, Integer versionNumber);
}
