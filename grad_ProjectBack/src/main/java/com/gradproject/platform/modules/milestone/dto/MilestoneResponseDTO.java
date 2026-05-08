package com.gradproject.platform.modules.milestone.dto;

import com.gradproject.platform.modules.milestone.MilestoneStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MilestoneResponseDTO(
        UUID id,
        UUID projectId,
        String projectTitle,
        String title,
        String description,
        LocalDate deadlineDate,
        String keyRequirements,
        MilestoneStatus status,
        Instant completedDate,
        String reviewFeedback,
        String submissionFilePath,
        String submissionFileName,
        String submissionNotes,
        Instant submittedAt,
        UUID createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt
) {
}
