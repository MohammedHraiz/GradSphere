package com.gradproject.platform.modules.project.storage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findFirstByProfileUserId(UUID profileUserId);

    Optional<StoredFile> findFirstByMilestoneId(UUID milestoneId);

    Optional<StoredFile> findFirstByProposalSubmissionId(UUID proposalSubmissionId);

    Optional<StoredFile> findFirstByProjectIdAndKindOrderByCreatedAtDesc(UUID projectId, StoredFileKind kind);
}
