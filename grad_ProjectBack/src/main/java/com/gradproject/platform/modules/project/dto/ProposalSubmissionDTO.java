package com.gradproject.platform.modules.project.dto;

import java.time.Instant;
import java.util.UUID;

public record ProposalSubmissionDTO(
        UUID id,
        UUID projectId,
        Integer versionNumber,
        String description,
        String studentChangeNote,
        String submittedByName,
        Instant submittedAt,
        boolean hasFile,
        boolean isLatest
) {
}
